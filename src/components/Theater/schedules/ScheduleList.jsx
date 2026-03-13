import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { getStatusLabel } from '../../../utils/scheduleHelpers'

const STATUS_COLORS = {
  draft: 'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  scheduled: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
  ongoing: 'bg-green-500/20 text-green-400 border border-green-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  cancelled: 'bg-red-500/20 text-red-400 border border-red-500/30',
}

export default function ScheduleList({ schedules, onEdit, onDelete }) {
  if (!schedules || schedules.length === 0) {
    return <p className="text-slate-500 py-6 text-center">Chưa có lịch diễn nào.</p>
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-background-dark/80 text-left text-xs uppercase tracking-wide text-slate-400 border-b border-border-gold/40">
          <th className="px-3 py-2">Tiêu đề</th>
          <th className="px-3 py-2">Vở diễn</th>
          <th className="px-3 py-2">Địa điểm</th>
          <th className="px-3 py-2">Bắt đầu</th>
          <th className="px-3 py-2">Kết thúc</th>
          <th className="px-3 py-2">Trạng thái</th>
          <th className="px-3 py-2">Đặt vé</th>
          <th className="px-3 py-2 text-right">Hành động</th>
        </tr>
      </thead>
      <tbody>
        {schedules.map((s) => (
          <tr
            key={s.id}
            className="border-t border-border-gold/40 bg-background-dark/60 hover:bg-background-dark"
          >
            <td className="px-3 py-2 font-medium text-slate-100">{s.title}</td>
            <td className="px-3 py-2 text-slate-300 text-xs">{s.shows?.title || '—'}</td>
            <td className="px-3 py-2 text-slate-300 text-xs">{s.venues?.name || '—'}</td>
            <td className="px-3 py-2 text-slate-300">
              {format(new Date(s.start_datetime), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </td>
            <td className="px-3 py-2 text-slate-300">
              {format(new Date(s.end_datetime), 'dd/MM/yyyy HH:mm', { locale: vi })}
            </td>
            <td className="px-3 py-2">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${STATUS_COLORS[s.status] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}
              >
                {getStatusLabel(s.status)}
              </span>
            </td>
            <td className="px-3 py-2">
              <span className={s.enable_booking ? 'text-green-400' : 'text-slate-500'}>
                {s.enable_booking ? 'Bật' : 'Tắt'}
              </span>
            </td>
            <td className="px-3 py-2 text-right">
              <button
                type="button"
                onClick={() => onEdit?.(s)}
                className="mr-3 text-xs font-medium text-primary hover:text-primary/80"
              >
                Sửa
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Xác nhận xoá lịch diễn này?')) {
                    onDelete?.(s.id)
                  }
                }}
                className="text-xs font-medium text-red-400 hover:text-red-300"
              >
                Xoá
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

