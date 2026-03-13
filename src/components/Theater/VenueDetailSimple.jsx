import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { v4 as uuidv4 } from 'uuid'
import { Eye, Edit2, Trash2, Clock, Users, RefreshCw } from 'lucide-react'
import { useShows } from '../../hooks/useShows'
import { uploadTheaterAsset, validateImageFile } from '../../utils/storageHelpers'
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
// import DebugPanel from './DebugPanel'
import { useSchedules } from '../../hooks/useSchedules'
import ScheduleList from './schedules/ScheduleList'
import ScheduleCalendar from './schedules/ScheduleCalendar'
import ScheduleFilters from './schedules/ScheduleFilters'
import ScheduleFormModal from './schedules/ScheduleFormModal'
import {
  getLivestreams,
  deleteLivestream,
  startLivestream,
  endLivestream,
  createLivestream
} from '../../services/livestreamService'
import { useTheaterEvents } from '../../hooks/useTheaterEvents'
import EventFilters from './events/EventFilters'
import EventList from './events/EventList'
import EventFormModal from './events/EventFormModal'
import EventDetailModal from './events/EventDetailModal'
import EventDeleteConfirm from './events/EventDeleteConfirm'
import './VenueDetail.css'

const VIEW_MODES_EVENTS = { GRID: 'grid', LIST: 'list' }
const VIEW_MODES_PLAYS = { GRID: 'grid', LIST: 'list' }

const LIVESTREAM_STATUS_LABELS = {
  scheduled: { label: 'Đã lên lịch', className: 'bg-yellow-500/15 text-yellow-300' },
  upcoming: { label: 'Sắp phát', className: 'bg-yellow-500/15 text-yellow-300' },
  live: { label: 'Đang phát', className: 'bg-red-600/20 text-red-400' },
  ended: { label: 'Đã kết thúc', className: 'bg-slate-600/20 text-slate-300' },
  cancelled: { label: 'Đã hủy', className: 'bg-slate-700/30 text-slate-400' }
}

const SCHEDULE_VIEW_MODES = { LIST: 'list', CALENDAR: 'calendar' }

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

  // Show modal states (for creating/editing shows from this venue)
  const [selectedShow, setSelectedShow] = useState(null)
  const [showFormOpen, setShowFormOpen] = useState(false)
  const [showFormLoading, setShowFormLoading] = useState(false)
  const [playViewMode, setPlayViewMode] = useState(VIEW_MODES_PLAYS.GRID)

  // Tabs: overview, halls, plays, schedule, staff
  const [activeTab, setActiveTab] = useState('overview')

  // Schedule tab: list/calendar view + modal (schedules table)
  const [scheduleViewMode, setScheduleViewMode] = useState(SCHEDULE_VIEW_MODES.LIST)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  // Livestreams tab
  const [livestreams, setLivestreams] = useState([])
  const [livestreamsLoading, setLivestreamsLoading] = useState(false)
  const [livestreamsError, setLivestreamsError] = useState(null)
  const [livestreamCreateModalOpen, setLivestreamCreateModalOpen] = useState(false)
  const [livestreamCreateSaving, setLivestreamCreateSaving] = useState(false)
  const [livestreamCreateError, setLivestreamCreateError] = useState(null)
  const [livestreamCreateTitle, setLivestreamCreateTitle] = useState('')
  const [livestreamCreateDescription, setLivestreamCreateDescription] = useState('')
  const [livestreamCreateStartTime, setLivestreamCreateStartTime] = useState('')
  const [livestreamCreateAccessType, setLivestreamCreateAccessType] = useState('free')
  const [livestreamCreatePrice, setLivestreamCreatePrice] = useState(0)

  const {
    schedules: venueSchedules,
    loading: schedulesLoading,
    error: schedulesError,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useSchedules(venue?.theater_id)

  // Chỉ lấy lịch của địa điểm hiện tại (venue)
  useEffect(() => {
    if (venue?.theater_id && hallId) {
      fetchSchedules({ venue_id: hallId })
    }
  }, [venue?.theater_id, hallId])

  // Load livestreams của theater (khi mở tab hoặc venue thay đổi)
  const loadLivestreams = useCallback(async () => {
    if (!venue?.theater_id) return
    setLivestreamsLoading(true)
    setLivestreamsError(null)
    try {
      const data = await getLivestreams({ theaterId: venue.theater_id })
      setLivestreams(data || [])
    } catch (err) {
      console.error('Error loading livestreams', err)
      setLivestreamsError('Không thể tải danh sách livestream. Vui lòng thử lại sau.')
      setLivestreams([])
    } finally {
      setLivestreamsLoading(false)
    }
  }, [venue?.theater_id])

  useEffect(() => {
    if (activeTab === 'livestreams' && venue?.theater_id) {
      loadLivestreams()
    }
  }, [activeTab, venue?.theater_id, loadLivestreams])

  // Events tab (theater events, filter by venue when in VenueDetail)
  const {
    events: venueEvents,
    loading: eventsLoading,
    error: eventsError,
    filters: eventFilters,
    setFilters: setEventFilters,
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
  } = useTheaterEvents(venue?.theater_id)

  useEffect(() => {
    if (activeTab === 'events' && hallId) {
      setEventFilters((prev) => ({ ...prev, venue_id: hallId }))
    }
  }, [activeTab, hallId])

  const [eventViewMode, setEventViewMode] = useState(VIEW_MODES_EVENTS.GRID)
  const [eventFormOpen, setEventFormOpen] = useState(false)
  const [eventDetailEvent, setEventDetailEvent] = useState(null)
  const [eventEditingEvent, setEventEditingEvent] = useState(null)
  const [eventDeletingEvent, setEventDeletingEvent] = useState(null)

  const eventStats = useMemo(() => {
    if (!venueEvents?.length) {
      return { total: 0, scheduled: 0, ongoing: 0, completed: 0, upcoming7Days: 0, currentMonthParticipants: 0 }
    }
    const now = new Date()
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(now.getDate() + 7)
    let upcoming7Days = 0
    let currentMonthParticipants = 0
    const total = venueEvents.length
    const scheduled = venueEvents.filter((e) => e.status === 'scheduled').length
    const ongoing = venueEvents.filter((e) => e.status === 'ongoing').length
    const completed = venueEvents.filter((e) => e.status === 'completed').length
    for (const e of venueEvents) {
      if (e.status === 'scheduled' && e.event_date) {
        const d = new Date(e.event_date)
        if (d >= now && d <= sevenDaysLater) upcoming7Days += 1
      }
      if (e.created_at) {
        const d = new Date(e.created_at)
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          currentMonthParticipants += e.current_participants || 0
        }
      }
    }
    return { total, scheduled, ongoing, completed, upcoming7Days, currentMonthParticipants }
  }, [venueEvents])

  // Shows data from 'shows' table (used in TabPlays)
  const venueShowFilters = useMemo(
    () => ({ venue_id: hallId }),
    [hallId],
  )

  const {
    shows,
    loading: showsLoading,
    error: showsError,
    createShow,
    updateShow,
  } = useShows(venueShowFilters)

  const playStats = useMemo(() => {
    if (!shows?.length) {
      return { total: 0, totalDuration: 0, totalTags: 0, totalCharacters: 0 }
    }
    const totalDuration = shows.reduce((sum, s) => sum + (Number(s.duration) || 0), 0)
    const totalTags = shows.reduce((sum, s) => sum + (Array.isArray(s.tags) ? s.tags.length : 0), 0)
    const totalCharacters = shows.reduce((sum, s) => sum + (Array.isArray(s.characters) ? s.characters.length : 0), 0)
    return {
      total: shows.length,
      totalDuration,
      totalTags,
      totalCharacters,
    }
  }, [shows])

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

  const ShowCard = ({ show, onEdit, onDelete, onView }) => {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="flex flex-col rounded-2xl overflow-hidden border border-border-gold/40 bg-surface-dark shadow-[0_0_30px_rgba(0,0,0,0.55)] transition-transform duration-300 hover:shadow-[0_0_40px_rgba(212,175,55,0.18)]"
      >
        <div className="relative h-48 bg-background-dark">
          {show.thumbnail_url ? (
            <img
              src={show.thumbnail_url}
              alt={show.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/60 text-4xl">
              🎭
            </div>
          )}
        </div>

        <div className="p-4 space-y-2">
          <h3 className="font-bold text-lg text-slate-50 line-clamp-1">
            {show.title}
          </h3>

          {show.description && (
            <p className="text-sm text-slate-400 line-clamp-2">
              {show.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            {show.duration && (
              <span className="flex items-center gap-1">
                <Clock size={12} /> {show.duration} phút
              </span>
            )}
            {show.characters && show.characters.length > 0 && (
              <span className="flex items-center gap-1">
                <Users size={12} /> {show.characters.length} nhân vật
              </span>
            )}
          </div>

          {show.tags && show.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {show.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-full text-xs border border-amber-500/40 bg-amber-100/10 text-amber-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="mt-auto flex gap-2 mx-4 mb-2 pt-2 border-t border-border-gold/30">
          <button
            onClick={() => onView(show)}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border-gold/40 bg-background-dark/60 py-1.5 text-sm text-slate-100 hover:bg-background-dark"
          >
            <Eye size={14} /> Xem
          </button>
          <button
            onClick={() => onEdit(show)}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-border-gold/40 bg-background-dark/60 py-1.5 text-sm text-primary hover:bg-background-dark"
          >
            <Edit2 size={14} /> Sửa
          </button>
          <button
            onClick={() => onDelete(show)}
            className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-red-500/50 bg-red-500/10 py-1.5 text-sm text-red-300 hover:bg-red-500/20"
          >
            <Trash2 size={14} /> Xóa
          </button>
        </div>
      </motion.div>
    )
  }

  const ShowForm = ({ initialData, onSubmit, onCancel, loading }) => {
    const [form, setForm] = useState({
      title: initialData?.title || '',
      description: initialData?.description || '',
      synopsis: initialData?.synopsis || '',
      duration: initialData?.duration || undefined,
      thumbnail_url: initialData?.thumbnail_url || '',
      cover_image_url: initialData?.cover_image_url || '',
      trailer_url: initialData?.trailer_url || '',
      tags: initialData?.tags || [],
      characters: initialData?.characters || [],
    })

    const [tagInput, setTagInput] = useState('')
    const [charInput, setCharInput] = useState('')
    const [errors, setErrors] = useState({})
    const [thumbnailFile, setThumbnailFile] = useState(null)
    const [coverFile, setCoverFile] = useState(null)

    const validate = () => {
      const newErrors = {}
      if (!form.title.trim()) newErrors.title = 'Tên vở diễn không được để trống'
      if (form.duration && form.duration <= 0) {
        newErrors.duration = 'Thời lượng phải lớn hơn 0'
      }
      setErrors(newErrors)
      return Object.keys(newErrors).length === 0
    }

    const handleThumbnailFileChange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validationMsg = validateImageFile(file)
      if (validationMsg) {
        setErrors((prev) => ({ ...prev, thumbnail_url: validationMsg }))
        return
      }

      setErrors((prev) => {
        const next = { ...prev }
        delete next.thumbnail_url
        return next
      })
      setThumbnailFile(file)
    }

    const handleCoverFileChange = (e) => {
      const file = e.target.files?.[0]
      if (!file) return

      const validationMsg = validateImageFile(file)
      if (validationMsg) {
        setErrors((prev) => ({ ...prev, cover_image_url: validationMsg }))
        return
      }

      setErrors((prev) => {
        const next = { ...prev }
        delete next.cover_image_url
        return next
      })
      setCoverFile(file)
    }

    const handleSubmit = async (e) => {
      e.preventDefault()
      if (!validate()) return

      try {
        const storageTheaterId = initialData?.theater_id || 'theater-shows'
        const payload = { ...form }

        if (thumbnailFile) {
          const validationMsg = validateImageFile(thumbnailFile)
          if (validationMsg) {
            setErrors((prev) => ({ ...prev, thumbnail_url: validationMsg }))
            return
          }

          const uploadedThumbnailUrl = await uploadTheaterAsset(
            storageTheaterId,
            thumbnailFile,
            'events',
            initialData?.id,
          )

          if (!uploadedThumbnailUrl) {
            setErrors((prev) => ({
              ...prev,
              thumbnail_url: 'Không thể upload ảnh thumbnail. Vui lòng thử lại.',
            }))
            return
          }

          payload.thumbnail_url = uploadedThumbnailUrl
        }

        if (coverFile) {
          const validationMsg = validateImageFile(coverFile)
          if (validationMsg) {
            setErrors((prev) => ({ ...prev, cover_image_url: validationMsg }))
            return
          }

          const uploadedCoverUrl = await uploadTheaterAsset(
            storageTheaterId,
            coverFile,
            'events',
            initialData?.id,
          )

          if (!uploadedCoverUrl) {
            setErrors((prev) => ({
              ...prev,
              cover_image_url: 'Không thể upload ảnh bìa. Vui lòng thử lại.',
            }))
            return
          }

          payload.cover_image_url = uploadedCoverUrl
        }

        await onSubmit(payload)
        setThumbnailFile(null)
        setCoverFile(null)
      } catch (err) {
        console.error('Error submitting show form:', err)
        setErrors((prev) => ({
          ...prev,
          general: err.message || 'Không thể lưu vở diễn',
        }))
      }
    }

    const addTag = () => {
      const val = tagInput.trim()
      if (val && !(form.tags || []).includes(val)) {
        setForm((f) => ({ ...f, tags: [...(f.tags || []), val] }))
      }
      setTagInput('')
    }

    const removeTag = (tag) => {
      setForm((f) => ({ ...f, tags: (f.tags || []).filter((t) => t !== tag) }))
    }

    const addCharacter = () => {
      const val = charInput.trim()
      if (val && !(form.characters || []).includes(val)) {
        setForm((f) => ({ ...f, characters: [...(f.characters || []), val] }))
      }
      setCharInput('')
    }

    const removeCharacter = (char) => {
      setForm((f) => ({ ...f, characters: (f.characters || []).filter((c) => c !== char) }))
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tên vở diễn <span className="text-red-500">*</span>
          </label>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full border-border-gold bg-background-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="VD: Trưng Nữ Vương"
          />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả ngắn</label>
          <textarea
            value={form.description || ''}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full border-border-gold bg-background-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
            placeholder="Mô tả hiển thị ở card vở diễn..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tóm tắt nội dung</label>
          <textarea
            value={form.synopsis || ''}
            onChange={(e) => setForm((f) => ({ ...f, synopsis: e.target.value }))}
            rows={4}
            className="w-full border-border-gold bg-background-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none resize-none"
            placeholder="Tóm tắt toàn bộ nội dung vở diễn..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Thời lượng (phút)</label>
          <input
            type="number"
            min={1}
            value={form.duration || ''}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                duration: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="w-full border-border-gold bg-background-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="VD: 120"
          />
          {errors.duration && <p className="text-red-500 text-xs mt-1">{errors.duration}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ảnh thumbnail vở diễn
          </label>
          <div className="space-y-2">
            {form.thumbnail_url && (
              <div className="flex items-center gap-3">
                <div className="h-14 w-24 overflow-hidden rounded-md border border-border-gold/60 bg-black/40">
                  <img
                    src={form.thumbnail_url}
                    alt="Thumbnail hiện tại"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="flex-1 text-xs text-slate-400 break-all">
                  Ảnh hiện tại sẽ được thay thế nếu bạn upload ảnh mới.
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleThumbnailFileChange}
              className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-background-dark hover:file:bg-primary/90"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Hỗ trợ JPG, PNG, WebP. Tối đa 50MB.
            </p>
            {errors.thumbnail_url && (
              <p className="mt-1 text-xs text-red-400">{errors.thumbnail_url}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ảnh bìa chi tiết
          </label>
          <div className="space-y-2">
            {form.cover_image_url && (
              <div className="flex items-center gap-3">
                <div className="h-14 w-24 overflow-hidden rounded-md border border-border-gold/60 bg-black/40">
                  <img
                    src={form.cover_image_url}
                    alt="Ảnh bìa hiện tại"
                    className="h-full w-full object-cover"
                  />
                </div>
                <p className="flex-1 text-xs text-slate-400 break-all">
                  Ảnh hiện tại sẽ được thay thế nếu bạn upload ảnh mới.
                </p>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverFileChange}
              className="block w-full text-xs text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-background-dark hover:file:bg-primary/90"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Hỗ trợ JPG, PNG, WebP. Tối đa 50MB.
            </p>
            {errors.cover_image_url && (
              <p className="mt-1 text-xs text-red-400">
                {errors.cover_image_url}
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL Trailer
          </label>
          <input
            value={form.trailer_url || ''}
            onChange={(e) =>
              setForm((f) => ({ ...f, trailer_url: e.target.value }))
            }
            className="w-full border-border-gold bg-background-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addTag()
                }
              }}
              className="flex-1 border-border-gold bg-background-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
              placeholder="Nhập tag rồi Enter..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
            >
              + Thêm
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(form.tags || []).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nhân vật</label>
          <div className="flex gap-2 mb-2">
            <input
              value={charInput}
              onChange={(e) => setCharInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCharacter()
                }
              }}
              className="flex-1 border-border-gold bg-background-dark rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-400 outline-none"
              placeholder="Tên nhân vật rồi Enter..."
            />
            <button
              type="button"
              onClick={addCharacter}
              className="px-3 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200"
            >
              + Thêm
            </button>
          </div>
          <div className="flex flex-wrap gap-1">
            {(form.characters || []).map((char) => (
              <span
                key={char}
                className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
              >
                {char}
                <button
                  type="button"
                  onClick={() => removeCharacter(char)}
                  className="hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-border-gold px-4 py-2 text-sm font-medium text-slate-200 hover:bg-background-dark"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:bg-primary/90 disabled:opacity-70"
          >
            {loading ? 'Đang lưu...' : initialData ? 'Cập nhật' : 'Tạo mới'}
          </button>
        </div>
      </form>
    )
  }

  const handleShowFormSubmit = async (data) => {
    setShowFormLoading(true)
    try {
      const payload = {
        ...data,
        venue_id: hallId,
      }

      if (selectedShow) {
        await updateShow(selectedShow.id, payload)
      } else {
        await createShow(payload)
      }
      setShowFormOpen(false)
      setSelectedShow(null)
    } finally {
      setShowFormLoading(false)
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

  const handleEditSeatLayout = (hallId) => {
    navigate(`/theater/halls/${hallId}/seat-editor`)
  }

  const handleSaveHall = async (hallData, hallId) => {
    try {
      let savedHall
      if (hallId) {
        savedHall = await updateHall(hallId, hallData)
      } else {
        savedHall = await createHall(hallData)
      }
      setIsHallModalOpen(false)
      setEditingHall(null)
      await loadVenueData()
      
      // If creating new hall, navigate to seat editor
      if (!hallId && savedHall?.id) {
        navigate(`/theater/halls/${savedHall.id}/seat-editor`)
      }
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
                          <button 
                            onClick={() => handleEditSeatLayout(hall.id)}
                            className="text-xs text-primary hover:underline flex items-center"
                            title="Cấu hình sơ đồ ghế"
                          >
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-100">
            🎭 Quản lý Vở diễn
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Tạo, chỉnh sửa và quản lý kho vở diễn gắn với địa điểm này.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-border-gold/50 bg-surface-dark p-1">
            <button
              type="button"
              onClick={() => setPlayViewMode(VIEW_MODES_PLAYS.GRID)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                playViewMode === VIEW_MODES_PLAYS.GRID
                  ? 'bg-primary text-background-dark'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lưới
            </button>
            <button
              type="button"
              onClick={() => setPlayViewMode(VIEW_MODES_PLAYS.LIST)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                playViewMode === VIEW_MODES_PLAYS.LIST
                  ? 'bg-primary text-background-dark'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Danh sách
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedShow(null)
              setShowFormOpen(true)
            }}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:brightness-110 transition-all"
          >
            + Tạo vở diễn mới
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
          <p className="text-xs text-slate-400">📋 Tổng vở diễn</p>
          <p className="mt-2 text-2xl font-bold text-slate-50">{playStats.total}</p>
        </div>
        <div className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
          <p className="text-xs text-slate-400">⏱️ Tổng thời lượng</p>
          <p className="mt-2 text-2xl font-bold text-slate-50">
            {playStats.totalDuration}
            <span className="ml-1 text-base font-normal text-slate-400">phút</span>
          </p>
        </div>
        <div className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
          <p className="text-xs text-slate-400">🏷️ Số tags</p>
          <p className="mt-2 text-2xl font-bold text-slate-50">{playStats.totalTags}</p>
        </div>
        <div className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
          <p className="text-xs text-slate-400">👤 Số nhân vật</p>
          <p className="mt-2 text-2xl font-bold text-slate-50">{playStats.totalCharacters}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
        {showsLoading && (
          <p className="py-8 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="animate-spin" size={18} />
            Đang tải danh sách vở diễn...
          </p>
        )}
        {showsError && !showsLoading && (
          <p className="mb-4 text-sm text-red-400">
            Lỗi khi tải vở diễn: <span className="font-mono">{showsError}</span>
          </p>
        )}
        {!showsLoading && !showsError && (
          playViewMode === VIEW_MODES_PLAYS.GRID ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {shows.map((show) => (
                <ShowCard
                  key={show.id}
                  show={show}
                  onEdit={(s) => {
                    setSelectedShow(s)
                    setShowFormOpen(true)
                  }}
                  onDelete={() => {}}
                  onView={() => {}}
                />
              ))}
              {shows.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-gold/70 bg-background-dark/60 px-6 py-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-600">masks</span>
                  <p className="text-sm font-semibold text-slate-100">Chưa có vở diễn nào</p>
                  <p className="text-xs text-slate-400">Hãy tạo vở diễn đầu tiên cho địa điểm này.</p>
                  <button
                    type="button"
                    onClick={() => { setSelectedShow(null); setShowFormOpen(true) }}
                    className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:brightness-110"
                  >
                    + Tạo vở diễn mới
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {shows.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-slate-600">masks</span>
                  <p className="text-sm font-semibold text-slate-100">Chưa có vở diễn nào</p>
                  <p className="text-xs text-slate-400">Hãy tạo vở diễn đầu tiên cho địa điểm này.</p>
                  <button
                    type="button"
                    onClick={() => { setSelectedShow(null); setShowFormOpen(true) }}
                    className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:brightness-110"
                  >
                    + Tạo vở diễn mới
                  </button>
                </div>
              ) : (
                shows.map((show) => (
                  <div key={show.id} className="py-3 first:pt-0 last:pb-0">
                    <ShowCard
                      show={show}
                      onEdit={(s) => {
                        setSelectedShow(s)
                        setShowFormOpen(true)
                      }}
                      onDelete={() => {}}
                      onView={() => {}}
                    />
                  </div>
                ))
              )}
            </div>
          )
        )}
      </section>
    </motion.div>
  )

  const handleScheduleFilterChange = (newFilters) => {
    fetchSchedules({ ...newFilters, venue_id: hallId })
  }

  const handleScheduleCreate = () => {
    setEditingSchedule(null)
    setScheduleModalOpen(true)
  }

  const handleScheduleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setScheduleModalOpen(true)
  }

  const handleScheduleSubmit = async (formData) => {
    const result = editingSchedule
      ? await updateSchedule(editingSchedule.id, formData)
      : await createSchedule(formData)
    if (!result.error) {
      setScheduleModalOpen(false)
      setEditingSchedule(null)
    }
    return result
  }

  const TabSchedule = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Lịch biểu diễn</h3>
          <p className="text-sm text-slate-400 mt-1">
            Tạo, chỉnh sửa và quản lý lịch diễn cho địa điểm này.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-border-gold/50 bg-surface-dark p-1">
            <button
              type="button"
              onClick={() => setScheduleViewMode(SCHEDULE_VIEW_MODES.LIST)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                scheduleViewMode === SCHEDULE_VIEW_MODES.LIST
                  ? 'bg-primary text-background-dark'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Danh sách
            </button>
            <button
              type="button"
              onClick={() => setScheduleViewMode(SCHEDULE_VIEW_MODES.CALENDAR)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                scheduleViewMode === SCHEDULE_VIEW_MODES.CALENDAR
                  ? 'bg-primary text-background-dark'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lịch
            </button>
          </div>
          <button
            type="button"
            onClick={handleScheduleCreate}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:brightness-110 transition-all"
          >
            + Thêm lịch diễn
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4 mb-4">
        <ScheduleFilters
          theaterId={venue?.theater_id}
          onChange={handleScheduleFilterChange}
          fixedVenueId={hallId}
        />
      </div>

      {schedulesLoading && (
        <p className="py-8 text-center text-slate-400">Đang tải lịch diễn...</p>
      )}
      {schedulesError && (
        <p className="mb-4 text-sm text-red-400">
          Lỗi khi tải lịch diễn: <span className="font-mono">{schedulesError}</span>
        </p>
      )}

      {!schedulesLoading && (
        <div className="rounded-xl border border-border-gold/50 bg-surface-dark/80 overflow-hidden">
          {scheduleViewMode === SCHEDULE_VIEW_MODES.LIST ? (
            <ScheduleList
              schedules={venueSchedules}
              onEdit={handleScheduleEdit}
              onDelete={deleteSchedule}
            />
          ) : (
            <div className="p-4">
              <ScheduleCalendar
                schedules={venueSchedules}
                onEdit={handleScheduleEdit}
              />
            </div>
          )}
        </div>
      )}

      {scheduleModalOpen && (
        <ScheduleFormModal
          theaterId={venue?.theater_id}
          schedule={editingSchedule}
          defaultVenueId={hallId}
          onSubmit={handleScheduleSubmit}
          onClose={() => {
            setScheduleModalOpen(false)
            setEditingSchedule(null)
          }}
        />
      )}
    </motion.div>
  )

  const handleLivestreamCreateOpen = () => {
    setLivestreamCreateError(null)
    setLivestreamCreateTitle('')
    setLivestreamCreateDescription('')
    setLivestreamCreateStartTime('')
    setLivestreamCreateAccessType('free')
    setLivestreamCreatePrice(0)
    setLivestreamCreateModalOpen(true)
  }

  const handleLivestreamCreateSubmit = async (e) => {
    e.preventDefault()
    if (!venue?.theater_id) return
    if (!livestreamCreateTitle.trim()) {
      setLivestreamCreateError('Vui lòng nhập tiêu đề livestream.')
      return
    }
    try {
      setLivestreamCreateSaving(true)
      setLivestreamCreateError(null)
      const roomId = uuidv4()
      const parsedPrice =
        livestreamCreateAccessType === 'free'
          ? 0
          : Number.isNaN(Number(livestreamCreatePrice))
            ? 0
            : Number(livestreamCreatePrice)
      const start =
        livestreamCreateStartTime && !Number.isNaN(Date.parse(livestreamCreateStartTime))
          ? new Date(livestreamCreateStartTime).toISOString()
          : new Date().toISOString()
      const created = await createLivestream({
        theater_id: venue.theater_id,
        title: livestreamCreateTitle.trim(),
        description: livestreamCreateDescription.trim() || null,
        stream_url: roomId,
        stream_key: uuidv4(),
        start_time: start,
        status: 'scheduled',
        access_type: livestreamCreateAccessType,
        price: parsedPrice,
        chat_enabled: true,
        current_viewers: 0,
        total_views: 0,
        peak_viewers: 0
      })
      setLivestreamCreateModalOpen(false)
      loadLivestreams()
      navigate(`/theater/livestreams/${created.id}/broadcast`)
    } catch (err) {
      console.error('Error creating livestream', err)
      setLivestreamCreateError(err.message || 'Không thể tạo livestream.')
    } finally {
      setLivestreamCreateSaving(false)
    }
  }

  const handleLivestreamToggleLive = async (stream) => {
    try {
      if (stream.status === 'live') {
        await endLivestream(stream.id)
      } else {
        await startLivestream(stream.id)
      }
      await loadLivestreams()
    } catch (err) {
      console.error('Error toggling live status', err)
      alert('Không thể cập nhật trạng thái livestream.')
    }
  }

  const handleLivestreamDelete = async (streamId) => {
    if (!window.confirm('Bạn có chắc muốn xóa livestream này?')) return
    try {
      await deleteLivestream(streamId)
      setLivestreams((prev) => prev.filter((s) => s.id !== streamId))
    } catch (err) {
      console.error('Error deleting livestream', err)
      alert('Không thể xóa livestream.')
    }
  }

  const TabLivestreams = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-bold text-slate-50">
            Quản lý Livestream
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Tạo, quản lý và bắt đầu buổi phát trực tiếp nghệ thuật Tuồng từ Nhà hát của bạn.
          </p>
        </div>
        <button
          type="button"
          onClick={handleLivestreamCreateOpen}
          className="px-4 py-2 rounded-lg bg-primary text-background-dark font-semibold text-sm hover:brightness-110 transition-all inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-base">add_circle</span>
          Thêm live mới
        </button>
      </header>

      {livestreamsLoading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="text-center text-slate-400 text-sm">
            Đang tải danh sách livestream...
          </div>
        </div>
      )}

      {!livestreamsLoading && livestreamsError && (
        <div className="bg-red-900/20 border border-red-500/60 text-red-200 text-sm rounded-xl px-4 py-3">
          {livestreamsError}
        </div>
      )}

      {!livestreamsLoading && !livestreamsError && livestreams.length === 0 && (
        <div className="bg-surface-dark border border-border-gold/50 rounded-xl px-6 py-10 text-center text-slate-300">
          <div className="text-3xl mb-3">📡</div>
          <h2 className="text-lg font-semibold mb-2">Chưa có livestream nào</h2>
          <p className="text-sm text-slate-400 mb-4">
            Hãy tạo buổi phát trực tiếp đầu tiên cho Nhà hát của bạn.
          </p>
          <button
            type="button"
            onClick={handleLivestreamCreateOpen}
            className="px-4 py-2 rounded-lg bg-primary text-background-dark font-semibold text-sm hover:brightness-110 transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-base">add_circle</span>
            Tạo livestream mới
          </button>
        </div>
      )}

      {!livestreamsLoading && !livestreamsError && livestreams.length > 0 && (
        <div className="bg-surface-dark border border-border-gold/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border-gold/50 flex items-center justify-between">
            <span className="text-sm text-slate-200 font-semibold">
              Livestream của Nhà hát {venue?.name || theater?.name || ''}
            </span>
            <span className="text-xs text-slate-400">
              Tổng cộng {livestreams.length} buổi phát
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-background-dark/60 text-slate-300">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">Tiêu đề</th>
                  <th className="px-4 py-2 text-left font-medium">Thời gian</th>
                  <th className="px-4 py-2 text-left font-medium">Truy cập</th>
                  <th className="px-4 py-2 text-left font-medium">Trạng thái</th>
                  <th className="px-4 py-2 text-right font-medium">Người xem</th>
                  <th className="px-4 py-2 text-right font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {livestreams.map((s) => {
                  const status = LIVESTREAM_STATUS_LABELS[s.status] || LIVESTREAM_STATUS_LABELS.scheduled
                  return (
                    <tr
                      key={s.id}
                      className="border-t border-white/5 hover:bg-background-dark/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-semibold text-slate-50 line-clamp-2">
                          {s.title}
                        </div>
                        {s.description && (
                          <div className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {s.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-300">
                        {s.start_time ? (
                          <div className="flex flex-col gap-0.5">
                            <span>
                              {new Date(s.start_time).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="text-xs text-slate-400">
                              {new Date(s.start_time).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">Chưa đặt</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-slate-300">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs uppercase tracking-wide text-slate-400">
                            {s.access_type || 'free'}
                          </span>
                          <span className="text-sm font-semibold text-amber-300">
                            {s.price
                              ? `${s.price.toLocaleString('vi-VN')}₫`
                              : 'Miễn phí'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top text-right text-slate-300">
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-sm">
                            {s.current_viewers != null
                              ? s.current_viewers.toLocaleString('vi-VN')
                              : 0}
                          </span>
                          <span className="text-xs text-slate-500">
                            Tổng: {s.total_views?.toLocaleString('vi-VN') || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/theater/livestreams/${s.id}/broadcast`)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/20 text-primary hover:bg-primary/30 transition-colors inline-flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-base">radio</span>
                            Phát sóng
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLivestreamToggleLive(s)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-100 hover:bg-slate-600 transition-colors"
                          >
                            {s.status === 'live' ? 'Kết thúc' : 'Đánh dấu Live'}
                          </button>
                          <Link
                            to={`/livestreams/${s.id}`}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-background-dark text-slate-200 hover:bg-slate-800 transition-colors"
                          >
                            Xem như viewer
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleLivestreamDelete(s.id)}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-900/40 text-red-300 hover:bg-red-800/60 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  )

  const handleEventCreateClick = () => {
    setEventEditingEvent(null)
    setEventFormOpen(true)
  }

  const handleEventEdit = (event) => {
    setEventEditingEvent(event)
    setEventFormOpen(true)
  }

  const handleEventView = (event) => {
    setEventDetailEvent(event)
  }

  const handleEventToggleStatus = async (event) => {
    try {
      if (event.status === 'draft') {
        await updateStatus(event.id, 'scheduled')
      } else if (event.status === 'scheduled') {
        await updateStatus(event.id, 'cancelled')
      }
    } catch (err) {
      console.error('Error updating event status', err)
    }
  }

  const handleEventDeleteRequest = (event) => {
    setEventDeletingEvent(event)
  }

  const handleEventDeleteConfirm = async (eventToDelete) => {
    try {
      await deleteEvent(eventToDelete.id)
      setEventDeletingEvent(null)
    } catch (err) {
      console.error('Error deleting event', err)
    }
  }

  const handleEventFormSubmit = async (payload) => {
    if (eventEditingEvent) {
      await updateEvent(eventEditingEvent.id, payload)
    } else {
      await createEvent(payload)
    }
    setEventFormOpen(false)
  }

  const TabEvents = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-slate-100">
            🎭 Quản lý sự kiện
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Tạo, chỉnh sửa và theo dõi các workshop, tour và buổi gặp gỡ nghệ sĩ của nhà hát.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-lg border border-border-gold/50 bg-surface-dark p-1">
            <button
              type="button"
              onClick={() => setEventViewMode(VIEW_MODES_EVENTS.GRID)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                eventViewMode === VIEW_MODES_EVENTS.GRID
                  ? 'bg-primary text-background-dark'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Lưới
            </button>
            <button
              type="button"
              onClick={() => setEventViewMode(VIEW_MODES_EVENTS.LIST)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                eventViewMode === VIEW_MODES_EVENTS.LIST
                  ? 'bg-primary text-background-dark'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Danh sách
            </button>
          </div>
          <button
            type="button"
            onClick={handleEventCreateClick}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:brightness-110 transition-all"
          >
            + Tạo sự kiện mới
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
          <p className="text-xs text-slate-400">📋 Tổng sự kiện</p>
          <p className="mt-2 text-2xl font-bold text-slate-50">{eventStats.total}</p>
        </div>
        <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/5 p-4">
          <p className="text-xs text-emerald-200">📅 Đã lên lịch</p>
          <p className="mt-2 text-2xl font-bold text-emerald-100">{eventStats.scheduled}</p>
        </div>
        <div className="rounded-xl border border-sky-500/50 bg-sky-500/5 p-4">
          <p className="text-xs text-sky-200">📅 Sắp diễn (7 ngày)</p>
          <p className="mt-2 text-2xl font-bold text-sky-100">{eventStats.upcoming7Days}</p>
        </div>
        <div className="rounded-xl border border-amber-500/50 bg-amber-500/5 p-4">
          <p className="text-xs text-amber-200">👥 Người đăng ký (tháng)</p>
          <p className="mt-2 text-2xl font-bold text-amber-100">{eventStats.currentMonthParticipants}</p>
        </div>
      </section>

      <section className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
        <EventFilters
          theaterId={venue?.theater_id}
          filters={eventFilters}
          onChange={(next) => setEventFilters((prev) => ({ ...prev, ...next }))}
          fixedVenueId={hallId}
        />
      </section>

      <section className="rounded-xl border border-border-gold/50 bg-surface-dark/80 p-4">
        {eventsLoading && (
          <p className="py-8 text-center text-sm text-slate-400">
            Đang tải danh sách sự kiện...
          </p>
        )}
        {eventsError && !eventsLoading && (
          <p className="mb-4 text-sm text-red-400">
            Lỗi khi tải sự kiện: <span className="font-mono">{eventsError}</span>
          </p>
        )}
        {!eventsLoading && (
          <EventList
            events={venueEvents}
            viewMode={eventViewMode}
            onView={handleEventView}
            onEdit={handleEventEdit}
            onToggleStatus={handleEventToggleStatus}
            onDelete={handleEventDeleteRequest}
          />
        )}
      </section>
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
          {/* <button className="px-5 py-2.5 bg-surface-dark border border-slate-600 hover:border-primary text-white rounded-lg transition-all flex items-center gap-2 shadow-lg z-20">
            <span className="material-symbols-outlined text-sm">edit</span>
            Chỉnh sửa Venue
          </button> */}
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
              { id: 'livestreams', label: 'Live Streams', icon: 'live_tv' },
              { id: 'events', label: 'Sự Kiện', icon: 'event' }
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
          {activeTab === 'livestreams' && <TabLivestreams key="livestreams" />}
          {activeTab === 'events' && <TabEvents key="events" />}
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

      {showFormOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-black rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-5">
              {selectedShow ? 'Chỉnh sửa vở diễn' : 'Tạo vở diễn mới'}
            </h2>
            <ShowForm
              initialData={selectedShow || undefined}
              onSubmit={handleShowFormSubmit}
              onCancel={() => {
                setShowFormOpen(false)
                setSelectedShow(null)
              }}
              loading={showFormLoading}
            />
          </div>
        </div>
      )}

      {/* Livestream create modal */}
      {livestreamCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-dark border border-border-gold/50 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-surface-dark border-b border-border-gold/50 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-100">
                Tạo Livestream mới
              </h2>
              <button
                type="button"
                onClick={() => setLivestreamCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleLivestreamCreateSubmit} className="p-6 space-y-5">
              {livestreamCreateError && (
                <div className="bg-red-900/20 border border-red-500/60 text-red-200 text-sm rounded-xl px-4 py-3">
                  {livestreamCreateError}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Tiêu đề buổi livestream
                </label>
                <input
                  type="text"
                  value={livestreamCreateTitle}
                  onChange={(e) => setLivestreamCreateTitle(e.target.value)}
                  className="w-full rounded-lg bg-background-dark border border-border-gold/50 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                  placeholder="Ví dụ: Tuồng Sơn Hậu - Đêm diễn đặc biệt"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Mô tả
                </label>
                <textarea
                  value={livestreamCreateDescription}
                  onChange={(e) => setLivestreamCreateDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-background-dark border border-border-gold/50 px-3 py-2 text-sm text-slate-100 resize-none focus:border-primary focus:outline-none"
                  placeholder="Giới thiệu nội dung buổi diễn, nghệ sĩ tham gia, thời lượng..."
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Thời gian bắt đầu (dự kiến)
                  </label>
                  <input
                    type="datetime-local"
                    value={livestreamCreateStartTime}
                    onChange={(e) => setLivestreamCreateStartTime(e.target.value)}
                    className="w-full rounded-lg bg-background-dark border border-border-gold/50 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Nếu để trống, hệ thống sẽ lấy thời gian hiện tại.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                    Kiểu truy cập
                  </label>
                  <select
                    value={livestreamCreateAccessType}
                    onChange={(e) => setLivestreamCreateAccessType(e.target.value)}
                    className="w-full rounded-lg bg-background-dark border border-border-gold/50 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                  >
                    <option value="free">Miễn phí</option>
                    <option value="paid">Trả phí</option>
                    <option value="subscribers_only">Chỉ cho người đăng ký</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-1.5">
                  Giá vé (nếu trả phí)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={livestreamCreatePrice}
                    onChange={(e) => setLivestreamCreatePrice(e.target.value)}
                    disabled={livestreamCreateAccessType === 'free'}
                    className="w-full rounded-lg bg-background-dark border border-border-gold/50 px-3 py-2 text-sm text-slate-100 focus:border-primary focus:outline-none"
                  />
                  <span className="text-sm text-slate-400">VNĐ</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Để 0 nếu miễn phí hoặc dùng chế độ có quảng cáo/đăng ký.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setLivestreamCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-border-gold/50 text-sm text-slate-200 hover:bg-background-dark transition-colors"
                  disabled={livestreamCreateSaving}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={livestreamCreateSaving}
                  className="px-5 py-2 rounded-lg bg-primary text-background-dark font-semibold text-sm hover:brightness-110 transition-all inline-flex items-center gap-2"
                >
                  {livestreamCreateSaving ? (
                    <>
                      <span className="h-4 w-4 border-2 border-background-dark/40 border-t-background-dark rounded-full animate-spin" />
                      Đang tạo...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-base">check_circle</span>
                      Tạo livestream
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {eventFormOpen && (
        <EventFormModal
          theaterId={venue?.theater_id}
          event={eventEditingEvent}
          defaultVenueId={hallId}
          onSubmit={handleEventFormSubmit}
          onClose={() => setEventFormOpen(false)}
        />
      )}
      {eventDetailEvent && (
        <EventDetailModal
          event={eventDetailEvent}
          onClose={() => setEventDetailEvent(null)}
        />
      )}
      {eventDeletingEvent && (
        <EventDeleteConfirm
          event={eventDeletingEvent}
          onConfirm={handleEventDeleteConfirm}
          onCancel={() => setEventDeletingEvent(null)}
        />
      )}

      {/* <footer className="mb-0 border-t border-border-gold p-6 text-center bg-surface-dark">
        <p className="text-slate-500 text-sm">© 2024 Tuồng Platform Vietnam. All Rights Reserved.</p>
      </footer> */}

      {/* Debug Panel - Only in development */}
      {/* {import.meta.env.DEV && <DebugPanel venueId={hallId} />} */}
    </div>
  )
}

export default VenueDetailSimple
