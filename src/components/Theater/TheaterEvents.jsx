import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getTheatersByOwner } from '../../services/theaterService'
import TheaterHeader from './TheaterHeader'
import { useTheaterEvents } from '../../hooks/useTheaterEvents'
import EventFilters from './events/EventFilters'
import EventList from './events/EventList'
import EventFormModal from './events/EventFormModal'
import EventDetailModal from './events/EventDetailModal'
import EventDeleteConfirm from './events/EventDeleteConfirm'

const VIEW_MODES = {
  GRID: 'grid',
  LIST: 'list',
}

const TheaterEvents = () => {
  const { user } = useAuth()
  const [theater, setTheater] = useState(null)
  const [loadingTheater, setLoadingTheater] = useState(true)

  const [viewMode, setViewMode] = useState(VIEW_MODES.GRID)
  const [formOpen, setFormOpen] = useState(false)
  const [detailEvent, setDetailEvent] = useState(null)
  const [editingEvent, setEditingEvent] = useState(null)
  const [deletingEvent, setDeletingEvent] = useState(null)

  useEffect(() => {
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = '#121212'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  useEffect(() => {
    const loadTheater = async () => {
      if (!user) return
      try {
        setLoadingTheater(true)
        const theaters = await getTheatersByOwner(user.id)
        setTheater(theaters?.[0] || null)
      } catch (err) {
        console.error('Error loading theater for events:', err)
      } finally {
        setLoadingTheater(false)
      }
    }
    loadTheater()
  }, [user])

  const theaterId = theater?.id
  const {
    events,
    loading,
    error,
    filters,
    setFilters,
    createEvent,
    updateEvent,
    deleteEvent,
    updateStatus,
  } = useTheaterEvents(theaterId)

  const stats = useMemo(() => {
    if (!events?.length) {
      return {
        total: 0,
        scheduled: 0,
        ongoing: 0,
        completed: 0,
        upcoming7Days: 0,
        currentMonthParticipants: 0,
      }
    }

    const now = new Date()
    const sevenDaysLater = new Date()
    sevenDaysLater.setDate(now.getDate() + 7)

    let upcoming7Days = 0
    let currentMonthParticipants = 0

    const total = events.length
    const scheduled = events.filter((e) => e.status === 'scheduled').length
    const ongoing = events.filter((e) => e.status === 'ongoing').length
    const completed = events.filter((e) => e.status === 'completed').length

    for (const e of events) {
      if (e.status === 'scheduled' && e.event_date) {
        const d = new Date(e.event_date)
        if (d >= now && d <= sevenDaysLater) {
          upcoming7Days += 1
        }
      }

      if (e.created_at) {
        const d = new Date(e.created_at)
        if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
          currentMonthParticipants += e.current_participants || 0
        }
      }
    }

    return {
      total,
      scheduled,
      ongoing,
      completed,
      upcoming7Days,
      currentMonthParticipants,
    }
  }, [events])

  const handleCreateClick = () => {
    setEditingEvent(null)
    setFormOpen(true)
  }

  const handleEdit = (event) => {
    setEditingEvent(event)
    setFormOpen(true)
  }

  const handleView = (event) => {
    setDetailEvent(event)
  }

  const handleToggleStatus = async (event) => {
    try {
      if (event.status === 'draft') {
        await updateStatus(event.id, 'scheduled')
      } else if (event.status === 'scheduled') {
        await updateStatus(event.id, 'cancelled')
      }
    } catch (err) {
      console.error('Error updating event status:', err)
    }
  }

  const handleDeleteRequest = (event) => {
    setDeletingEvent(event)
  }

  const handleDeleteConfirm = async (eventToDelete) => {
    try {
      await deleteEvent(eventToDelete.id)
      setDeletingEvent(null)
    } catch (err) {
      console.error('Error deleting event:', err)
    }
  }

  const handleFormSubmit = async (payload) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, payload)
    } else {
      await createEvent(payload)
    }
    setFormOpen(false)
  }

  if (loadingTheater) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background-dark">
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
            <h2 className="mb-2 text-2xl font-bold text-slate-100">
              Chưa có Nhà hát
            </h2>
            <p className="text-sm text-slate-400">
              Vui lòng hoàn tất đăng ký Nhà hát trước khi quản lý sự kiện.
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
        {/* Header + actions */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              🎭 Quản lý sự kiện
            </h1>
            <p className="text-sm text-slate-400">
              Tạo, chỉnh sửa và theo dõi các workshop, tour và buổi gặp gỡ
              nghệ sĩ của nhà hát.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-border-gold bg-surface-dark p-1">
              <button
                type="button"
                onClick={() => setViewMode(VIEW_MODES.GRID)}
                className={`px-3 py-1 text-xs font-medium ${
                  viewMode === VIEW_MODES.GRID
                    ? 'rounded-md bg-primary text-background-dark'
                    : 'text-slate-300'
                }`}
              >
                Lưới
              </button>
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
            </div>
            <button
              type="button"
              onClick={handleCreateClick}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:bg-primary/90"
            >
              + Tạo sự kiện mới
            </button>
          </div>
        </div>

        {/* Stats cards */}
        <section className="mb-6 grid gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-border-gold bg-surface-dark/80 p-4">
            <p className="text-xs text-slate-400">📋 Tổng sự kiện</p>
            <p className="mt-2 text-2xl font-bold text-slate-50">
              {stats.total}
            </p>
          </div>
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/5 p-4">
            <p className="text-xs text-emerald-200">📅 Đã lên lịch</p>
            <p className="mt-2 text-2xl font-bold text-emerald-100">
              {stats.scheduled}
            </p>
          </div>
          <div className="rounded-xl border border-sky-500/50 bg-sky-500/5 p-4">
            <p className="text-xs text-sky-200">📅 Sắp diễn (7 ngày)</p>
            <p className="mt-2 text-2xl font-bold text-sky-100">
              {stats.upcoming7Days}
            </p>
          </div>
          <div className="rounded-xl border border-amber-500/50 bg-amber-500/5 p-4">
            <p className="text-xs text-amber-200">👥 Người đăng ký (tháng)</p>
            <p className="mt-2 text-2xl font-bold text-amber-100">
              {stats.currentMonthParticipants}
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="mb-4 rounded-xl border border-border-gold bg-surface-dark/80 p-4">
          <EventFilters
            theaterId={theaterId}
            filters={filters}
            onChange={(next) => setFilters((prev) => ({ ...prev, ...next }))}
          />
        </section>

        {/* List */}
        <section className="rounded-xl border border-border-gold bg-surface-dark/80 p-4">
          {loading && (
            <p className="py-8 text-center text-sm text-slate-400">
              Đang tải danh sách sự kiện...
            </p>
          )}
          {error && !loading && (
            <p className="mb-4 text-sm text-red-400">
              Lỗi khi tải sự kiện: <span className="font-mono">{error}</span>
            </p>
          )}

          {!loading && (
            <EventList
              events={events}
              viewMode={viewMode}
              onView={handleView}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
              onDelete={handleDeleteRequest}
            />
          )}
        </section>
      </main>

      {formOpen && (
        <EventFormModal
          theaterId={theaterId}
          event={editingEvent}
          onSubmit={handleFormSubmit}
          onClose={() => setFormOpen(false)}
        />
      )}
      {detailEvent && (
        <EventDetailModal
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
        />
      )}
      {deletingEvent && (
        <EventDeleteConfirm
          event={deletingEvent}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeletingEvent(null)}
        />
      )}
    </div>
  )
}

export default TheaterEvents

