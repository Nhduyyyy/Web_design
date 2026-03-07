import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getVenueById, getTheaterById } from '../../services/theaterService'
import { 
  getFloorsByTheater, 
  getFloorsByVenue,
  getHallsByTheater, 
  getHallsByVenue,
  createFloor, 
  updateFloor, 
  deleteFloor,
  createHall,
  updateHall,
  deleteHall
} from '../../services/hallService'
import { getPlaysByTheater, getPerformancesByTheater, getTodayPerformances } from '../../services/playService'
import FloorModal from './FloorModal'
import HallModal from './HallModal'
import DebugPanel from './DebugPanel'
import './VenueDetail.css'

const VenueDetailSimple = () => {
  const { hallId } = useParams()
  const navigate = useNavigate()

  // States
  const [venue, setVenue] = useState(null)
  const [theater, setTheater] = useState(null)
  const [floors, setFloors] = useState([])
  const [halls, setHalls] = useState([])
  const [plays, setPlays] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Modal states
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false)
  const [isHallModalOpen, setIsHallModalOpen] = useState(false)
  const [editingFloor, setEditingFloor] = useState(null)
  const [editingHall, setEditingHall] = useState(null)

  // Tabs: overview, halls, plays, schedule, staff
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadVenueData()
  }, [hallId])

  const loadVenueData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch venue data
      const venueData = await getVenueById(hallId)
      setVenue(venueData)

      if (!venueData.theater_id) {
        throw new Error('Venue không có theater_id')
      }

      // Fetch theater to get organization relationship
      // Note: Schema has floors.theater_id -> organizations.id
      // So we use theater_id directly as it should be the organization_id
      const theaterId = venueData.theater_id

      // Fetch related data from database
      // Use venue_id for floors and halls to avoid cross-venue contamination
      const [floorsData, hallsData, playsData, performancesData] = await Promise.all([
        getFloorsByVenue(hallId), // Query by venue_id instead of theater_id
        getHallsByVenue(hallId),  // Query by venue_id instead of theater_id
        getPlaysByTheater(theaterId),
        getPerformancesByTheater(theaterId)
      ])

      setFloors(floorsData || [])
      setHalls(hallsData || [])
      setPlays(playsData || [])
      setSchedules(performancesData || [])

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

  // Floor CRUD handlers
  const handleAddFloor = () => {
    setEditingFloor(null)
    setIsFloorModalOpen(true)
  }

  const handleEditFloor = (floor) => {
    setEditingFloor(floor)
    setIsFloorModalOpen(true)
  }

  const handleSaveFloor = async (floorData, floorId) => {
    try {
      console.log('Saving floor with data:', floorData)
      console.log('Theater ID:', venue?.theater_id)
      
      if (floorId) {
        await updateFloor(floorId, floorData)
      } else {
        await createFloor(floorData)
      }
      setIsFloorModalOpen(false)
      setEditingFloor(null)
      await loadVenueData()
    } catch (error) {
      console.error('Error saving floor:', error)
      console.error('Error details:', error.details, error.hint, error.code)
      
      // Handle specific errors
      if (error.code === '42501') {
        alert(
          'Lỗi bảo mật: Bạn không có quyền tạo tầng.\n\n' +
          'Nguyên nhân có thể:\n' +
          '1. Chưa đăng nhập hoặc session hết hạn\n' +
          '2. Tài khoản chưa có quyền theater owner\n' +
          '3. Database chưa cấu hình Row Level Security policies\n\n' +
          'Vui lòng:\n' +
          '- Đăng xuất và đăng nhập lại\n' +
          '- Hoặc liên hệ admin để được cấp quyền\n' +
          '- Hoặc xem file docs/FIX_RLS_ERROR.md để cấu hình database'
        )
      } else if (error.code === '23503') {
        alert(
          'Lỗi Foreign Key: Theater ID không tồn tại trong database.\n\n' +
          'Chi tiết: ' + error.details + '\n\n' +
          'Nguyên nhân:\n' +
          '- Database schema có vấn đề về foreign key constraints\n' +
          '- floors.theater_id đang trỏ đến bảng sai\n\n' +
          'Giải pháp:\n' +
          '1. Vào Supabase SQL Editor\n' +
          '2. Chạy file: supabase/FIX_FOREIGN_KEY.sql\n' +
          '3. Refresh trang và thử lại\n\n' +
          'Hoặc click nút "🐛 Debug RLS" để xem chi tiết'
        )
      } else if (error.code === '22P02' && error.message.includes('floor_type')) {
        alert('Lỗi: Loại tầng không hợp lệ. Vui lòng chọn một trong các giá trị: main, balcony, technical, vip')
      } else {
        const errorMessage = error.message || error.hint || JSON.stringify(error)
        alert('Lỗi khi lưu tầng: ' + errorMessage)
      }
    }
  }

  const handleDeleteFloor = async (floorId) => {
    if (!confirm('Bạn có chắc muốn xóa tầng này? Tất cả khán phòng trong tầng cũng sẽ bị xóa.')) {
      return
    }
    try {
      await deleteFloor(floorId)
      await loadVenueData()
    } catch (error) {
      console.error('Error deleting floor:', error)
      alert('Lỗi khi xóa tầng: ' + error.message)
    }
  }

  // Hall CRUD handlers
  const handleAddHall = () => {
    if (floors.length === 0) {
      alert('Vui lòng thêm tầng trước khi thêm khán phòng')
      return
    }
    setEditingHall(null)
    setIsHallModalOpen(true)
  }

  const handleEditHall = (hall) => {
    setEditingHall(hall)
    setIsHallModalOpen(true)
  }

  const handleSaveHall = async (hallData, hallId) => {
    try {
      if (hallId) {
        await updateHall(hallId, hallData)
      } else {
        await createHall(hallData)
      }
      setIsHallModalOpen(false)
      setEditingHall(null)
      await loadVenueData()
    } catch (error) {
      console.error('Error saving hall:', error)
      alert('Lỗi khi lưu khán phòng: ' + error.message)
    }
  }

  const handleDeleteHall = async (hallId) => {
    if (!confirm('Bạn có chắc muốn xóa khán phòng này?')) {
      return
    }
    try {
      await deleteHall(hallId)
      await loadVenueData()
    } catch (error) {
      console.error('Error deleting hall:', error)
      alert('Lỗi khi xóa khán phòng: ' + error.message)
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
              schedules
                .filter(s => s.performance_date === new Date().toISOString().split('T')[0])
                .map(performance => {
                  const play = plays.find(p => p.id === performance.play_id)
                  const hall = halls.find(h => h.id === performance.hall_id)
                  return (
                    <div key={performance.id} className="p-3 bg-background-dark/50 border border-slate-700 rounded-lg">
                      <p className="font-bold text-slate-100">{play?.title || 'N/A'}</p>
                      <p className="text-sm text-slate-400">{performance.start_time} - {hall?.name || 'N/A'}</p>
                    </div>
                  )
                })
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
            <button 
              onClick={handleAddFloor}
              className="px-4 py-2 bg-surface-dark border border-slate-600 text-slate-200 rounded-lg hover:border-primary transition-colors"
            >
              + Thêm Tầng
            </button>
            <button 
              onClick={handleAddHall}
              className="px-4 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110 shadow-[0_0_15px_rgba(255,215,0,0.3)] transition-all"
            >
              + Thêm Khán Phòng
            </button>
          </div>
        </div>

        {floors.length === 0 ? (
          <div className="text-center py-20 px-6">
            <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">weekend</span>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có tầng nào</h3>
            <p className="text-slate-500 mb-6">Thêm tầng đầu tiên để bắt đầu quản lý khán phòng</p>
            <button 
              onClick={handleAddFloor}
              className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110"
            >
              + Thêm Tầng
            </button>
          </div>
        ) : (
          floors.map(floor => {
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
                    <button 
                      onClick={() => handleEditFloor(floor)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors"
                      title="Chỉnh sửa tầng"
                    >
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button 
                      onClick={() => handleDeleteFloor(floor.id)}
                      className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                      title="Xóa tầng"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>

                {/* Halls in Floor */}
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {floorHalls.length === 0 ? (
                    <div className="col-span-2 text-center py-8">
                      <p className="text-slate-500 italic mb-4">Chưa có khán phòng nào ở tầng này.</p>
                      <button 
                        onClick={handleAddHall}
                        className="px-4 py-2 bg-primary/10 border border-primary text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm"
                      >
                        + Thêm Khán Phòng
                      </button>
                    </div>
                  ) : (
                    floorHalls.map(hall => (
                      <div key={hall.id} className="bg-background-dark/80 p-4 rounded-lg border border-slate-700 hover:border-primary/50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <h5 className="font-bold text-slate-100 group-hover:text-primary transition-colors">{hall.name}</h5>
                          <span className={`px-2 py-1 rounded text-xs border ${getStatusColor(hall.status)}`}>
                            {hall.status === 'active' ? 'Hoạt động' : 
                             hall.status === 'maintenance' ? 'Bảo trì' : 
                             'Không hoạt động'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm text-slate-400 mb-4">
                          <p><span className="material-symbols-outlined text-[1rem] mr-1 align-middle">groups</span> {hall.capacity || 0} Ghế</p>
                          <p><span className="material-symbols-outlined text-[1rem] mr-1 align-middle">chair</span> {hall.total_rows || 0} Hàng</p>
                        </div>

                        <div className="flex gap-2 mb-4 flex-wrap">
                          {hall.has_sound_system && <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-600">Âm thanh</span>}
                          {hall.has_lighting_system && <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-600">Ánh sáng</span>}
                          {hall.has_projection && <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-600">Máy chiếu</span>}
                          {hall.has_orchestra_pit && <span className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded-md border border-slate-600">Hố nhạc</span>}
                        </div>

                        <div className="flex justify-between pt-3 border-t border-slate-700/50">
                          <button className="text-xs text-primary hover:underline flex items-center">
                            <span className="material-symbols-outlined text-[1rem] mr-1">grid_on</span>
                            Cấu hình sơ đồ ghế
                          </button>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleEditHall(hall)}
                              className="text-xs text-slate-300 hover:text-white flex items-center"
                              title="Chỉnh sửa"
                            >
                              <span className="material-symbols-outlined text-[1rem] mr-1">settings</span>
                              Sửa
                            </button>
                            <button 
                              onClick={() => handleDeleteHall(hall.id)}
                              className="text-xs text-red-400 hover:text-red-300 flex items-center"
                              title="Xóa"
                            >
                              <span className="material-symbols-outlined text-[1rem]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })
        )}
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

      {plays.length === 0 ? (
        <div className="text-center py-20 px-6">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">theater_comedy</span>
          <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có vở diễn nào</h3>
          <p className="text-slate-500 mb-6">Thêm vở diễn đầu tiên để bắt đầu quản lý lịch biểu diễn</p>
          <button className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110">
            + Thêm Vở Diễn
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {plays.map(play => (
            <div key={play.id} className="flex flex-row bg-surface-dark border border-border-gold/50 rounded-xl overflow-hidden hover:border-primary transition-all">
              <div className="w-1/3 bg-slate-800 flex items-center justify-center border-r border-slate-700">
                {play.poster_url ? (
                  <img src={play.poster_url} alt={play.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="material-symbols-outlined text-5xl text-slate-600">theater_comedy</span>
                )}
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-primary leading-tight">{play.title}</h4>
                    <span className="px-2 py-1 bg-accent-red/20 text-accent-red text-xs font-bold rounded border border-accent-red/30 whitespace-nowrap ml-2">
                      {play.genre}
                    </span>
                  </div>
                  {play.author && (
                    <p className="text-slate-400 text-sm mb-1">Tác giả: <span className="text-slate-200">{play.author}</span></p>
                  )}
                  {play.director && (
                    <p className="text-slate-400 text-sm mb-3">Đạo diễn: <span className="text-slate-200">{play.director}</span></p>
                  )}
                  {play.description && (
                    <p className="text-slate-500 text-sm line-clamp-2">{play.description}</p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
                  {play.duration && (
                    <span className="text-slate-400 text-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-base">schedule</span>
                      {play.duration} Phút
                    </span>
                  )}
                  <button className="text-primary text-sm hover:underline font-bold">Chỉnh sửa</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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

      {schedules.length === 0 ? (
        <div className="text-center py-20 px-6">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4 block">event_note</span>
          <h3 className="text-xl font-bold text-slate-300 mb-2">Chưa có lịch diễn nào</h3>
          <p className="text-slate-500 mb-6">Thêm lịch diễn để quản lý các buổi biểu diễn</p>
          <button className="px-6 py-2 bg-primary text-black font-bold rounded-lg hover:brightness-110">
            + Lên Lịch Diễn
          </button>
        </div>
      ) : (
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
              {schedules.map(performance => {
                const play = plays.find(p => p.id === performance.play_id)
                const hall = halls.find(h => h.id === performance.hall_id)
                const occupancyRate = performance.total_seats > 0 
                  ? (performance.sold_seats / performance.total_seats) * 100 
                  : 0

                return (
                  <tr key={performance.id} className="border-b border-slate-700/50 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-medium text-slate-200">{hall?.name || 'N/A'}</td>
                    <td className="p-4 text-slate-300">
                      {new Date(performance.performance_date).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="p-4 text-primary font-bold">{performance.start_time}</td>
                    <td className="p-4 text-slate-200 max-w-[200px] truncate">{play?.title || 'N/A'}</td>
                    <td className="p-4">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-slate-200">
                          {performance.sold_seats || 0}/{performance.total_seats || 0}
                        </span>
                        <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              occupancyRate > 80 ? 'bg-green-500' : 
                              occupancyRate > 50 ? 'bg-yellow-500' : 
                              'bg-red-500'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right text-accent-red font-bold">
                      {(performance.total_revenue || 0).toLocaleString('vi-VN')} đ
                    </td>
                    <td className="p-4 text-right">
                      <button className="text-slate-400 hover:text-white p-2">
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
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

      <FloorModal
        isOpen={isFloorModalOpen}
        onClose={() => {
          setIsFloorModalOpen(false)
          setEditingFloor(null)
        }}
        onSave={handleSaveFloor}
        floor={editingFloor}
        theaterId={venue?.theater_id}
        venueId={hallId}
      />

      <HallModal
        isOpen={isHallModalOpen}
        onClose={() => {
          setIsHallModalOpen(false)
          setEditingHall(null)
        }}
        onSave={handleSaveHall}
        hall={editingHall}
        floors={floors}
        theaterId={venue?.theater_id}
        venueId={hallId}
      />

      {/* Debug Panel - Only in development */}
      {import.meta.env.DEV && <DebugPanel venueId={hallId} />}
    </div>
  )
}

export default VenueDetailSimple
