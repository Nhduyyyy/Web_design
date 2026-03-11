import { EVENT_TYPE_LABELS, EVENT_STATUS_CONFIG, formatPrice } from '../../../utils/eventHelpers'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const EventDetailModal = ({ event, onClose }) => {
  if (!event) return null

  const typeLabel = EVENT_TYPE_LABELS[event.type] || 'Sự kiện'
  const statusConfig = EVENT_STATUS_CONFIG[event.status] || {
    label: event.status || 'Không rõ',
    color: 'gray',
  }

  const dateLabel = event.event_date
    ? format(new Date(event.event_date), "EEEE, dd/MM/yyyy '•' HH:mm", { locale: vi })
    : 'Chưa có thời gian'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-gold bg-surface-dark p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">
              {typeLabel}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-slate-100">
              {event.title}
            </h2>
            <p className="mt-1 text-xs text-slate-400">{dateLabel}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-background-dark hover:text-slate-100"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs">
            <span className="material-symbols-outlined mr-1 text-sm text-primary">
              payments
            </span>
            {formatPrice(event.price || 0)}
          </span>
          {event.max_participants ? (
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs">
              <span className="material-symbols-outlined mr-1 text-sm text-primary">
                groups
              </span>
              {event.current_participants || 0}/{event.max_participants} người
            </span>
          ) : null}
          {event.venue && (
            <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs">
              <span className="material-symbols-outlined mr-1 text-sm text-primary">
                location_on
              </span>
              {event.venue.name}
            </span>
          )}
          <span className="inline-flex items-center rounded-full bg-slate-800/80 px-3 py-1 text-xs">
            <span className="material-symbols-outlined mr-1 text-sm text-primary">
              info
            </span>
            {statusConfig.label}
          </span>
        </div>

        {event.description && (
          <section className="mb-4 space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">Mô tả</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              {event.description}
            </p>
          </section>
        )}

        {event.guide && (
          <section className="mb-4 space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">Hướng dẫn chi tiết</h3>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-300">
              {event.guide}
            </p>
          </section>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {event.artists?.length ? (
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Nghệ sĩ tham gia
              </h3>
              <ul className="flex flex-wrap gap-1.5">
                {event.artists.map((artist) => (
                  <li
                    key={artist}
                    className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-200"
                  >
                    {artist}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {event.requirements?.length ? (
            <section className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-200">
                Yêu cầu tham gia
              </h3>
              <ul className="list-disc space-y-1 pl-4 text-sm text-slate-300">
                {event.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {event.includes?.length ? (
          <section className="mt-4 space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">
              Bao gồm trong vé
            </h3>
            <ul className="flex flex-wrap gap-1.5">
              {event.includes.map((item) => (
                <li
                  key={item}
                  className="rounded-full bg-emerald-600/20 px-2.5 py-0.5 text-xs text-emerald-200"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {event.tags?.length ? (
          <section className="mt-4 space-y-1">
            <h3 className="text-sm font-semibold text-slate-200">Tags</h3>
            <ul className="flex flex-wrap gap-1.5">
              {event.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-slate-800/80 px-2.5 py-0.5 text-xs text-slate-200"
                >
                  #{tag}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </div>
  )
}

export default EventDetailModal

