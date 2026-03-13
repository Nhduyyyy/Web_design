/**
 * Utility functions for seat pricing calculations
 * These functions work without requiring database updates (RLS-safe)
 */

import { getDefaultSeatPricing } from '../services/seatPricingService'

/**
 * Calculate final price for a seat based on type, base pricing, and zone multiplier
 */
export const calculateSeatPrice = (seatType, basePricing, zoneMultiplier = 1.0) => {
  const basePrice = basePricing[seatType] || getDefaultSeatPricing()[seatType] || 250000
  return Math.round(basePrice * zoneMultiplier)
}

/**
 * Apply pricing to a list of seats
 */
export const applySeatPricing = (seats, basePricing) => {
  return seats.map(seat => ({
    ...seat,
    price: calculateSeatPrice(seat.seat_type || seat.type, basePricing, seat.zone_multiplier || 1.0),
    base_price: basePricing[seat.seat_type || seat.type] || getDefaultSeatPricing()[seat.seat_type || seat.type] || 250000
  }))
}

/**
 * Calculate total revenue for seats with current pricing
 */
export const calculateTotalRevenue = (seats, basePricing) => {
  return seats.reduce((total, seat) => {
    const price = calculateSeatPrice(seat.seat_type || seat.type, basePricing, seat.zone_multiplier || 1.0)
    return total + price
  }, 0)
}

/**
 * Get pricing statistics for a hall
 */
export const getSeatPricingStats = (seats, basePricing) => {
  const stats = {
    total: seats.length,
    byType: {},
    totalRevenue: 0
  }

  seats.forEach(seat => {
    const type = seat.seat_type || seat.type
    const price = calculateSeatPrice(type, basePricing, seat.zone_multiplier || 1.0)
    
    if (!stats.byType[type]) {
      stats.byType[type] = {
        count: 0,
        totalPrice: 0,
        avgPrice: 0
      }
    }
    
    stats.byType[type].count++
    stats.byType[type].totalPrice += price
    stats.totalRevenue += price
  })

  // Calculate averages
  Object.keys(stats.byType).forEach(type => {
    stats.byType[type].avgPrice = Math.round(stats.byType[type].totalPrice / stats.byType[type].count)
  })

  return stats
}

/**
 * Format price for display
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(price)
}

/**
 * Validate pricing data
 */
export const validatePricing = (pricing) => {
  const errors = []
  
  Object.entries(pricing).forEach(([type, price]) => {
    if (typeof price !== 'number' || price < 0) {
      errors.push(`Invalid price for ${type}: ${price}`)
    }
    if (price > 10000000) { // 10M VND max
      errors.push(`Price too high for ${type}: ${formatPrice(price)}`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Create pricing diff for comparison
 */
export const createPricingDiff = (oldPricing, newPricing) => {
  const diff = {}
  const allTypes = new Set([...Object.keys(oldPricing), ...Object.keys(newPricing)])
  
  allTypes.forEach(type => {
    const oldPrice = oldPricing[type] || 0
    const newPrice = newPricing[type] || 0
    
    if (oldPrice !== newPrice) {
      diff[type] = {
        old: oldPrice,
        new: newPrice,
        change: newPrice - oldPrice,
        percentChange: oldPrice > 0 ? ((newPrice - oldPrice) / oldPrice) * 100 : 0
      }
    }
  })
  
  return diff
}

/**
 * Generate pricing summary for display
 */
export const generatePricingSummary = (seats, basePricing) => {
  const stats = getSeatPricingStats(seats, basePricing)
  
  return {
    totalSeats: stats.total,
    totalRevenue: stats.totalRevenue,
    avgPricePerSeat: stats.total > 0 ? Math.round(stats.totalRevenue / stats.total) : 0,
    seatTypes: Object.keys(stats.byType).length,
    breakdown: stats.byType
  }
}