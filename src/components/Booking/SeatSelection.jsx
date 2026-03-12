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
      
      if (!hallSeats || hallSeats.length === 0) {
        setSeats([])
        setSeatError('Khán phòng này chưa có sơ đồ ghế')
        return
      }
      
      // Transform database seats to booking format with grid positions
      // Use position_x and position_y for actual grid coordinates
      const transformedSeats = hallSeats.map(seat => ({
        id: seat.id,
        seat_id: seat.id,
        row: seat.position_y !== null ? seat.position_y : seat.row_number - 1, // Use position_y (0-based) or fallback to row_number
        col: seat.position_x !== null ? seat.position_x : seat.seat_number - 1, // Use position_x (0-based) or fallback to seat_number
        rowLabel: String.fromCharCode(65 + (seat.position_y !== null ? seat.position_y : seat.row_number - 1)), // A, B, C...
        label: seat.seat_label || `${String.fromCharCode(65 + (seat.position_y !== null ? seat.position_y : seat.row_number - 1))}${(seat.position_x !== null ? seat.position_x : seat.seat_number - 1) + 1}`,
        status: seat.status === 'booked' ? 'occupied' : 'available',
        price: getPriceForSeatType(seat.seat_type),
        type: seat.seat_type,
        position_x: seat.position_x,
        position_y: seat.position_y
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
    // Check if seat is aisle/walkway - cannot be selected
    if (seat.label && (
      seat.label.includes('LỐI ĐI') ||
      seat.label.includes('AISLE') ||
      seat.label.includes('LỐI') ||
      seat.label.includes('ĐI')
    )) {
      setSeatError('Đây là lối đi, không thể chọn')
      setTimeout(() => setSeatError(null), 3000)
      return
    }
    
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
  
  // Build grid layout from seats using position_x and position_y
  const buildGridLayout = useMemo(() => {
    if (!seats || seats.length === 0) return { rows: [], maxCols: 0 }
    
    // Find max row and col from positions (0-based)
    const maxRow = Math.max(...seats.map(s => s.row))
    const maxCol = Math.max(...seats.map(s => s.col))
    
    // Create grid structure - INCLUDE ALL ROWS even if empty
    const grid = []
    for (let r = 0; r <= maxRow; r++) {
      const rowLabel = String.fromCharCode(65 + r) // A, B, C... (0-based)
      const rowSeats = seats.filter(s => s.row === r).sort((a, b) => a.col - b.col)
      
      // Check if this row contains stage labels
      const stageSeats = rowSeats.filter(s => 
        s.label && (
          s.label.includes('SÂN KHẤU') || 
          s.label.includes('STAGE') ||
          s.label.includes('SÂN') ||
          s.label.includes('KHẤU')
        )
      )
      
      const hasStage = stageSeats.length > 0
      
      // Always add row, even if it has no seats
      grid.push({
        rowNumber: r,
        rowLabel,
        seats: rowSeats,
        isEmpty: rowSeats.length === 0,
        hasStage,
        stageSeats: hasStage ? stageSeats : []
      })
    }
    
    // Group consecutive stage rows
    const processedRows = []
    let i = 0
    while (i < grid.length) {
      const row = grid[i]
      
      if (row.hasStage) {
        // Find consecutive stage rows
        const stageGroup = [row]
        let j = i + 1
        while (j < grid.length && grid[j].hasStage) {
          stageGroup.push(grid[j])
          j++
        }
        
        // Calculate merged stage dimensions
        const allStageSeats = stageGroup.flatMap(r => r.stageSeats)
        const minCol = Math.min(...allStageSeats.map(s => s.col))
        const maxColStage = Math.max(...allStageSeats.map(s => s.col))
        
        processedRows.push({
          type: 'stage-merged',
          rowNumbers: stageGroup.map(r => r.rowNumber),
          rowCount: stageGroup.length,
          minCol,
          maxCol: maxColStage,
          colCount: maxColStage - minCol + 1
        })
        
        i = j // Skip processed stage rows
      } else {
        processedRows.push({
          type: 'normal',
          ...row
        })
        i++
      }
    }
    
    return { rows: processedRows, maxCols: maxCol + 1 } // +1 because col is 0-based
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

          {/* Seating Chart */}
          <div className="seating-chart-container">
            {buildGridLayout.rows.length === 0 ? (
              <div className="empty-message" style={{ textAlign: 'center', padding: '2rem' }}>
                <p>Không có ghế nào trong khán phòng này</p>
              </div>
            ) : (
              <div className="seating-chart-grid">
                {buildGridLayout.rows.map((row, idx) => {
                  // Calculate seat size based on screen width
                  const isMobile = window.innerWidth <= 768
                  const seatSize = isMobile ? 32 : 40
                  const gap = isMobile ? 2 : 4
                  
                  // If this is a merged stage group
                  if (row.type === 'stage-merged') {
                    const stageWidth = row.colCount * seatSize + (row.colCount - 1) * gap
                    const stageHeight = row.rowCount * seatSize + (row.rowCount - 1) * gap
                    
                    return (
                      <div key={`stage-${idx}`} className="seat-row-grid stage-row">
                        <div className="seats-grid-container" style={{ width: '100%' }}>
                          <div 
                            className="stage-label-merged"
                            style={{
                              width: `${stageWidth}px`,
                              height: `${stageHeight}px`,
                              margin: '0 auto'
                            }}
                          >
                            SÂN KHẤU
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  // Normal row rendering
                  return (
                    <div key={row.rowNumber} className="seat-row-grid">
                      <div className="seats-grid-container" style={{ width: '100%' }}>
                        <div 
                          className="seats-grid"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${buildGridLayout.maxCols}, ${seatSize}px)`,
                            gap: `${gap}px`,
                            justifyContent: 'center'
                          }}
                        >
                          {Array.from({ length: buildGridLayout.maxCols }, (_, colIndex) => {
                            const seat = row.seats.find(s => s.col === colIndex)
                            
                            if (!seat) {
                              // Empty space
                              return <div key={`empty-${row.rowNumber}-${colIndex}`} className="seat-empty"></div>
                            }
                            
                            // Check if this is an aisle/walkway
                            const isAisle = seat.label && (
                              seat.label.includes('LỐI ĐI') ||
                              seat.label.includes('AISLE') ||
                              seat.label.includes('LỐI') ||
                              seat.label.includes('ĐI')
                            )
                            
                            if (isAisle) {
                              // Render aisle as non-clickable
                              return (
                                <div 
                                  key={seat.id}
                                  className="seat seat-aisle"
                                  title="Lối đi"
                                >
                                  {seat.label}
                                </div>
                              )
                            }
                            
                            const status = getSeatStatus(seat, selectedSeats)
                            
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
                                title={`Ghế ${seat.label} - ${formatPrice(seat.price)}`}
                              >
                                {seat.label}
                              </motion.button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
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
              <div className="legend-item">
                <div className="legend-seat seat-aisle"></div>
                <span>Lối đi</span>
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
                    <span className="seat-id">{seat.label}</span>
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
