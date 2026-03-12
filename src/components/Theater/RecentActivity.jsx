import { useState, useEffect, useCallback } from 'react'
import { getTheaterHistory } from '../../services/historyService'

// ─── helpers ────────────────────────────────────────────────

const ICON_MAP = {
  venue:       { add: 'add_location',    edit: 'edit_location',  delete: 'wrong_location' },
  theater:     { add: 'business',        edit: 'edit_note',      delete: 'delete' },
  logo:        { add: 'image',           edit: 'image',          delete: 'hide_image' },
  cover:       { add: 'panorama',        edit: 'panorama',       delete: 'hide_image' },
  schedule:    { add: 'event',           edit: 'edit_calendar',  delete: 'event_busy' },
  play:        { add: 'theater_comedy',  edit: 'theater_comedy', delete: 'theater_comedy' },
  performance: { add: 'perform',         edit: 'perform',        delete: 'perform' },
  event:       { add: 'celebration',     edit: 'celebration',    delete: 'cancel' },
  livestream:  { add: 'videocam',        edit: 'videocam',       delete: 'videocam_off' },
}

const getIcon = (entityType, actionType) =>
  ICON_MAP[entityType]?.[actionType] ?? 'history'

const getColor = (actionType) =>
  actionType === 'delete'
    ? 'text-accent-red bg-accent-red/10'
    : actionType === 'add'
    ? 'text-primary bg-primary/10'
    : 'text-yellow-400 bg-yellow-400/10'

const ACTION_LABEL = { add: 'Thêm', edit: 'Sửa', delete: 'Xoá' }

const formatTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now  = new Date()
  const diffMs  = now - date
  const diffMin = Math.floor(diffMs / 60_000)
  const diffH   = Math.floor(diffMin / 60)
  const diffD   = Math.floor(diffH / 24)

  if (diffMin < 1)  return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} phút trước`
  if (diffH < 24)   return `${diffH} giờ trước`
  if (diffD === 1)  return 'Hôm qua'
  if (diffD < 7)    return `${diffD} ngày trước`

  return date.toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

// ─── component ──────────────────────────────────────────────

const ITEMS_PER_PAGE = 5

const RecentActivity = ({ theaterId }) => {
  const [activities, setActivities]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [showAll, setShowAll]         = useState(false)

  const load = useCallback(async () => {
    if (!theaterId) return
    try {
      setLoading(true)
      setError(null)
      const data = await getTheaterHistory(theaterId, 50)
      setActivities(data)
    } catch (err) {
      console.error('RecentActivity load error:', err)
      setError('Không thể tải lịch sử hoạt động')
    } finally {
      setLoading(false)
    }
  }, [theaterId])

  useEffect(() => {
    load()
  }, [load])

  const displayed = showAll ? activities : activities.slice(0, ITEMS_PER_PAGE)

  return (
    <div className="bg-surface-dark rounded-xl border border-border-gold p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-slate-100 font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Hoạt động gần đây
        </h3>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            title="Làm mới"
            className="text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
          </button>
          {activities.length > ITEMS_PER_PAGE && (
            <button
              onClick={() => setShowAll((v) => !v)}
              className="text-sm text-slate-400 hover:text-primary transition-colors"
            >
              {showAll ? 'Thu gọn' : 'Xem tất cả'}
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-accent-red mb-2">error_outline</span>
          <p className="text-slate-400 text-sm">{error}</p>
          <button
            onClick={load}
            className="mt-3 text-sm text-primary hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : activities.length === 0 ? (
        <div className="text-center py-8">
          <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">inbox</span>
          <p className="text-slate-400">Chưa có hoạt động nào</p>
        </div>
      ) : (
        <div className="space-y-1">
          {displayed.map((activity) => {
            const icon  = getIcon(activity.entity_type, activity.action_type)
            const color = getColor(activity.action_type)
            const badge = ACTION_LABEL[activity.action_type] ?? activity.action_type

            return (
              <div
                key={activity.id}
                className="flex items-center gap-4 py-3 border-b border-border-gold last:border-0 hover:bg-background-dark/50 transition-colors rounded-lg px-2"
              >
                {/* Icon */}
                <div className={`h-10 w-10 shrink-0 rounded-lg flex items-center justify-center ${color}`}>
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatTime(activity.update_time)}
                  </p>
                </div>

                {/* Badge */}
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  activity.action_type === 'delete'
                    ? 'text-accent-red border-accent-red/30 bg-accent-red/10'
                    : activity.action_type === 'add'
                    ? 'text-primary border-primary/30 bg-primary/10'
                    : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'
                }`}>
                  {badge}
                </span>
              </div>
            )
          })}

          {/* "Show all" inline hint */}
          {!showAll && activities.length > ITEMS_PER_PAGE && (
            <p className="text-center text-xs text-slate-500 pt-2">
              +{activities.length - ITEMS_PER_PAGE} hoạt động khác
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default RecentActivity
