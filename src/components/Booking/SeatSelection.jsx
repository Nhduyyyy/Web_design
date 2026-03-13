import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '../../lib/supabase'
import { getSeatStatus, formatPrice, calculateTotal } from '../../utils/booking'
import { validateSeatSelection } from '../../utils/validation'
import { getSeatsByHall } from '../../services/hallService'
import { getBookedSeatIdsForSchedule } from '../../services/bookingService'
import { getSeatPricingByType, calculateSeatPricesForHall } from '../../services/seatPricingService'
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
  const [seatPricing, setSeatPricing] = useState({})
  const [theaterId, setTheaterId] = useState(null)
  
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

      const scheduleIdToUse = scheduleId || event?.schedule_id
      const [hallSeats, bookedSeatIds] = await Promise.all([
        getSeatsByHall(selectedHall),
        scheduleIdToUse ? getBookedSeatIdsForSchedule(scheduleIdToUse) : Promise.resolve([])
      ])

      if (!hallSeats || hallSeats.length === 0) {
        setSeats([])
        setSeatError('Khán phòng này chưa có sơ đồ ghế')
        return
      }

      // Get hall details to find theater_id
      const { data: hallData } = await supabase
        .from('halls')
        .select('theater_id')
        .eq('id', selectedHall)
        .single()

      if (hallData?.theater_id) {
        setTheaterId(hallData.theater_id)
        
        // Load seat pricing and calculate prices for all seats
        const [pricing, seatPricesResult] = await Promise.all([
          getSeatPricingByType(hallData.theater_id, selectedHall),
          calculateSeatPricesForHall(selectedHall, hallData.theater_id)
        ])
        
        setSeatPricing(pricing)

        // Create a map of seat prices for quick lookup
        const seatPriceMap = new Map()
        if (seatPricesResult.success) {
          seatPricesResult.seatPrices.forEach(sp => {
            seatPriceMap.set(sp.seat_id, sp.final_price)
          })
        }

        const bookedSet = new Set((bookedSeatIds || []).map(String))

        // Transform database seats with calculated pricing
        const transformedSeats = hallSeats.map(seat => {
          const isBookedForSchedule = bookedSet.has(String(seat.id))
          const status = isBookedForSchedule ? 'occupied' : (seat.status === 'available' || !seat.status ? 'available' : 'occupied')
          
          // Use calculated price from seatPriceMap, fallback to database or default
          let price = seatPriceMap.get(seat.id) || seat.final_price || seat.base_price
          if (!price && pricing[seat.seat_type]) {
            price = pricing[seat.seat_type]
          }
          if (!price) {
            price = getPriceForSeatType(seat.seat_type) // Fallback to default
          }
          
          return {
            id: seat.id,
            seat_id: seat.id,
            row: seat.position_y != null ? Number(seat.position_y) : seat.row_number - 1,
            col: seat.position_x != null ? Number(seat.position_x) : seat.seat_number - 1,
            rowLabel: String.fromCharCode(65 + (seat.position_y != null ? Number(seat.position_y) : seat.row_number - 1)),
            label: seat.seat_label || `${String.fromCharCode(65 + (seat.position_y != null ? Number(seat.position_y) : seat.row_number - 1))}${(seat.position_x != null ? Number(seat.position_x) : seat.seat_number - 1) + 1}`,
            status,
            price,
            type: seat.seat_type,
            position_x: seat.position_x,
            position_y: seat.position_y
          }
        })

        setSeats(transformedSeats)
        onSeatsChange([])
      }
    } catch (error) {
      console.error('Error loading seats:', error)
      setSeatError('Không thể tải danh sách ghế. Vui lòng thử lại.')
    } finally {
      setLoadingSeats(false)
    }
  }
  
  const getPriceForSeatType = (type) => {
    const prices = {
      standard: 250000,
      vip: 500000,
      couple: 600000,
      wheelchair: 250000,
      // Legacy types
      premium: 350000,
      economy: 150000
    }
    return prices[type] || 250000
  }
  
  // Real-time: lắng nghe bookings của lịch diễn này để cập nhật ghế đã đặt (bảng seats theo hall, không có schedule_id)
  useEffect(() => {
    const scheduleIdToUse = scheduleId || event?.schedule_id
    if (!scheduleIdToUse || !selectedHall) return

    const channel = supabase
      .channel(`booking-updates-${scheduleIdToUse}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `schedule_id=eq.${scheduleIdToUse}`
        },
        async () => {
          try {
            const bookedIds = await getBookedSeatIdsForSchedule(scheduleIdToUse)
            const bookedSet = new Set(bookedIds.map(String))
            setSeats(prev => prev.map(s => ({
              ...s,
              status: bookedSet.has(String(s.id)) ? 'occupied' : 'available'
            })))
            const newSelected = selectedSeats.filter(s => !bookedSet.has(String(s.id)))
            if (newSelected.length < selectedSeats.length) {
              onSeatsChange(newSelected)
              setConflictWarning('⚠️ Một số ghế đã được đặt bởi người khác. Đã cập nhật sơ đồ.')
              setTimeout(() => setConflictWarning(null), 5000)
            }
          } catch (e) {
            console.error('Error refreshing booked seats:', e)
          }
        }
      )
      .subscribe()

    subscriptionRef.current = channel
    return () => {
      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }
    }
  }, [scheduleId, event?.schedule_id, selectedHall, selectedSeats, onSeatsChange])

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

  const seatTypeInfo = useMemo(() => {
    return {
      standard: { 
        label: 'Ghế thường', 
        color: '#808080', 
        price: formatPrice(seatPricing.standard || 250000)
      },
      vip: { 
        label: 'Ghế VIP', 
        color: '#FFD700', 
        price: formatPrice(seatPricing.vip || 500000)
      },
      couple: { 
        label: 'Ghế đôi', 
        color: '#FF69B4', 
        price: formatPrice(seatPricing.couple || 600000)
      },
      wheelchair: { 
        label: 'Ghế xe lăn', 
        color: '#00CED1', 
        price: formatPrice(seatPricing.wheelchair || 250000)
      }
    }
  }, [seatPricing])

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
        <div className="seat-loading-container">
          <div className="double-ring-spinner">
            <div className="ring-outer"></div>
            <div className="ring-inner"></div>
          </div>
          <div className="loading-text">Đang tải sơ đồ ghế ngồi...</div>
          <div className="loading-subtext">Vui lòng chờ trong giây lát</div>
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
