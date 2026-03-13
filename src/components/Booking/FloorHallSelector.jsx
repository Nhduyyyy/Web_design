import { useState, useEffect } from 'react'
import { getFloorsByVenue, getHallsByFloor } from '../../services/hallService'
import './booking.css'

export default function FloorHallSelector({ 
  venueId, 
  selectedFloor, 
  selectedHall, 
  onFloorChange, 
  onHallChange 
}) {
  const [floors, setFloors] = useState([])
  const [halls, setHalls] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load floors when venue changes
  useEffect(() => {
    if (!venueId) {
      setFloors([])
      setHalls([])
      setLoading(false)
      return
    }

    loadFloors()
  }, [venueId])

  // Load halls when floor changes
  useEffect(() => {
    if (!selectedFloor) {
      setHalls([])
      return
    }

    loadHalls()
  }, [selectedFloor])

  const loadFloors = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFloorsByVenue(venueId)
      setFloors(data || [])
    } catch (err) {
      console.error('Error loading floors:', err)
      setError('Không thể tải danh sách tầng')
    } finally {
      setLoading(false)
    }
  }

  const loadHalls = async () => {
    try {
      setError(null)
      const data = await getHallsByFloor(selectedFloor)
      setHalls(data || [])
    } catch (err) {
      console.error('Error loading halls:', err)
      setError('Không thể tải danh sách khán phòng')
    }
  }

  const handleFloorChange = (e) => {
    const floorId = e.target.value
    onFloorChange(floorId || null)
    onHallChange(null) // Reset hall selection
  }

  const handleHallChange = (e) => {
    const hallId = e.target.value
    onHallChange(hallId || null)
  }

  const getFloorLabel = (floor) => {
    if (floor.floor_number === 0) return 'Tầng trệt'
    if (floor.floor_number > 0) return `Tầng ${floor.floor_number}`
    return `Tầng hầm ${Math.abs(floor.floor_number)}`
  }

  if (loading) {
    return (
      <div className="floor-hall-selector loading">
        <div className="seat-loading-container" style={{ padding: '2rem' }}>
          <div className="double-ring-spinner">
            <div className="ring-outer"></div>
            <div className="ring-inner"></div>
          </div>
          <div className="loading-text">Đang tải danh sách tầng...</div>
          <div className="loading-subtext">Vui lòng chờ trong giây lát</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="floor-hall-selector error">
        <p className="error-message">⚠️ {error}</p>
        <button onClick={loadFloors} className="btn-secondary">
          Thử lại
        </button>
      </div>
    )
  }

  if (!venueId) {
    return (
      <div className="floor-hall-selector empty">
        <p>Không có thông tin địa điểm</p>
      </div>
    )
  }

  return (
    <div className="floor-hall-selector">
      <div className="selector-row">
        {/* Floor Dropdown */}
        <div className="selector-field">
          <label htmlFor="floor-select">Chọn Tầng</label>
          <select
            id="floor-select"
            value={selectedFloor || ''}
            onChange={handleFloorChange}
            className="selector-dropdown"
          >
            <option value="">-- Chọn tầng --</option>
            {floors.map((floor) => (
              <option key={floor.id} value={floor.id}>
                {getFloorLabel(floor)} - {floor.name}
                {floor.total_halls > 0 && ` (${floor.total_halls} khán phòng)`}
              </option>
            ))}
          </select>
        </div>

        {/* Hall Dropdown */}
        <div className="selector-field">
          <label htmlFor="hall-select">Chọn Khán Phòng</label>
          <select
            id="hall-select"
            value={selectedHall || ''}
            onChange={handleHallChange}
            className="selector-dropdown"
            disabled={!selectedFloor || halls.length === 0}
          >
            <option value="">-- Chọn khán phòng --</option>
            {halls.map((hall) => (
              <option key={hall.id} value={hall.id}>
                {hall.name}
                {hall.capacity > 0 && ` (${hall.capacity} ghế)`}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
