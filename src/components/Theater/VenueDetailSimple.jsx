import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getVenueById } from '../../services/theaterService'
import { getFloorsByTheater, getHallsByTheater } from '../../services/hallService'
import { getPlaysByTheater } from '../../services/playService'
import './VenueDetail.css'

// Giả lập dữ liệu nếu API trả về rỗng để hiển thị UI
const MOCK_FLOORS = [
  { id: 1, floor_number: 1, name: 'Tầng 1 (Trệt)' },
  { id: 2, floor_number: 2, name: 'Tầng 2 (Ban Công)' },
  { id: 3, floor_number: 3, name: 'Tầng Kỹ Thuật' },
]

const MOCK_HALLS = [
  { id: 1, floor_id: 1, name: 'Khán Phòng Lớn', capacity: 500, status: 'active', has_sound_system: true, has_lighting_system: true },
  { id: 2, floor_id: 1, name: 'Phòng VIP', capacity: 50, status: 'active', has_sound_system: true, has_lighting_system: true },
  { id: 3, floor_id: 2, name: 'Khán Phòng Nhỏ', capacity: 150, status: 'maintenance', has_sound_system: true, has_lighting_system: false },
]

const MOCK_PLAYS = [
  { id: 1, title: 'Thái Hậu Dương Vân Nga', author: 'Hoa Phượng - Chi Lăng', director: 'NSND Ngọc Giàu', duration_minutes: 120, genre: 'Cải Lương', description: 'Tác phẩm kinh điển về lòng yêu nước' },
  { id: 2, title: 'San Hậu', author: 'Khuyết danh', director: 'NSƯT Hữu Danh', duration_minutes: 90, genre: 'Tuồng Cổ', description: 'Vở tuồng mẫu mực của nghệ thuật Hát Bội' },
]

const MOCK_SCHEDULE = [
  { id: 1, play_id: 1, hall_id: 1, performance_date: '2026-03-01', start_time: '19:30', end_time: '21:30', sold_seats: 450, total_seats: 500, revenue: 90000000 },
  { id: 2, play_id: 2, hall_id: 3, performance_date: '2026-03-02', start_time: '20:00', end_time: '21:30', sold_seats: 120, total_seats: 150, revenue: 12000000 },
]

const VenueDetailSimple = () => {
  const { hallId } = useParams()
  const navigate = useNavigate()

  // States
  const [venue, setVenue] = useState(null)
  const [floors, setFloors] = useState([])
  const [halls, setHalls] = useState([])
  const [plays, setPlays] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Tabs: overview, halls, plays, schedule, staff
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadVenueData()
  }, [hallId])

  const loadVenueData = async () => {
    try {
      setLoading(true)
      const venueData = await getVenueById(hallId)
      setVenue(venueData)

      // Fetch related data (using theater_id for now as in original service, assume venue belongs to theater)
      // If the tables are empty, we fallback to our rich Mock Data to showcase UI
      try {
        const _floors = await getFloorsByTheater(venueData.theater_id)
        const _halls = await getHallsByTheater(venueData.theater_id)
        const _plays = await getPlaysByTheater(venueData.theater_id)

        setFloors(_floors?.length ? _floors : MOCK_FLOORS)
        setHalls(_halls?.length ? _halls : MOCK_HALLS)
        setPlays(_plays?.length ? _plays : MOCK_PLAYS)
        setSchedules(MOCK_SCHEDULE) // TODO: Implement Schedule Fetching
      } catch (e) {
        console.warn('Fallback to mock data due to DB error or empty tables')
        setFloors(MOCK_FLOORS)
        setHalls(MOCK_HALLS)
        setPlays(MOCK_PLAYS)
        setSchedules(MOCK_SCHEDULE)
      }

    } catch (error) {
      console.error('Error loading venue:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'maintenance': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'inactive': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Đang tải thông tin địa điểm...</p>
        </div>
      </div>
    )
  }

  if (error || !venue) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Không tìm thấy địa điểm'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110"
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  // --- SUB-COMPONENTS CHO TỪNG TAB ---

  const TabOverview = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-3 gap-6"
    >
      <div className="md:col-span-2 space-y-6">
        <div className="bg-surface-dark rounded-xl border border-border-gold p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-bl-full -z-0"></div>
          <h3 className="text-xl font-bold text-primary mb-4 flex items-center gap-2 relative z-10">
            <span className="material-symbols-outlined">theater_comedy</span>
            Thông tin chung
          </h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div>
              <p className="text-slate-400 text-sm">Tên Nhà Hát</p>
              <p className="text-slate-100 font-semibold text-lg">{venue.name}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Thành Phố</p>
              <p className="text-slate-100 font-semibold text-lg">{venue.city}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-400 text-sm">Địa chỉ chi tiết</p>
              <p className="text-slate-100 font-semibold">{venue.address}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Sức chứa tối đa</p>
              <p className="text-slate-100 font-semibold text-lg">{venue.capacity || 0} ghế</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Số lượng khán phòng</p>
              <p className="text-slate-100 font-semibold text-lg">{halls.length} phòng</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
          <h3 className="text-lg font-bold text-primary mb-4">Lịch biểu diễn hôm nay</h3>
          <div className="space-y-4">
            {schedules.filter(s => s.performance_date === new Date().toISOString().split('T')[0]).length === 0 ? (
              <p className="text-slate-400 text-center italic">Không có suất diễn nào hôm nay</p>
            ) : (
              schedules.map(sch => (
                <div key={sch.id} className="p-3 bg-background-dark/50 border border-slate-700 rounded-lg">
                  <p className="font-bold text-slate-100">{plays.find(p => p.id === sch.play_id)?.title}</p>
                  <p className="text-sm text-slate-400">{sch.start_time} - {halls.find(h => h.id === sch.hall_id)?.name}</p>
                </div>
              ))
            )}
            <button
              onClick={() => setActiveTab('schedule')}
              className="w-full mt-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
            >
              Xem toàn bộ lịch trình
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )

  const TabHalls = () => {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-100">Cấu trúc Tầng & Khán Phòng</h3>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-surface-dark border border-slate-600 text-slate-200 rounded-lg hover:border-primary">
              + Thêm Tầng
            </button>
            <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(255,215,0,0.3)]">
              + Thêm Khán Phòng
            </button>
          </div>
        </div>

        {floors.map(floor => {
          const floorHalls = halls.filter(h => h.floor_id === floor.id)
          const totalCapacity = floorHalls.reduce((sum, h) => sum + (h.capacity || 0), 0)

          return (
            <div key={floor.id} className="bg-surface-dark rounded-xl border border-border-gold/50 overflow-hidden">
              {/* Floor Header */}
              <div className="bg-background-dark p-4 border-b border-border-gold/30 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    T{floor.floor_number}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-100">{floor.name || `Tầng ${floor.floor_number}`}</h4>
                    <p className="text-sm text-slate-400">{floorHalls.length} Khán phòng • {totalCapacity} Ghế</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-slate-400 hover:text-primary"><span className="material-symbols-outlined">edit</span></button>
                  <button className="p-2 text-slate-400 hover:text-red-400"><span className="material-symbols-outlined">delete</span></button>
                </div>
              </div>

              {/* Halls in Floor */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {floorHalls.length === 0 ? (
                  <p className="text-slate-500 italic p-4">Chưa có khán phòng nào ở tầng này.</p>
                ) : (
                  floorHalls.map(hall => (
                    <div key={hall.id} className="bg-background-dark/80 p-4 rounded-lg border border-slate-700 hover:border-primary/50 transition-colors group">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-bold text-slate-100 group-hover:text-primary transition-colors">{hall.name}</h5>
                        <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(hall.status)}`}>
                          {hall.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-4">
                        <p><span className="material-symbols-outlined text-[1rem] mr-1 align-middle">groups</span> {hall.capacity} Ghế</p>
                        <p><span className="material-symbols-outlined text-[1rem] mr-1 align-middle">chair</span> Ghế Cố Định</p>
                      </div>

                      <div className="flex gap-2 mb-4">
                        {hall.has_sound_system && <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-600">Âm thanh</span>}
                        {hall.has_lighting_system && <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-600">Ánh sáng</span>}
                      </div>

                      <div className="flex justify-between pt-3 border-t border-slate-700/50">
                        <button className="text-xs text-primary hover:underline flex items-center">
                          <span className="material-symbols-outlined text-[1rem] mr-1">grid_on</span>
                          Cấu hình sơ đồ ghế
                        </button>
                        <button className="text-xs text-slate-300 hover:text-white flex items-center">
                          <span className="material-symbols-outlined text-[1rem] mr-1">settings</span>
                          Sửa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </motion.div>
    )
  }

  const TabPlays = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-100">Kho Vở Diễn</h3>
        <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110">
          + Thêm Vở Diễn Mới
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {plays.map(play => (
          <div key={play.id} className="flex flex-row bg-surface-dark border border-border-gold/50 rounded-xl overflow-hidden hover:border-primary transition-all">
            <div className="w-1/3 bg-slate-800 flex items-center justify-center border-r border-slate-700">
              {/* Thumbnail placeholder */}
              <span className="material-symbols-outlined text-5xl text-slate-600">theater_comedy</span>
            </div>
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-bold text-primary leading-tight">{play.title}</h4>
                  <span className="px-2 py-1 bg-accent-red/20 text-accent-red text-xs font-bold rounded border border-accent-red/30 whitespace-nowrap ml-2">
                    {play.genre}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mb-1">Tác giả: <span className="text-slate-200">{play.author}</span></p>
                <p className="text-slate-400 text-sm mb-3">Đạo diễn: <span className="text-slate-200">{play.director}</span></p>
                <p className="text-slate-500 text-sm line-clamp-2">{play.description}</p>
              </div>
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">schedule</span>
                  {play.duration_minutes} Phút
                </span>
                <button className="text-primary text-sm hover:underline font-bold">Chỉnh sửa</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )

  const TabSchedule = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-slate-100">Lịch Trình Biểu Diễn</h3>
        <button className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110">
          + Lên Lịch Diễn
        </button>
      </div>

      <div className="bg-surface-dark rounded-xl border border-border-gold/50 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background-dark border-b border-border-gold/50">
              <th className="p-4 text-slate-400 font-medium">Khán Phòng</th>
              <th className="p-4 text-slate-400 font-medium">Ngày Diễn</th>
              <th className="p-4 text-slate-400 font-medium">Giờ</th>
              <th className="p-4 text-slate-400 font-medium">Vở Diễn</th>
              <th className="p-4 text-slate-400 font-medium text-center">Bán Vé</th>
              <th className="p-4 text-slate-400 font-medium text-right">Doanh Thu</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(sch => {
              const play = plays.find(p => p.id === sch.play_id)
              const hall = halls.find(h => h.id === sch.hall_id)
              const occupancyRate = (sch.sold_seats / sch.total_seats) * 100

              return (
                <tr key={sch.id} className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-slate-200">{hall?.name}</td>
                  <td className="p-4 text-slate-300">{new Date(sch.performance_date).toLocaleDateString('vi-VN')}</td>
                  <td className="p-4 text-primary font-bold">{sch.start_time}</td>
                  <td className="p-4 text-slate-200 max-w-[200px] truncate">{play?.title}</td>
                  <td className="p-4">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-200">{sch.sold_seats}/{sch.total_seats}</span>
                      <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${occupancyRate > 80 ? 'bg-green-500' : occupancyRate > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${occupancyRate}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-right text-accent-red font-bold">
                    {sch.revenue.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-slate-400 hover:text-white p-2"><span className="material-symbols-outlined">more_vert</span></button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )

  const TabStaff = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20 px-6">
      <span className="material-symbols-outlined text-6xl text-primary/50 mb-4 block">groups</span>
      <h3 className="text-2xl font-bold text-slate-100 mb-2">Quản lý Nghệ sĩ & Đạo cụ</h3>
      <p className="text-slate-400 max-w-lg mx-auto mb-6">
        Hệ thống đang được nâng cấp để hỗ trợ quản lý diễn viên, đoàn đào/kép, đạo cụ sân khấu và trang phục chuyên nghiệp dành riêng cho nghệ thuật Tuồng & Cải Lương.
      </p>
      <button className="px-6 py-2 border border-primary text-primary rounded-lg hover:bg-primary/10">
        Đăng ký trải nghiệm sớm
      </button>
    </motion.div>
  )

  return (
    <div className="min-h-screen bg-background-dark pb-12">
      {/* Header Cover */}
      <div className="h-48 bg-surface-dark border-b border-border-gold relative overflow-hidden flex items-end">
        <div className="absolute inset-0 bg-gradient-to-t from-background-dark to-transparent z-10"></div>
        <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-0"></div>

        <div className="max-w-7xl mx-auto px-6 pb-6 relative z-20 w-full flex justify-between items-end">
          <div>
            <button
              onClick={() => navigate('/theater')}
              className="flex items-center gap-2 text-slate-400 hover:text-primary mb-4 transition-colors font-semibold"
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Về Danh Sách Cơ Sở
            </button>
            <h1 className="text-4xl font-black text-slate-100 mb-2 uppercase tracking-wide gold-text-shadow">
              {venue.name}
            </h1>
            <div className="flex items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">location_on</span> {venue.city}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-sm text-primary">meeting_room</span> {halls.length} Khán Phòng</span>
              <span className={`px-2 py-0.5 rounded text-xs border uppercase font-bold tracking-wider ${getStatusColor(venue.status)}`}>
                {venue.status === 'active' ? 'Hoạt động' : 'Bảo trì'}
              </span>
            </div>
          </div>
          <button className="px-5 py-2.5 bg-surface-dark border border-slate-600 hover:border-primary text-white rounded-lg transition-all flex items-center gap-2 shadow-lg z-20">
            <span className="material-symbols-outlined text-sm">edit</span>
            Chỉnh sửa Venue
          </button>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="sticky top-0 z-30 bg-background-dark/95 backdrop-blur-md border-b border-border-gold/30">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar">
          <div className="flex gap-2 py-4">
            {[
              { id: 'overview', label: 'Tổng Quan', icon: 'dashboard' },
              { id: 'halls', label: 'Tầng & Khán Phòng', icon: 'weekend' },
              { id: 'plays', label: 'Vở Diễn', icon: 'masks' },
              { id: 'schedule', label: 'Lịch Biểu Diễn', icon: 'event_note' },
              { id: 'staff', label: 'Đoàn & Đạo Cụ', icon: 'group_work' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                    ? 'bg-primary text-background-dark shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                    : 'bg-surface-dark text-slate-400 hover:text-slate-100 hover:bg-surface-dark/80 border border-transparent hover:border-slate-600'
                  }`}
              >
                <span className="material-symbols-outlined text-[1.1rem]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-6 pt-8">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && <TabOverview key="overview" />}
          {activeTab === 'halls' && <TabHalls key="halls" />}
          {activeTab === 'plays' && <TabPlays key="plays" />}
          {activeTab === 'schedule' && <TabSchedule key="schedule" />}
          {activeTab === 'staff' && <TabStaff key="staff" />}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default VenueDetailSimple
