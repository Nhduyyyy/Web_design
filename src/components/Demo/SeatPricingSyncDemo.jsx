import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { RefreshCw, DollarSign, Users, Clock } from 'lucide-react'
import { useSeatPricing, useBookingTotal } from '../../hooks/useSeatPricing'
import { formatPrice } from '../../utils/booking'
import seatPricingSyncService from '../../services/seatPricingSyncService'

/**
 * Demo component to test seat pricing synchronization
 * Use this to verify that pricing changes in Theater Manager
 * are reflected real-time in booking components
 */
export default function SeatPricingSyncDemo({ theaterId, hallId }) {
  const [lastUpdate, setLastUpdate] = useState(null)
  const [updateCount, setUpdateCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Mock selected seats for testing
  const mockSelectedSeats = [
    { id: 'A1', type: 'standard', price: 250000 },
    { id: 'A2', type: 'vip', price: 500000 },
    { id: 'B1', type: 'couple', price: 600000 }
  ]

  // Use real-time pricing hooks
  const { pricing, loading: pricingLoading, error } = useSeatPricing(theaterId, hallId)
  const { total, loading: totalLoading } = useBookingTotal(mockSelectedSeats, theaterId, hallId)

  // Set up sync monitoring
  useEffect(() => {
    if (!theaterId) return

    setIsConnected(true)
    const unsubscribe = seatPricingSyncService.subscribe(
      theaterId,
      hallId,
      (payload) => {
        setLastUpdate(new Date())
        setUpdateCount(prev => prev + 1)
        console.log('🔄 Pricing sync update received:', payload)
      }
    )

    return () => {
      unsubscribe()
      setIsConnected(false)
    }
  }, [theaterId, hallId])

  const handleManualSync = async () => {
    try {
      const result = await seatPricingSyncService.triggerPricingUpdate(theaterId, hallId)
      if (result.success) {
        console.log('✅ Manual sync triggered successfully')
      } else {
        console.error('❌ Manual sync failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Manual sync error:', error)
    }
  }

  if (!theaterId) {
    return (
      <div className="sync-demo-container">
        <div className="demo-warning">
          <p>⚠️ Cần theaterId để test đồng bộ giá vé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="sync-demo-container" style={{ 
      padding: '1.5rem', 
      border: '2px solid #e0e0e0', 
      borderRadius: '12px',
      background: '#f8f9fa',
      margin: '1rem 0'
    }}>
      <div className="demo-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign className="w-5 h-5" />
          Seat Pricing Sync Demo
        </h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            fontSize: '0.875rem',
            color: isConnected ? '#28a745' : '#dc3545'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#28a745' : '#dc3545'
            }} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <button
            onClick={handleManualSync}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Manual Sync
          </button>
        </div>
      </div>

      <div className="demo-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Current Pricing */}
        <div className="pricing-section">
          <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign className="w-4 h-4" />
            Current Pricing
          </h4>
          
          {pricingLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#666' }}>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading pricing...
            </div>
          ) : error ? (
            <div style={{ color: '#dc3545', fontSize: '0.875rem' }}>
              Error: {error}
            </div>
          ) : (
            <div className="pricing-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {Object.entries(pricing).map(([type, price]) => (
                <motion.div
                  key={type}
                  className="pricing-item"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #e0e0e0'
                  }}
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 0.3 }}
                >
                  <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                    {type}
                  </span>
                  <span style={{ fontWeight: 600, color: '#28a745' }}>
                    {formatPrice(price)}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Total Demo */}
        <div className="booking-section">
          <h4 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users className="w-4 h-4" />
            Booking Total Demo
          </h4>
          
          <div className="mock-seats" style={{ marginBottom: '1rem' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666' }}>
              Mock selected seats:
            </p>
            {mockSelectedSeats.map(seat => (
              <div key={seat.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.25rem 0',
                fontSize: '0.875rem'
              }}>
                <span>{seat.id} ({seat.type})</span>
                <span>{formatPrice(pricing[seat.type] || seat.price)}</span>
              </div>
            ))}
          </div>

          <div className="total-display" style={{
            padding: '1rem',
            background: '#e8f5e8',
            borderRadius: '8px',
            border: '2px solid #28a745'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Total:</span>
              {totalLoading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Calculating...
                </div>
              ) : (
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#28a745' }}>
                  {formatPrice(total)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sync Status */}
      <div className="sync-status" style={{
        marginTop: '1.5rem',
        padding: '1rem',
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock className="w-4 h-4" />
            <span>Updates received: {updateCount}</span>
          </div>
          {lastUpdate && (
            <div>
              Last update: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="demo-instructions" style={{
        marginTop: '1rem',
        padding: '1rem',
        background: '#fff3cd',
        borderRadius: '8px',
        border: '1px solid #ffc107',
        fontSize: '0.875rem'
      }}>
        <p style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>
          🧪 How to test:
        </p>
        <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>Open Theater Manager in another tab</li>
          <li>Navigate to Seat Layout Editor for this hall</li>
          <li>Change prices in the Seat Price List</li>
          <li>Watch this demo update in real-time</li>
        </ol>
      </div>
    </div>
  )
}

// CSS for animations
const styles = `
  .sync-demo-container .animate-spin {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = styles
  document.head.appendChild(styleSheet)
}