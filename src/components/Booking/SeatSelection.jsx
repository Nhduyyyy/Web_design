import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { getSeatStatus, formatPrice, calculateTotal } from '../../utils/booking'
import { validateSeatSelection } from '../../utils/validation'
import { getSeatsByHall } from '../../services/hallService'
import FloorHallSelector from './FloorHallSelector'
import './booking.css'

export default function SeatSelection({ 
  seatingChart, 
  selectedSeats, 
  onSeatsChange, 
  onContinue, 
  onBack, 
  event,
  scheduleId = null,
  userId = null
}) {
  const [hoveredSeat, setHoveredSeat] = useState(null)
  const [seatError, setSeatError] = useState(null)
  const [seats, setSeats] = useState(seatingChart)
  const [conflictWarning, setConflictWarning] = useState(null)
  const subscriptionRef = useRef(null)
  
  // Floor and Hall selection
  const [selectedFloor, setSelectedFloor] = useState(null)
  const [selectedHall, setSelectedHall] = useState(null)
  const [loadingSeats, setLoadingSeats] = useState(false)
  
  // Update seats when seatingChart prop changes
  useEffect(() => {
    setSeats(seatingChart)
  }, [seatingChart])
  
  // Load seats when hall is selected
  useEffect(() => {
    if (selectedHall) {
      loadSeatsFromHall()
    }
  }, [selectedHall])
  
  const loadSeatsFromHall = async () => {
    try {
      setLoadingSeats(true)
      setSeatError(null)
      
      const hallSeats = await getSeatsByHall(selectedHall)
      
      // Transform database seats to booking format
      const transformedSeats = hallSeats.map(seat => ({
        id: seat.seat_label || `${seat.row_number}-${seat.seat_number}`,
        seat_id: seat.id,
        row: String.fromCharCode(64 + seat.row_number), // Convert 1,2,3 to A,B,C
        number: seat.seat_number,
        status: seat.status === 'booked' ? 'occupied' : 'available',
        price: getPriceForSeatType(seat.seat_type),
        type: seat.seat_type
      }))
      
      setSeats(transformedSeats)
      onSeatsChange([]) // Reset selected seats when changing hall
    } catch (error) {
      console.error('Error loading seats:', error)
      setSeatError('Không thể tải danh sách ghế. Vui lòng thử lại.')
    } finally {
      setLoadingSeats(false)
    }
  }
  
  const getPriceForSeatType = (type) => {
    const prices = {
      vip: 500000,
      premium: 350000,
      standard: 250000,
      economy: 150000
    }
    return prices[type] || 250000
  }
  
  // Real-time subscription for seat updates
  useEffect(() => {
    if (!scheduleId || !event?.schedule_id) {
      // No scheduleId, skip real-time updates (using mock data)
      return
    }
    
    const scheduleIdToUse = scheduleId || event.schedule_id
    
    console.log('Setting up real-time subscription for schedule:', scheduleIdToUse)
    
    // Subscribe to seat updates for this schedule
    const channel = supabase
      .channel(`seat-updates-${scheduleIdToUse}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'seats',
          filter: `schedule_id=eq.${scheduleIdToUse}`
        },
        (payload) => {
          console.log('Seat update received:', payload)
          
          // Update seat status in real-time
          setSeats(prevSeats => {
            const updatedSeats = [...prevSeats]
            const seatIndex = updatedSeats.findIndex(
              s => s.id === payload.new.id || s.seat_id === payload.new.seat_id || 
                   (payload.new.seat_id && s.seat_id === payload.new.seat_id)
            )
            
            if (seatIndex !== -1) {
              // Update existing seat
              updatedSeats[seatIndex] = {
                ...updatedSeats[seatIndex],
                status: payload.new.status,
                reserved_by: payload.new.reserved_by,
                reserved_until: payload.new.reserved_until
              }
              
              // Check if seat was selected by user but now occupied/reserved by someone else
              const isSelected = selectedSeats.some(s => 
                s.id === payload.new.id || 
                s.seat_id === payload.new.seat_id ||
                (payload.new.seat_id && s.seat_id === payload.new.seat_id)
              )
              
              if (isSelected) {
                if (payload.new.status === 'occupied') {
                  // Seat occupied by someone else - remove from selected
                  const newSelectedSeats = selectedSeats.filter(s => 
                    s.id !== payload.new.id && 
                    s.seat_id !== payload.new.seat_id &&
                    !(payload.new.seat_id && s.seat_id === payload.new.seat_id)
                  )
                  onSeatsChange(newSelectedSeats)
                  
                  const seatLabel = payload.new.seat_id || payload.new.id || 'ghế này'
                  setConflictWarning(`⚠️ Ghế ${seatLabel} đã được đặt bởi người khác. Đã tự động xóa khỏi danh sách chọn.`)
                  setTimeout(() => setConflictWarning(null), 5000)
                } else if (payload.new.status === 'reserved' && payload.new.reserved_by !== userId) {
                  // Seat reserved by someone else
                  const seatLabel = payload.new.seat_id || payload.new.id || 'ghế này'
                  setConflictWarning(`⚠️ Ghế ${seatLabel} đang được giữ bởi người khác. Vui lòng chọn ghế khác.`)
                  setTimeout(() => setConflictWarning(null), 5000)
                }
              }
            } else if (payload.eventType === 'INSERT') {
              // New seat added
              updatedSeats.push({
                id: payload.new.id,
                seat_id: payload.new.seat_id,
                row: payload.new.row_label,
                number: payload.new.seat_number,
                status: payload.new.status,
                price: payload.new.price,
                type: payload.new.seat_type
              })
            }
            
            return updatedSeats
          })
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Subscription error')
        }
      })
    
    subscriptionRef.current = channel
    
    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        console.log('Cleaning up subscription')
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [scheduleId, event?.schedule_id, selectedSeats, onSeatsChange, userId])

  const handleSeatClick = (seat) => {
    // Check if seat is occupied or reserved by someone else
    if (seat.status === 'occupied') {
      setSeatError('Ghế này đã được đặt')
      setTimeout(() => setSeatError(null), 3000)
      return
    }
    
    if (seat.status === 'reserved' && seat.reserved_by && seat.reserved_by !== userId) {
      setSeatError('Ghế này đang được giữ bởi người khác')
      setTimeout(() => setSeatError(null), 3000)
      return
    }
    
    const isSelected = selectedSeats.some(s => s.id === seat.id)
    let newSelectedSeats
    
    if (isSelected) {
      newSelectedSeats = selectedSeats.filter(s => s.id !== seat.id)
    } else {
      // Validate max seats before adding
      if (selectedSeats.length >= 10) {
        setSeatError('Bạn chỉ có thể chọn tối đa 10 ghế')
        setTimeout(() => setSeatError(null), 3000)
        return
      }
      newSelectedSeats = [...selectedSeats, seat]
    }
    
    // Validate seat selection
    const validation = validateSeatSelection(newSelectedSeats, 0, 10)
    if (!validation.valid && newSelectedSeats.length > 0) {
      setSeatError(validation.error)
      setTimeout(() => setSeatError(null), 3000)
      return
    }
    
    setSeatError(null)
    onSeatsChange(newSelectedSeats)
  }

  // Validate on continue
  const handleContinue = () => {
    const validation = validateSeatSelection(selectedSeats, 1, 10)
    if (!validation.valid) {
      setSeatError(validation.error)
      return
    }
    onContinue()
  }

  const total = calculateTotal(selectedSeats)
  const rows = useMemo(() => {
    const rowMap = new Map()
    seats.forEach(seat => {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, [])
      }
      rowMap.get(seat.row).push(seat)
    })
    return Array.from(rowMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [seats])

  const seatTypeInfo = {
    vip: { label: 'VIP', color: '#FFD700', price: '500,000₫' },
    premium: { label: 'Premium', color: '#FF6B6B', price: '350,000₫' },
    standard: { label: 'Standard', color: '#4ECDC4', price: '250,000₫' },
    economy: { label: 'Economy', color: '#95E1D3', price: '150,000₫' }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content seat-selection"
    >
      <h2>Chọn Ghế (Bước Quan Trọng Nhất)</h2>
      <p className="step-description">Chọn tầng, khán phòng và ghế bạn muốn ngồi.</p>
      
      {/* Floor and Hall Selector */}
      {event?.venue_id && (
        <FloorHallSelector
          venueId={event.venue_id}
          selectedFloor={selectedFloor}
          selectedHall={selectedHall}
          onFloorChange={setSelectedFloor}
          onHallChange={setSelectedHall}
        />
      )}
      
      {/* Show message if no hall selected */}
      {!selectedHall && (
        <div className="empty-message" style={{ 
          textAlign: 'center', 
          padding: '2rem', 
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '12px',
          marginBottom: '1.5rem'
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>👆 Vui lòng chọn tầng và khán phòng</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--booking-text-muted)' }}>
            Chọn tầng trước, sau đó chọn khán phòng để xem sơ đồ ghế
          </p>
        </div>
      )}
      
      {/* Loading state */}
      {loadingSeats && (
        <div className="loading-spinner" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
          <p>Đang tải sơ đồ ghế...</p>
        </div>
      )}
      
      {/* Seat selection (only show when hall is selected and not loading) */}
      {selectedHall && !loadingSeats && (
        <>
          {/* Real-time Conflict Warning */}
          {conflictWarning && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="conflict-warning"
              style={{
                background: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                fontWeight: 600,
                color: '#856404'
              }}
            >
              {conflictWarning}
            </motion.div>
          )}
          
          {seatError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="seat-error-message"
              style={{
                background: '#fff1f2',
                border: '2px solid #f44336',
                color: '#c62828',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                marginBottom: '1rem',
                fontWeight: 600
              }}
            >
              ⚠️ {seatError}
            </motion.div>
          )}

          {/* Stage */}
          <div className="stage-area">
            <div className="stage">SÂN KHẤU</div>
          </div>

          {/* Seating Chart */}
          <div className="seating-chart-container">
            <div className="seating-chart">
              {rows.map(([rowLabel, seats]) => (
                <div key={rowLabel} className="seat-row">
                  <div className="row-label">{rowLabel}</div>
                  <div className="seats-in-row">
                    {seats.map((seat) => {
                      const status = getSeatStatus(seat, selectedSeats)
                      const isHovered = hoveredSeat?.id === seat.id
                      
                      return (
                        <motion.button
                          key={seat.id}
                          className={`seat seat-${status} seat-${seat.type}`}
                          onClick={() => handleSeatClick(seat)}
                          onMouseEnter={() => setHoveredSeat(seat)}
                          onMouseLeave={() => setHoveredSeat(null)}
                          disabled={status === 'occupied'}
                          whileHover={status !== 'occupied' ? { scale: 1.1 } : {}}
                          whileTap={status !== 'occupied' ? { scale: 0.95 } : {}}
                          title={`${seat.id} - ${formatPrice(seat.price)}`}
                        >
                          {seat.number}
                        </motion.button>
                      )
                    })}
                  </div>
                  <div className="row-label">{rowLabel}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="seat-legend">
            <h4>Chú thích:</h4>
            <div className="legend-items">
              {Object.entries(seatTypeInfo).map(([type, info]) => (
                <div key={type} className="legend-item">
                  <div className={`legend-seat seat-${type}`}></div>
                  <span>{info.label} ({info.price})</span>
                </div>
              ))}
              <div className="legend-item">
                <div className="legend-seat seat-available"></div>
                <span>Trống</span>
              </div>
              <div className="legend-item">
                <div className="legend-seat seat-selected"></div>
                <span>Đã chọn</span>
              </div>
              <div className="legend-item">
                <div className="legend-seat seat-occupied"></div>
                <span>Đã bán</span>
              </div>
            </div>
          </div>

          {/* Selected Seats Summary */}
          {selectedSeats.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="selected-seats-summary"
            >
              <h4>Ghế đã chọn ({selectedSeats.length}):</h4>
              <div className="selected-seats-list">
                {selectedSeats.map(seat => (
                  <div key={seat.id} className="selected-seat-item">
                    <span className="seat-id">{seat.id}</span>
                    <span className="seat-price">{formatPrice(seat.price)}</span>
                  </div>
                ))}
              </div>
              <div className="total-preview">
                <strong>Tổng cộng: {formatPrice(total)}</strong>
              </div>
            </motion.div>
          )}
        </>
      )}

      {/* Navigation */}
      <div className="step-navigation">
        <button className="btn-secondary" onClick={onBack}>
          ← Quay lại
        </button>
        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={selectedSeats.length === 0 || !selectedHall}
        >
          Tiếp tục đến tóm tắt →
        </button>
      </div>
    </motion.div>
  )
}
