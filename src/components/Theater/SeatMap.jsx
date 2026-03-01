import { useState } from 'react'
import './SeatMap.css'

const SeatMap = ({ seats, hall, onSeatClick, selectedSeats = [], disabledSeats = [] }) => {
  const [hoveredSeat, setHoveredSeat] = useState(null)

  // Group seats by row
  const seatsByRow = seats.reduce((acc, seat) => {
    if (!acc[seat.row_number]) {
      acc[seat.row_number] = []
    }
    acc[seat.row_number].push(seat)
    return acc
  }, {})

  const rows = Object.keys(seatsByRow).sort((a, b) => a - b)

  const getSeatColor = (seat) => {
    if (disabledSeats.includes(seat.id)) {
      return 'seat-disabled'
    }
    if (selectedSeats.includes(seat.id)) {
      return 'seat-selected'
    }
    if (!seat.is_active) {
      return 'seat-inactive'
    }
    
    switch (seat.seat_type) {
      case 'vip':
        return 'seat-vip'
      case 'balcony':
        return 'seat-balcony'
      case 'box':
        return 'seat-box'
      default:
        return 'seat-standard'
    }
  }

  const handleSeatClick = (seat) => {
    if (onSeatClick && seat.is_active && !disabledSeats.includes(seat.id)) {
      onSeatClick(seat)
    }
  }

  return (
    <div className="seat-map-container">
      {/* Stage */}
      <div className="stage">
        <div className="stage-inner">
          <span className="material-symbols-outlined">theater_comedy</span>
          <span>SÂN KHẤU</span>
        </div>
      </div>

      {/* Legend */}
      <div className="seat-legend">
        <div className="legend-item">
          <div className="seat-icon seat-standard"></div>
          <span>Thường</span>
        </div>
        <div className="legend-item">
          <div className="seat-icon seat-vip"></div>
          <span>VIP</span>
        </div>
        <div className="legend-item">
          <div className="seat-icon seat-balcony"></div>
          <span>Ban công</span>
        </div>
        <div className="legend-item">
          <div className="seat-icon seat-selected"></div>
          <span>Đã chọn</span>
        </div>
        <div className="legend-item">
          <div className="seat-icon seat-disabled"></div>
          <span>Đã bán</span>
        </div>
      </div>

      {/* Seats Grid */}
      <div className="seats-grid">
        {rows.map(rowNumber => (
          <div key={rowNumber} className="seat-row">
            <div className="row-label">
              Hàng {String.fromCharCode(64 + parseInt(rowNumber))}
            </div>
            <div className="row-seats">
              {seatsByRow[rowNumber]
                .sort((a, b) => a.seat_number - b.seat_number)
                .map(seat => (
                  <div
                    key={seat.id}
                    className={`seat ${getSeatColor(seat)} ${
                      hoveredSeat?.id === seat.id ? 'seat-hovered' : ''
                    }`}
                    onClick={() => handleSeatClick(seat)}
                    onMouseEnter={() => setHoveredSeat(seat)}
                    onMouseLeave={() => setHoveredSeat(null)}
                    title={`Hàng ${String.fromCharCode(64 + seat.row_number)} - Ghế ${seat.seat_number}`}
                  >
                    <span className="material-symbols-outlined">
                      {seat.is_wheelchair_accessible ? 'accessible' : 'event_seat'}
                    </span>
                    <span className="seat-number">{seat.seat_number}</span>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Hover Info */}
      {hoveredSeat && (
        <div className="seat-info">
          <p className="font-semibold">
            Hàng {String.fromCharCode(64 + hoveredSeat.row_number)} - Ghế {hoveredSeat.seat_number}
          </p>
          <p className="text-sm text-slate-400">
            Loại: {hoveredSeat.seat_type === 'vip' ? 'VIP' : 
                   hoveredSeat.seat_type === 'balcony' ? 'Ban công' :
                   hoveredSeat.seat_type === 'box' ? 'Hộp' : 'Thường'}
          </p>
          {hoveredSeat.is_wheelchair_accessible && (
            <p className="text-sm text-green-400">✓ Hỗ trợ xe lăn</p>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="seat-stats">
        <div className="stat-item">
          <span className="stat-label">Tổng số ghế:</span>
          <span className="stat-value">{seats.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Đã chọn:</span>
          <span className="stat-value text-primary">{selectedSeats.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Đã bán:</span>
          <span className="stat-value text-red-400">{disabledSeats.length}</span>
        </div>
      </div>
    </div>
  )
}

export default SeatMap
