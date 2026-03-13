import { supabase } from '../lib/supabase'
import { updateSeatFinalPrices } from './seatPricingService'
import { useState, useEffect } from 'react'

/**
 * Service for synchronizing seat pricing across the application
 */
class SeatPricingSyncService {
  constructor() {
    this.subscribers = new Map()
    this.channels = new Map()
  }

  /**
   * Subscribe to pricing changes for a theater/hall
   */
  subscribe(theaterId, hallId, callback) {
    const key = `${theaterId}-${hallId || 'all'}`
    
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set())
    }
    
    this.subscribers.get(key).add(callback)
    
    // Set up real-time channel if not exists
    if (!this.channels.has(key)) {
      this.setupChannel(theaterId, hallId, key)
    }
    
    // Return unsubscribe function
    return () => {
      this.unsubscribe(theaterId, hallId, callback)
    }
  }

  /**
   * Unsubscribe from pricing changes
   */
  unsubscribe(theaterId, hallId, callback) {
    const key = `${theaterId}-${hallId || 'all'}`
    
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).delete(callback)
      
      // Clean up if no more subscribers
      if (this.subscribers.get(key).size === 0) {
        this.subscribers.delete(key)
        this.cleanupChannel(key)
      }
    }
  }

  /**
   * Set up real-time channel for pricing changes
   */
  setupChannel(theaterId, hallId, key) {
    const filter = hallId 
      ? `theater_id=eq.${theaterId}&hall_id=eq.${hallId}`
      : `theater_id=eq.${theaterId}`

    const channel = supabase
      .channel(`seat-pricing-sync-${key}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seat_pricing',
          filter
        },
        async (payload) => {
          console.log('Seat pricing changed:', payload)
          
          // Update seat final prices if hall-specific change
          if (hallId && payload.new?.hall_id === hallId) {
            try {
              await updateSeatFinalPrices(hallId, theaterId)
              console.log('Updated seat final prices for hall:', hallId)
            } catch (error) {
              console.error('Error updating seat final prices:', error)
            }
          }
          
          // Notify all subscribers
          this.notifySubscribers(key, payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'seats',
          filter: hallId ? `hall_id=eq.${hallId}` : undefined
        },
        (payload) => {
          console.log('Seat data changed:', payload)
          // Notify subscribers of seat changes (price updates)
          this.notifySubscribers(key, payload)
        }
      )
      .subscribe()

    this.channels.set(key, channel)
  }

  /**
   * Clean up channel
   */
  cleanupChannel(key) {
    if (this.channels.has(key)) {
      supabase.removeChannel(this.channels.get(key))
      this.channels.delete(key)
    }
  }

  /**
   * Notify all subscribers of changes
   */
  notifySubscribers(key, payload) {
    if (this.subscribers.has(key)) {
      this.subscribers.get(key).forEach(callback => {
        try {
          callback(payload)
        } catch (error) {
          console.error('Error in pricing sync callback:', error)
        }
      })
    }
  }

  /**
   * Manually trigger pricing update for a hall
   */
  async triggerPricingUpdate(theaterId, hallId) {
    try {
      await updateSeatFinalPrices(hallId, theaterId)
      
      // Notify subscribers
      const key = `${theaterId}-${hallId || 'all'}`
      this.notifySubscribers(key, {
        eventType: 'manual_update',
        theaterId,
        hallId
      })
      
      return { success: true }
    } catch (error) {
      console.error('Error triggering pricing update:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get current subscriber count
   */
  getSubscriberCount() {
    let total = 0
    this.subscribers.forEach(set => {
      total += set.size
    })
    return total
  }

  /**
   * Clean up all subscriptions
   */
  cleanup() {
    this.channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.subscribers.clear()
  }
}

// Create singleton instance
const seatPricingSyncService = new SeatPricingSyncService()

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    seatPricingSyncService.cleanup()
  })
}

export default seatPricingSyncService

/**
 * Hook for easy integration with React components
 */
export const useSeatPricingSync = (theaterId, hallId, onPricingChange) => {
  const [isSubscribed, setIsSubscribed] = useState(false)

  useEffect(() => {
    if (!theaterId || !onPricingChange) return

    setIsSubscribed(true)
    const unsubscribe = seatPricingSyncService.subscribe(
      theaterId, 
      hallId, 
      onPricingChange
    )

    return () => {
      unsubscribe()
      setIsSubscribed(false)
    }
  }, [theaterId, hallId, onPricingChange])

  return {
    isSubscribed,
    triggerUpdate: () => seatPricingSyncService.triggerPricingUpdate(theaterId, hallId)
  }
}