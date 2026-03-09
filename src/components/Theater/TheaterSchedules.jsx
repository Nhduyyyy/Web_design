import { useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import TheaterHeader from './TheaterHeader'
import { useSchedules } from '../../hooks/useSchedules'
import { getTheatersByOwner } from '../../services/theaterService'
import ScheduleCalendar from './schedules/ScheduleCalendar'
import ScheduleList from './schedules/ScheduleList'
import ScheduleFormModal from './schedules/ScheduleFormModal'
import ScheduleFilters from './schedules/ScheduleFilters'

const VIEW_MODES = {
  LIST: 'list',
  CALENDAR: 'calendar',
}

const TheaterSchedules = () => {
  const { user } = useAuth()
  const [theater, setTheater] = useState(null)
  const [loadingTheater, setLoadingTheater] = useState(true)
  const [viewMode, setViewMode] = useState(VIEW_MODES.LIST)
  const [filters, setFilters] = useState({})
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState(null)

  useEffect(() => {
    const loadTheater = async () => {
      if (!user) return
      try {
        setLoadingTheater(true)
        const theaters = await getTheatersByOwner(user.id)
        setTheater(theaters?.[0] || null)
      } catch (err) {
        console.error('Error loading theater for schedules:', err)
      } finally {
        setLoadingTheater(false)
      }
    }
    loadTheater()
  }, [user])

  const theaterId = theater?.id
  const {
    schedules,
    loading,
    error,
    fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
  } = useSchedules(theaterId)

  const handleCreate = () => {
    setEditingSchedule(null)
    setModalOpen(true)
  }

  const handleEdit = (schedule) => {
    setEditingSchedule(schedule)
    setModalOpen(true)
  }

  const handleSubmit = async (formData) => {
    const result = editingSchedule
      ? await updateSchedule(editingSchedule.id, formData)
      : await createSchedule(formData)
    if (!result.error) {
      setModalOpen(false)
    }
    return result
  }

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters)
    fetchSchedules(newFilters)
  }

  // Dark background for theater area (same as TheaterDashboard)
  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = '#121212'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  if (loadingTheater) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
          <p className="text-slate-400">Đang tải dữ liệu nhà hát...</p>
        </div>
      </div>
    )
  }

  if (!theater) {
    return (
      <div className="min-h-screen bg-background-dark">
        <TheaterHeader />
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md rounded-xl border border-border-gold bg-surface-dark p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-slate-100">Chưa có Nhà hát</h2>
            <p className="text-sm text-slate-400">
              Vui lòng hoàn tất đăng ký Nhà hát trước khi quản lý lịch diễn.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background-dark">
      <TheaterHeader theater={theater} />
      <main className="mx-auto max-w-[1400px] p-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">🎭 Lịch biểu diễn</h1>
            <p className="text-sm text-slate-400">
              Tạo, chỉnh sửa và quản lý lịch diễn cho tất cả địa điểm thuộc nhà hát.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-border-gold bg-surface-dark p-1">
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODES.LIST)}
                className={`px-3 py-1 text-xs font-medium ${
                  viewMode === VIEW_MODES.LIST
                    ? 'rounded-md bg-primary text-background-dark'
                    : 'text-slate-300'
                }`}
              >
                Danh sách
              </button>
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODES.CALENDAR)}
                className={`px-3 py-1 text-xs font-medium ${
                  viewMode === VIEW_MODES.CALENDAR
                    ? 'rounded-md bg-primary text-background-dark'
                    : 'text-slate-300'
                }`}
              >
                Lịch
              </button>
            </div>
            <button
              type="button"
              onClick={handleCreate}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:bg-primary/90"
            >
              + Thêm lịch diễn
            </button>
          </div>
        </div>

        <div className="mb-4 rounded-xl border border-border-gold bg-surface-dark/80 p-4">
          <ScheduleFilters theaterId={theaterId} onChange={handleFilterChange} />
        </div>

        {loading && (
          <p className="py-8 text-center text-slate-400">Đang tải lịch diễn...</p>
        )}
        {error && (
          <p className="mb-4 text-sm text-red-400">
            Lỗi khi tải lịch diễn: <span className="font-mono">{error}</span>
          </p>
        )}

        {!loading && (
          <div className="rounded-xl border border-border-gold bg-surface-dark/80 p-4">
            {viewMode === VIEW_MODES.LIST ? (
              <ScheduleList
                schedules={schedules}
                onEdit={handleEdit}
                onDelete={deleteSchedule}
              />
            ) : (
              <ScheduleCalendar schedules={schedules} onEdit={handleEdit} />
            )}
          </div>
        )}

        {modalOpen && (
          <ScheduleFormModal
            theaterId={theaterId}
            schedule={editingSchedule}
            onSubmit={handleSubmit}
            onClose={() => setModalOpen(false)}
          />
        )}
      </main>
    </div>
  )
}

export default TheaterSchedules

