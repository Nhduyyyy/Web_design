import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getHallById, updateHall, getSeatsByHall } from '../../services/hallService'
import { getPerformancesByHall, getTodayPerformances } from '../../services/playService'
import { getBookingStatsByHall } from '../../services/bookingService'
import HallOverview from './HallManagement/HallOverview'
import HallSeats from './HallManagement/HallSeats'
import HallSchedule from './HallManagement/HallSchedule'
import HallStats from './HallManagement/HallStats'
import HallSettings from './HallManagement/HallSettings'
import './HallManagement.css'

const HallManagement = () => {
  const { hallId } = useParams()
  const navigate = useNavigate()
  
  const [hall, setHall] = useState(null)
  const [seats, setSeats] = useState([])
  const [performances, setPerformances] = useState([])
  const [todayPerformances, setTodayPerformances] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadHallData()
  }, [hallId])

  const loadHallData = async () => {
    try {
      setLoading(true)
      
      const [hallData, seatsData, performancesData, statsData] = await Promise.all([
        getHallById(hallId),
        getSeatsByHall(hallId),
        getPerformancesByHall(hallId, getDateRange()),
        getBookingStatsByHall(hallId)
      ])

      setHall(hallData)
      setSeats(seatsData)
      setPerformances(performancesData)
      setStats(statsData)
      
      const today = new Date().toISOString().split('T')[0]
      setTodayPerformances(performancesData.filter(p => p.performance_date === today))

    } catch (error) {
      console.error('Error loading hall data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)
    return {
      start: today.toISOString().split('T')[0],
      end: nextWeek.toISOString().split('T')[0]
    }
  }

  const handleUpdateHall = async (updates) => {
    try {
      const updated = await updateHall(hallId, updates)
      setHall(updated)
      return updated
    } catch (error) {
      console.error('Error updating hall:', error)
      throw error
    }
  }

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
    { id: 'seats', label: 'Sơ đồ ghế', icon: 'event_seat' },
    { id: 'schedule', label: 'Lịch biểu diễn', icon: 'calendar_month' },
    { id: 'stats', label: 'Thống kê', icon: 'analytics' },
    { id: 'settings', label: 'Cài đặt', icon: 'settings' }
  ]

  if (loading) {
    return (
      <div className="hall-management-loading">
        <div className="loading-spinner"></div>
        <p>Đang tải thông tin khán phòng...</p>
      </div>
    )
  }

  if (!hall) {
    return (
      <div className="hall-management-error">
        <span className="material-symbols-outlined">error</span>
        <p>Không tìm thấy khán phòng</p>
        <button onClick={() => navigate(-1)} className="btn-primary">
          Quay lại
        </button>
      </div>
    )
  }

  return (
    <div className="hall-management">
      {/* Header */}
      <div className="hall-header">
        <div className="hall-header-content">
          <button onClick={() => navigate(-1)} className="back-button">
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại
          </button>

          <div className="hall-title-section">
            <div className="hall-title-info">
              <h1 className="hall-title">{hall.name}</h1>
              <div className="hall-meta">
                <span className="meta-item">
                  <span className="material-symbols-outlined">location_on</span>
                  Tầng {hall.floor?.floor_number}
                </span>
                <span className="meta-item">
                  <span className="material-symbols-outlined">groups</span>
                  {hall.capacity} ghế
                </span>
                <span className={`status-badge status-${hall.status}`}>
                  {hall.status === 'active' && 'Hoạt động'}
                  {hall.status === 'maintenance' && 'Bảo trì'}
                  {hall.status === 'closed' && 'Đóng cửa'}
                </span>
              </div>
            </div>

            <div className="hall-quick-stats">
              <div className="quick-stat">
                <span className="stat-label">Hôm nay</span>
                <span className="stat-value">{todayPerformances.length} buổi</span>
              </div>
              <div className="quick-stat">
                <span className="stat-label">Tuần này</span>
                <span className="stat-value">{performances.length} buổi</span>
              </div>
              <div className="quick-stat">
                <span className="stat-label">Doanh thu tháng</span>
                <span className="stat-value">
                  {stats?.monthlyRevenue?.toLocaleString('vi-VN') || 0}đ
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="hall-tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`hall-tab ${activeTab === tab.id ? 'active' : ''}`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="hall-content">
        {activeTab === 'overview' && (
          <HallOverview 
            hall={hall}
            todayPerformances={todayPerformances}
            stats={stats}
          />
        )}

        {activeTab === 'seats' && (
          <HallSeats 
            hall={hall}
            seats={seats}
            onUpdate={loadHallData}
          />
        )}

        {activeTab === 'schedule' && (
          <HallSchedule 
            hall={hall}
            performances={performances}
            onUpdate={loadHallData}
          />
        )}

        {activeTab === 'stats' && (
          <HallStats 
            hall={hall}
            stats={stats}
          />
        )}

        {activeTab === 'settings' && (
          <HallSettings 
            hall={hall}
            onUpdate={handleUpdateHall}
          />
        )}
      </div>
    </div>
  )
}

export default HallManagement
