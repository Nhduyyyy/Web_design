import EventStatusBadge from './EventStatusBadge'
import { EVENT_TYPE_LABELS, formatPrice, getParticipantProgress } from '../../../utils/eventHelpers'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const typeColors = {
  workshop: 'from-fuchsia-500/40 via-amber-400/40 to-rose-500/40',
  tour: 'from-sky-500/40 via-emerald-400/40 to-cyan-500/40',
  meet_artist: 'from-orange-500/40 via-rose-400/40 to-red-500/40',
}

const EventCard = ({ event, onView, onEdit, onToggleStatus, onDelete }) => {
  const {
    title,
    type,
    status,
    thumbnail_url,
    event_date,
    duration,
    max_participants,
    current_participants,
    price,
    venue,
  } = event

  const typeLabel = EVENT_TYPE_LABELS[type] || 'Sự kiện'
  const colorClass = typeColors[type] || 'from-slate-500/40 via-slate-600/40 to-slate-700/40'
  const progress = getParticipantProgress(current_participants || 0, max_participants || 0)

  const dateLabel = event_date
    ? format(new Date(event_date), "EEEE, dd/MM/yyyy '•' HH:mm", { locale: vi })
    : 'Chưa có thời gian'

  return (
    <div className="group h-[540px] w-full overflow-hidden rounded-xl border border-border-gold/30 bg-transparent shadow-[0_0_30px_rgba(0,0,0,0.6)] transition-transform duration-300 hover:scale-[1.01] hover:shadow-[0_0_40px_rgba(212,175,55,0.25)]">
      <div className="flex h-full min-h-[260px]">
        <div className="relative h-auto w-2/5 overflow-hidden">
          {thumbnail_url ? (
            <img
              src={thumbnail_url}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-tr ${colorClass}`}
            >
              <span className="text-5xl drop-shadow-lg">🎭</span>
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

          <div className="absolute left-4 top-4 flex flex-col gap-2">
            <span className="inline-flex items-center rounded bg-[#F2C94C] px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-[#7A1111] shadow-[0_4px_14px_rgba(0,0,0,0.3)]">
              {typeLabel}
            </span>
            <EventStatusBadge status={status} />
          </div>
        </div>

        <div className="flex h-full w-3/5 flex-col justify-between p-4 md:p-6">
          <div>
            <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-50 md:text-lg">
              {title}
            </h3>
            <div className="space-y-1.5 text-sm text-slate-200">
              <p className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-primary">schedule</span>
                <span>{dateLabel}</span>
                {duration ? <span className="text-slate-500">• {duration} phút</span> : null}
              </p>
              {venue && (
                <p className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-primary">location_on</span>
                  <span className="line-clamp-1">
                    {venue.name}
                    {venue.city ? `, ${venue.city}` : ''}
                  </span>
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-white/10 pt-4">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div>
                <span className="block text-xs text-slate-400">Đã đăng ký</span>
                <span className="text-base font-semibold text-slate-50">
                  {current_participants || 0}/{max_participants || 0}
                </span>
              </div>
              <div className="text-right">
                <span className="block text-xs text-slate-400">Giá vé</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(price || 0)}
                </span>
              </div>
            </div>

            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full ${
                  progress.isFull ? 'bg-red-500' : 'bg-primary'
                } transition-all`}
                style={{ width: `${progress.percent}%` }}
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => onView?.(event)}
                className="inline-flex items-center justify-center rounded-full border border-border-gold/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-background-dark"
              >
                Xem
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(event)}
                className="inline-flex items-center justify-center rounded-full border border-border-gold/70 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-background-dark"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => onToggleStatus?.(event)}
                className="inline-flex items-center justify-center rounded-full border border-emerald-500/70 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/20"
              >
                {status === 'draft'
                  ? 'Đăng'
                  : status === 'scheduled'
                  ? 'Hủy đăng'
                  : 'Cập nhật'}
              </button>
              <button
                type="button"
                onClick={() => onDelete?.(event)}
                className="inline-flex items-center justify-center rounded-full border border-red-500/70 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/20"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventCard

