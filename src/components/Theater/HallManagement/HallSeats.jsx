import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateSeat, generateSeats } from '../../../services/hallService'
import './HallSeats.css'

const HallSeats = ({ hall, seats, onUpdate }) => {
  const navigate = useNavigate()
  const [selectedSeat, setSelectedSeat] = useState(null)
  const [viewMode, setViewMode] = useState('visual') // visual, list
  const [filterType, setFilterType] = useState('all')
  const [showGenerateModal, setShowGenerateModal] = useState(false)

  const getSeatsByRow = () => {
    const seatMap = {}
    seats.forEach(seat => {
      if (!seatMap[seat.row_number]) {
        seatMap[seat.row_number] = []
      }
      seatMap[seat.row_number].push(seat)
    })
    return seatMap
  }

  const getSeatTypeColor = (type) => {
    switch (type) {
      case 'vip': return 'seat-vip'
      case 'premium': return 'seat-premium'
      case 'standard': return 'seat-standard'
      case 'balcony': return 'seat-balcony'
      default: return 'seat-standard'
    }
  }

  const getSeatTypeLabel = (type) => {
    switch (type) {
      case 'vip': return 'VIP'
      case 'premium': return 'Hạng sang'
      case 'standard': return 'Thường'
      case 'balcony': return 'Ban công'
      default: return 'Thường'
    }
  }

  const handleSeatClick = (seat) => {
    setSelectedSeat(seat)
  }

  const handleUpdateSeat = async (seatId, updates) => {
    try {
      await updateSeat(seatId, updates)
      onUpdate()
      setSelectedSeat(null)
    } catch (error) {
      console.error('Error updating seat:', error)
      alert('Có lỗi khi cập nhật ghế')
    }
  }

  const handleGenerateSeats = async (config) => {
    try {
      await generateSeats(hall.id, config.rows, config.seatsPerRow, config.seatType)
      onUpdate()
      setShowGenerateModal(false)
    } catch (error) {
      console.error('Error generating seats:', error)
      alert('Có lỗi khi tạo ghế')
    }
  }

  const seatsByRow = getSeatsByRow()
  const filteredSeats = filterType === 'all' 
    ? seats 
    : seats.filter(s => s.seat_type === filterType)

  const seatStats = {
    total: seats.length,
    vip: seats.filter(s => s.seat_type === 'vip').length,
    premium: seats.filter(s => s.seat_type === 'premium').length,
    standard: seats.filter(s => s.seat_type === 'standard').length,
    balcony: seats.filter(s => s.seat_type === 'balcony').length,
    active: seats.filter(s => s.is_active).length,
    inactive: seats.filter(s => !s.is_active).length
  }

  return (
    <div className="hall-seats">
      {/* Header */}
      <div className="seats-header">
        <div className="seats-title-section">
          <h2 className="seats-title">Sơ đồ ghế ngồi</h2>
          <p className="seats-subtitle">
            Quản lý {seats.length} ghế trong khán phòng
          </p>
        </div>

        <div className="seats-actions">
          <button 
            className="btn-edit-layout"
            onClick={() => navigate(`/theater/halls/${hall.id}/seat-editor`)}
          >
            <span className="material-symbols-outlined">edit_square</span>
            Chỉnh sửa sơ đồ
          </button>

          <div className="view-toggle">
            <button
              className={`toggle-btn ${viewMode === 'visual' ? 'active' : ''}`}
              onClick={() => setViewMode('visual')}
            >
              <span className="material-symbols-outlined">grid_view</span>
              Sơ đồ
            </button>
            <button
              className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <span className="material-symbols-outlined">list</span>
              Danh sách
            </button>
          </div>

          <button 
            className="btn-generate"
            onClick={() => setShowGenerateModal(true)}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Tạo ghế tự động
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="seats-stats">
        <div className="stat-item">
          <span className="stat-label">Tổng số ghế</span>
          <span className="stat-value">{seatStats.total}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">VIP</span>
          <span className="stat-value vip">{seatStats.vip}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Hạng sang</span>
          <span className="stat-value premium">{seatStats.premium}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Thường</span>
          <span className="stat-value standard">{seatStats.standard}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Ban công</span>
          <span className="stat-value balcony">{seatStats.balcony}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Hoạt động</span>
          <span className="stat-value active">{seatStats.active}</span>
        </div>
      </div>

      {/* Filter */}
      <div className="seats-filter">
        <button
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
          onClick={() => setFilterType('all')}
        >
          Tất cả
        </button>
        <button
          className={`filter-btn ${filterType === 'vip' ? 'active' : ''}`}
          onClick={() => setFilterType('vip')}
        >
          VIP
        </button>
        <button
          className={`filter-btn ${filterType === 'premium' ? 'active' : ''}`}
          onClick={() => setFilterType('premium')}
        >
          Hạng sang
        </button>
        <button
          className={`filter-btn ${filterType === 'standard' ? 'active' : ''}`}
          onClick={() => setFilterType('standard')}
        >
          Thường
        </button>
        <button
          className={`filter-btn ${filterType === 'balcony' ? 'active' : ''}`}
          onClick={() => setFilterType('balcony')}
        >
          Ban công
        </button>
      </div>

      {/* Content */}
      {viewMode === 'visual' ? (
        <div className="seats-visual">
          <div className="stage">
            <span className="material-symbols-outlined">theater_comedy</span>
            SÂN KHẤU
          </div>

          <div className="seats-map">
            {Object.keys(seatsByRow).sort((a, b) => a - b).map(rowNum => (
              <div key={rowNum} className="seat-row">
                <div className="row-label">Hàng {rowNum}</div>
                <div className="row-seats">
                  {seatsByRow[rowNum]
                    .sort((a, b) => a.seat_number - b.seat_number)
                    .map(seat => (
                      <button
                        key={seat.id}
                        className={`seat ${getSeatTypeColor(seat.seat_type)} ${
                          !seat.is_active ? 'inactive' : ''
                        } ${selectedSeat?.id === seat.id ? 'selected' : ''}`}
                        onClick={() => handleSeatClick(seat)}
                        title={`${seat.row_number}-${seat.seat_number} (${getSeatTypeLabel(seat.seat_type)})`}
                      >
                        {seat.seat_number}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>

          <div className="seats-legend">
            <div className="legend-item">
              <div className="legend-color seat-vip"></div>
              <span>VIP</span>
            </div>
            <div className="legend-item">
              <div className="legend-color seat-premium"></div>
              <span>Hạng sang</span>
            </div>
            <div className="legend-item">
              <div className="legend-color seat-standard"></div>
              <span>Thường</span>
            </div>
            <div className="legend-item">
              <div className="legend-color seat-balcony"></div>
              <span>Ban công</span>
            </div>
            <div className="legend-item">
              <div className="legend-color inactive"></div>
              <span>Không hoạt động</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="seats-list">
          <table className="seats-table">
            <thead>
              <tr>
                <th>Hàng</th>
                <th>Số ghế</th>
                <th>Loại</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredSeats.map(seat => (
                <tr key={seat.id}>
                  <td>{seat.row_number}</td>
                  <td>{seat.seat_number}</td>
                  <td>
                    <span className={`type-badge ${seat.seat_type}`}>
                      {getSeatTypeLabel(seat.seat_type)}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${seat.is_active ? 'active' : 'inactive'}`}>
                      {seat.is_active ? 'Hoạt động' : 'Không hoạt động'}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-edit"
                      onClick={() => handleSeatClick(seat)}
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Seat Detail Modal */}
      {selectedSeat && (
        <SeatDetailModal
          seat={selectedSeat}
          onClose={() => setSelectedSeat(null)}
          onUpdate={handleUpdateSeat}
        />
      )}

      {/* Generate Seats Modal */}
      {showGenerateModal && (
        <GenerateSeatsModal
          hall={hall}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={handleGenerateSeats}
        />
      )}
    </div>
  )
}

// Seat Detail Modal Component
const SeatDetailModal = ({ seat, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    seat_type: seat.seat_type,
    is_active: seat.is_active
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onUpdate(seat.id, formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chỉnh sửa ghế {seat.row_number}-{seat.seat_number}</h3>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Loại ghế</label>
            <select
              value={formData.seat_type}
              onChange={e => setFormData({ ...formData, seat_type: e.target.value })}
            >
              <option value="standard">Thường</option>
              <option value="premium">Hạng sang</option>
              <option value="vip">VIP</option>
              <option value="balcony">Ban công</option>
            </select>
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Ghế hoạt động</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-save">
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Generate Seats Modal Component
const GenerateSeatsModal = ({ hall, onClose, onGenerate }) => {
  const [config, setConfig] = useState({
    rows: hall.total_rows || 10,
    seatsPerRow: hall.seats_per_row || 10,
    seatType: 'standard'
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (confirm(`Bạn có chắc muốn tạo ${config.rows * config.seatsPerRow} ghế mới?`)) {
      onGenerate(config)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Tạo ghế tự động</h3>
          <button className="modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Số hàng ghế</label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.rows}
              onChange={e => setConfig({ ...config, rows: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Số ghế mỗi hàng</label>
            <input
              type="number"
              min="1"
              max="50"
              value={config.seatsPerRow}
              onChange={e => setConfig({ ...config, seatsPerRow: parseInt(e.target.value) })}
            />
          </div>

          <div className="form-group">
            <label>Loại ghế mặc định</label>
            <select
              value={config.seatType}
              onChange={e => setConfig({ ...config, seatType: e.target.value })}
            >
              <option value="standard">Thường</option>
              <option value="premium">Hạng sang</option>
              <option value="vip">VIP</option>
              <option value="balcony">Ban công</option>
            </select>
          </div>

          <div className="generate-preview">
            <p>Sẽ tạo: <strong>{config.rows * config.seatsPerRow}</strong> ghế</p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="btn-save">
              Tạo ghế
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HallSeats
