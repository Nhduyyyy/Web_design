import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { getSeatPricingByType, getDefaultSeatPricing, calculateSeatPricesForHall } from '../services/seatPricingService'
import { calculateSeatPrice, applySeatPricing } from '../utils/seatPricingUtils'

/**
 * Hook for managing seat pricing with real-time updates
 */
export const useSeatPricing = (theaterId, hallId = null) => {
  const [pricing, setPricing] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load pricing from database
  const loadPricing = useCallback(async () => {
    if (!theaterId) return

    try {
      setLoading(true)
      setError(null)
      
      const pricingData = await getSeatPricingByType(theaterId, hallId)
      
      // Merge with defaults for any missing types
      const defaultPricing = getDefaultSeatPricing()
      const mergedPricing = { ...defaultPricing, ...pricingData }
      
      setPricing(mergedPricing)
    } catch (err) {
      console.error('Error loading pricing:', err)
      setError(err.message)
      // Use default pricing on error
      setPricing(getDefaultSeatPricing())
    } finally {
      setLoading(false)
    }
  }, [theaterId, hallId])

  // Load pricing on mount and when dependencies change
  useEffect(() => {
    loadPricing()
  }, [loadPricing])

  // Set up real-time subscription for pricing changes
  useEffect(() => {
    if (!theaterId) return

    const channel = supabase
      .channel(`seat-pricing-${theaterId}-${hallId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_pricing',
          filter: hallId 
            ? `theater_id=eq.${theaterId}&hall_id=eq.${hallId}`
            : `theater_id=eq.${theaterId}`
        },
        () => {
          // Reload pricing when changes occur
          loadPricing()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [theaterId, hallId, loadPricing])

  return {
    pricing,
    loading,
    error,
    reload: loadPricing
  }
}

/**
 * Hook for getting price for a specific seat type
 */
export const useSeatTypePrice = (theaterId, hallId, seatType) => {
  const { pricing, loading, error } = useSeatPricing(theaterId, hallId)
  
  const price = pricing[seatType] || getDefaultSeatPricing()[seatType] || 250000
  
  return {
    price,
    loading,
    error
  }
}

/**
 * Hook for calculating total price of selected seats with real-time pricing
 * Uses calculation-based approach to avoid RLS issues
 */
export const useBookingTotal = (selectedSeats, theaterId, hallId = null) => {
  const { pricing, loading } = useSeatPricing(theaterId, hallId)
  
  const total = selectedSeats.reduce((sum, seat) => {
    // Use seat's actual price if available
    if (seat.final_price || seat.price) {
      return sum + (seat.final_price || seat.price)
    }
    
    // Calculate price using current pricing
    const seatType = seat.type || seat.seat_type
    const price = calculateSeatPrice(seatType, pricing, seat.zone_multiplier || 1.0)
    return sum + price
  }, 0)
  
  return {
    total,
    loading
  }
}

/**
 * Hook for getting calculated seat prices for a hall (RLS-safe)
 */
export const useCalculatedSeatPrices = (hallId, theaterId) => {
  const [seatPrices, setSeatPrices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const calculatePrices = useCallback(async () => {
    if (!hallId || !theaterId) return

    try {
      setLoading(true)
      setError(null)
      
      const result = await calculateSeatPricesForHall(hallId, theaterId)
      
      if (result.success) {
        setSeatPrices(result.seatPrices)
      } else {
        throw new Error('Failed to calculate seat prices')
      }
    } catch (err) {
      console.error('Error calculating seat prices:', err)
      setError(err.message)
      setSeatPrices([])
    } finally {
      setLoading(false)
    }
  }, [hallId, theaterId])

  useEffect(() => {
    calculatePrices()
  }, [calculatePrices])

  return {
    seatPrices,
    loading,
    error,
    recalculate: calculatePrices
  }
}