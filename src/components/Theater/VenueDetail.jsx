import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getHallById, getSeatsByHall } from '../../services/hallService'
import { getPerformancesByHall, getTodayPerformances } from '../../services/playService'
import SeatMap from './SeatMap'
import PerformanceCalendar from './PerformanceCalendar'
import './VenueDetail.css'

const VenueDetail = () => {
  const { hallId } = useParams()
  const navigate = useNavigate()
  const [hall, setHall] = useState(null)
  const [seats, setSeats] = useState([])
  const [performances, setPerformances] = useState([])
  const [todayPerformances, setTodayPerformances] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview') // overview, seats, schedule, stats

  useEffect(() => {
    loadHallData()
  }, [hallId])

  const loadHallData = async () => {
    try {
      setLoading(true)
      
      // Load hall info
      const hallData = await getHallById(hallId)
      setHall(hallData)

      // Load seats
      const seatsData = await getSeatsByHall(hallId)
      setSeats(seatsData)

      // Load this week's performances
      const today = new Date()
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      const performancesData = await getPerformancesByHall(
        hallId,
        today.toISOString().split('T')[0],
        nextWeek.toISOString().split('T')[0]
      )
      setPerformances(performancesData)

      // Load today's performances
      const todayData = performancesData.filter(p => 
        p.performance_date === today.toISOString().split('T')[0]
      )
      setTodayPerformances(todayData)

    } catch (error) {
      console.error('Error loading hall data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'closed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải thông tin khán phòng...</p>
        </div>
      </div>
    )
  }

  if (!hall) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500">Không tìm thấy khán phòng</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      {/* Header */}
      <div className="bg-surface-dark border-b border-border-gold">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-slate-400 hover:text-primary mb-4 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Quay lại
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-100 mb-2">{hall.name}</h1>
              <div className="flex items-center gap-4 text-slate-400">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>Tầng {hall.floor?.floor_number}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">groups</span>
                  <span>{hall.capacity} ghế</span>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(hall.status)}`}>
                  {hall.status === 'active' && 'Hoạt động'}
                  {hall.status === 'maintenance' && 'Bảo trì'}
                  {hall.status === 'closed' && 'Đóng cửa'}
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate(`/theater/halls/${hallId}/edit`)}
              className="px-4 py-2 bg-accent-red/10 border border-accent-red/30 text-accent-red hover:bg-accent-red hover:text-white rounded-lg transition-all"
            >
              Chỉnh sửa
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-6 border-b border-border-gold">
            {[
              { id: 'overview', label: 'Tổng quan', icon: 'dashboard' },
              { id: 'seats', label: 'Sơ đồ ghế', icon: 'event_seat' },
              { id: 'schedule', label: 'Lịch biểu diễn', icon: 'calendar_month' },
              { id: 'stats', label: 'Thống kê', icon: 'analytics' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Today's Performances */}
            <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">today</span>
                Biểu diễn hôm nay
              </h2>
              
              {todayPerformances.length > 0 ? (
                <div className="space-y-3">
                  {todayPerformances.map(perf => (
                    <div key={perf.id} className="bg-background-dark rounded-lg p-4 border border-border-gold/50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100">{perf.play?.title}</h3>
                          <p className="text-sm text-slate-400">
                            {perf.start_time} - {perf.end_time || 'Chưa xác định'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-400">Đã bán</p>
                          <p className="text-lg font-bold text-primary">
                            {perf.sold_seats}/{perf.total_seats}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">Không có buổi diễn nào hôm nay</p>
              )}
            </div>

            {/* Hall Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
                <h3 className="text-lg font-bold text-slate-100 mb-4">Thông tin khán phòng</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sức chứa:</span>
                    <span className="text-slate-100 font-semibold">{hall.capacity} ghế</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Số hàng ghế:</span>
                    <span className="text-slate-100 font-semibold">{hall.total_rows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Ghế mỗi hàng:</span>
                    <span className="text-slate-100 font-semibold">{hall.seats_per_row}</span>
                  </div>
                  {hall.stage_width && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kích thước sân khấu:</span>
                      <span className="text-slate-100 font-semibold">
                        {hall.stage_width}m × {hall.stage_depth}m
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
                <h3 className="text-lg font-bold text-slate-100 mb-4">Trang thiết bị</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'has_sound_system', label: 'Âm thanh', icon: 'volume_up' },
                    { key: 'has_lighting_system', label: 'Ánh sáng', icon: 'lightbulb' },
                    { key: 'has_projection', label: 'Máy chiếu', icon: 'videocam' },
                    { key: 'has_orchestra_pit', label: 'Hố nhạc', icon: 'music_note' }
                  ].map(item => (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 p-3 rounded-lg ${
                        hall[item.key]
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-gray-500/10 text-gray-500'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">{item.icon}</span>
                      <span className="text-sm">{item.label}</span>
                      {hall[item.key] && <span className="ml-auto">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seats' && (
          <SeatMap seats={seats} hall={hall} />
        )}

        {activeTab === 'schedule' && (
          <PerformanceCalendar performances={performances} hallId={hallId} />
        )}

        {activeTab === 'stats' && (
          <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Thống kê</h2>
            <p className="text-slate-400">Đang phát triển...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default VenueDetail
