import EventCard from './EventCard'

const EventList = ({
  events,
  viewMode,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}) => {
  if (!events?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-gold/70 bg-background-dark/60 px-6 py-10 text-center">
        <span className="material-symbols-outlined text-4xl text-slate-600">
          event_busy
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Chưa có sự kiện nào
          </p>
          <p className="text-xs text-slate-400">
            Hãy bắt đầu bằng cách tạo sự kiện mới cho nhà hát của bạn.
          </p>
        </div>
      </div>
    )
  }

  if (viewMode === 'list') {
    return (
      <div className="divide-y divide-slate-800/80">
        {events.map((event) => (
          <div key={event.id} className="py-3 first:pt-0 last:pb-0">
            <EventCard
              event={event}
              onView={onView}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
            />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          onView={onView}
          onEdit={onEdit}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

export default EventList

