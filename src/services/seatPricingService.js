import { supabase } from '../lib/supabase'

// ============================================
// SEAT PRICING SERVICE
// ============================================

/**
 * Get seat pricing for a theater or hall
 */
export const getSeatPricing = async (theaterId, hallId = null) => {
  let query = supabase
    .from('seat_pricing')
    .select('*')
    .eq('theater_id', theaterId)
    .eq('is_active', true)
    .order('seat_type')

  if (hallId) {
    query = query.eq('hall_id', hallId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Get seat pricing by seat type for a theater/hall
 */
export const getSeatPricingByType = async (theaterId, hallId = null) => {
  const pricing = await getSeatPricing(theaterId, hallId)
  
  // Convert array to object with seat_type as key
  const pricingMap = {}
  pricing.forEach(p => {
    pricingMap[p.seat_type] = p.base_price
  })
  
  return pricingMap
}

/**
 * Create or update seat pricing
 */
export const upsertSeatPricing = async (theaterId, hallId, seatType, basePrice) => {
  // Check if pricing already exists
  const { data: existing } = await supabase
    .from('seat_pricing')
    .select('id')
    .eq('theater_id', theaterId)
    .eq('hall_id', hallId)
    .eq('seat_type', seatType)
    .maybeSingle()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('seat_pricing')
      .update({
        base_price: basePrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single()

    if (error) throw error
    return data
  } else {
    // Create new
    const { data, error } = await supabase
      .from('seat_pricing')
      .insert({
        theater_id: theaterId,
        hall_id: hallId,
        seat_type: seatType,
        base_price: basePrice,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}

/**
 * Batch update seat pricing for multiple seat types
 */
export const batchUpdateSeatPricing = async (theaterId, hallId, pricingData) => {
  const results = []
  
  for (const [seatType, basePrice] of Object.entries(pricingData)) {
    try {
      const result = await upsertSeatPricing(theaterId, hallId, seatType, basePrice)
      results.push(result)
    } catch (error) {
      console.error(`Error updating pricing for ${seatType}:`, error)
      throw error
    }
  }
  
  return results
}

/**
 * Delete seat pricing
 */
export const deleteSeatPricing = async (pricingId) => {
  const { error } = await supabase
    .from('seat_pricing')
    .delete()
    .eq('id', pricingId)

  if (error) throw error
}

/**
 * Deactivate seat pricing (soft delete)
 */
export const deactivateSeatPricing = async (pricingId) => {
  const { data, error } = await supabase
    .from('seat_pricing')
    .update({
      is_active: false,
      updated_at: new Date().toISOString()
    })
    .eq('id', pricingId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get pricing for specific seats with zone multipliers
 */
export const calculateSeatPrices = async (seatIds, theaterId, hallId = null) => {
  // Get seat details with zones
  const { data: seats, error: seatsError } = await supabase
    .from('seats')
    .select(`
      id,
      seat_type,
      zone_id,
      seat_zones (
        price_multiplier
      )
    `)
    .in('id', seatIds)

  if (seatsError) throw seatsError

  // Get base pricing
  const basePricing = await getSeatPricingByType(theaterId, hallId)

  // Calculate final prices
  const seatPrices = seats.map(seat => {
    const basePrice = basePricing[seat.seat_type] || 250000 // Default price
    const multiplier = seat.seat_zones?.price_multiplier || 1.0
    const finalPrice = Math.round(basePrice * multiplier)

    return {
      seat_id: seat.id,
      seat_type: seat.seat_type,
      base_price: basePrice,
      multiplier,
      final_price: finalPrice
    }
  })

  return seatPrices
}

/**
 * Calculate seat prices without updating database (RLS-safe)
 * Returns pricing information that can be used by frontend
 */
export const calculateSeatPricesForHall = async (hallId, theaterId) => {
  try {
    // Get all seats in hall
    const { data: seats, error: seatsError } = await supabase
      .from('seats')
      .select(`
        id,
        seat_type,
        zone_id,
        seat_zones (
          price_multiplier
        )
      `)
      .eq('hall_id', hallId)

    if (seatsError) throw seatsError

    // Get base pricing
    const basePricing = await getSeatPricingByType(theaterId, hallId)

    // Calculate prices without updating database
    const seatPrices = seats.map(seat => {
      const basePrice = basePricing[seat.seat_type] || 250000
      const multiplier = seat.seat_zones?.price_multiplier || 1.0
      const finalPrice = Math.round(basePrice * multiplier)

      return {
        seat_id: seat.id,
        seat_type: seat.seat_type,
        base_price: basePrice,
        multiplier,
        final_price: finalPrice
      }
    })

    return { success: true, seatPrices, count: seatPrices.length }
  } catch (error) {
    console.error('Error calculating seat prices:', error)
    throw error
  }
}

/**
 * Update seat final prices in database based on current pricing
 * Falls back to calculation-only if RLS prevents updates or network issues occur
 */
export const updateSeatFinalPrices = async (hallId, theaterId) => {
  try {
    // First try to calculate prices
    const calculation = await calculateSeatPricesForHall(hallId, theaterId)
    
    // Try to update database, but don't fail if RLS prevents it or network issues occur
    try {
      const updatePromises = calculation.seatPrices.map(async (seatPrice) => {
        try {
          const { error } = await supabase
            .from('seats')
            .update({
              base_price: seatPrice.base_price,
              final_price: seatPrice.final_price
            })
            .eq('id', seatPrice.seat_id)

          return { id: seatPrice.seat_id, success: !error, error }
        } catch (networkError) {
          console.warn(`Network error updating seat ${seatPrice.seat_id}:`, networkError)
          return { id: seatPrice.seat_id, success: false, error: networkError, isNetworkError: true }
        }
      })

      const results = await Promise.allSettled(updatePromises)
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failed = results.filter(r => r.status === 'rejected' || !r.value?.success).length
      const networkErrors = results.filter(r => 
        r.status === 'fulfilled' && r.value?.isNetworkError
      ).length

      console.log(`Updated ${successful} seats in database, ${failed} failed (${networkErrors} network errors)`)

      let note = 'All updates successful'
      if (networkErrors > 0) {
        note = 'Some updates failed due to network issues, but pricing calculation is available'
      } else if (failed > 0) {
        note = 'Some updates failed due to RLS, but pricing calculation is available'
      }

      return { 
        success: true, 
        updated: successful, 
        failed,
        networkErrors,
        calculation: calculation.seatPrices,
        note: failed > 0 ? note : 'All updates successful'
      }
    } catch (updateError) {
      console.warn('Database update failed, but pricing calculation succeeded:', updateError)
      
      const isNetworkError = updateError.message?.includes('fetch') || 
                           updateError.message?.includes('network') ||
                           updateError.message?.includes('CORS') ||
                           updateError.code === 'NETWORK_ERROR'
      
      return { 
        success: true, 
        updated: 0, 
        failed: calculation.count,
        networkErrors: isNetworkError ? calculation.count : 0,
        calculation: calculation.seatPrices,
        note: isNetworkError ? 
          'Network issues prevented database update, using calculated prices' :
          'Database update prevented by RLS, using calculated prices'
      }
    }
  } catch (error) {
    console.error('Error updating seat final prices:', error)
    
    // If even calculation fails, provide fallback
    if (error.message?.includes('fetch') || error.message?.includes('network')) {
      throw new Error('Network connection issues. Please check your internet connection and try again.')
    }
    
    throw error
  }
}

/**
 * Get default pricing for seat types
 */
export const getDefaultSeatPricing = () => {
  return {
    standard: 250000,
    vip: 500000,
    couple: 600000,
    wheelchair: 250000,
    premium: 350000,
    economy: 150000
  }
}

/**
 * Initialize default pricing for a theater/hall
 */
export const initializeDefaultPricing = async (theaterId, hallId = null) => {
  const defaultPricing = getDefaultSeatPricing()
  return await batchUpdateSeatPricing(theaterId, hallId, defaultPricing)
}

/**
 * Copy pricing from one hall to another
 */
export const copyPricingBetweenHalls = async (sourceHallId, targetHallId, theaterId) => {
  // Get source pricing
  const sourcePricing = await getSeatPricingByType(theaterId, sourceHallId)
  
  if (Object.keys(sourcePricing).length === 0) {
    throw new Error('Source hall has no pricing configuration')
  }
  
  // Apply to target hall
  return await batchUpdateSeatPricing(theaterId, targetHallId, sourcePricing)
}

/**
 * Get pricing statistics for a theater
 */
export const getPricingStatistics = async (theaterId) => {
  const { data, error } = await supabase
    .from('seat_pricing')
    .select(`
      seat_type,
      base_price,
      hall_id,
      halls (
        name,
        capacity
      )
    `)
    .eq('theater_id', theaterId)
    .eq('is_active', true)

  if (error) throw error

  // Group by seat type and calculate stats
  const stats = {}
  data.forEach(pricing => {
    const type = pricing.seat_type
    if (!stats[type]) {
      stats[type] = {
        count: 0,
        min_price: pricing.base_price,
        max_price: pricing.base_price,
        avg_price: 0,
        halls: []
      }
    }
    
    stats[type].count++
    stats[type].min_price = Math.min(stats[type].min_price, pricing.base_price)
    stats[type].max_price = Math.max(stats[type].max_price, pricing.base_price)
    stats[type].halls.push({
      hall_id: pricing.hall_id,
      hall_name: pricing.halls?.name,
      price: pricing.base_price
    })
  })

  // Calculate averages
  Object.keys(stats).forEach(type => {
    const totalPrice = stats[type].halls.reduce((sum, hall) => sum + hall.price, 0)
    stats[type].avg_price = Math.round(totalPrice / stats[type].count)
  })

  return stats
}