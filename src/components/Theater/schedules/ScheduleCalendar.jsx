import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const STATUS_COLORS = {
  draft: 'bg-gray-200 text-gray-700',
  scheduled: 'bg-emerald-100 text-emerald-700',
  ongoing: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function ScheduleCalendar({ schedules, onEdit }) {
  if (!schedules || schedules.length === 0) {
    return <p className="text-gray-500">Chưa có lịch diễn nào.</p>
  }

  const grouped = schedules.reduce((acc, s) => {
    const key = format(new Date(s.start_datetime), 'dd/MM/yyyy', { locale: vi })
    if (!acc[key]) acc[key] = []
    acc[key].push(s)
    return acc
  }, {})

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(grouped).map(([date, items]) => (
        <section
          key={date}
          className="rounded-xl border border-border-gold bg-surface-dark/60 p-4 shadow-sm"
        >
          <h3 className="mb-3 text-sm font-semibold text-primary">{date}</h3>
          <ul className="space-y-3">
            {items.map((s) => (
              <li
                key={s.id}
                className="flex items-start justify-between gap-3 rounded-lg bg-background-dark/60 p-3 hover:bg-background-dark cursor-pointer"
                onClick={() => onEdit?.(s)}
              >
                <div>
                  <div className="text-sm font-semibold text-slate-100">{s.title}</div>
                  <div className="text-xs text-slate-400">
                    {s.venues?.name || '—'} •{' '}
                    {format(new Date(s.start_datetime), 'HH:mm', { locale: vi })} -{' '}
                    {format(new Date(s.end_datetime), 'HH:mm', { locale: vi })}
                  </div>
                  {s.shows?.title && (
                    <div className="mt-1 text-xs text-slate-500">Vở: {s.shows.title}</div>
                  )}
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-1 text-[11px] font-medium ${STATUS_COLORS[s.status] || 'bg-gray-200 text-gray-700'}`}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

