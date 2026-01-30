import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getSeatStatus, formatPrice, calculateTotal } from '../../utils/booking'
import { validateSeatSelection } from '../../utils/validation'
import './booking.css'

export default function SeatSelection({ seatingChart, selectedSeats, onSeatsChange, onContinue, onBack, event }) {
  const [hoveredSeat, setHoveredSeat] = useState(null)

  const [seatError, setSeatError] = useState(null)

  const handleSeatClick = (seat) => {
    if (seat.status === 'occupied') {
      setSeatError('Ghế này đã được đặt')
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
    seatingChart.forEach(seat => {
      if (!rowMap.has(seat.row)) {
        rowMap.set(seat.row, [])
      }
      rowMap.get(seat.row).push(seat)
    })
    return Array.from(rowMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  }, [seatingChart])

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
      <p className="step-description">Chọn ghế bạn muốn ngồi. Click vào ghế để chọn/bỏ chọn.</p>
      
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

      {/* Navigation */}
      <div className="step-navigation">
        <button className="btn-secondary" onClick={onBack}>
          ← Quay lại
        </button>
        <button
          className="btn-primary"
          onClick={handleContinue}
          disabled={selectedSeats.length === 0}
        >
          Tiếp tục đến tóm tắt →
        </button>
      </div>
    </motion.div>
  )
}
