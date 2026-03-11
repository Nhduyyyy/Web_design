import { EVENT_STATUS_CONFIG } from '../../../utils/eventHelpers'

const colorClasses = {
  gray: 'bg-slate-700/60 text-slate-200 border-slate-500/60',
  green: 'bg-emerald-600/20 text-emerald-300 border-emerald-500/60',
  red: 'bg-red-600/20 text-red-300 border-red-500/60',
  purple: 'bg-purple-600/20 text-purple-300 border-purple-500/60',
}

const EventStatusBadge = ({ status }) => {
  const config = EVENT_STATUS_CONFIG[status] || {
    label: status || 'Không rõ',
    color: 'gray',
  }

  const classes = colorClasses[config.color] || colorClasses.gray

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}

export default EventStatusBadge

