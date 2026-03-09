import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

const STATUS_COLORS = {
  draft: 'bg-gray-200 text-gray-700',
  published: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default function ScheduleList({ schedules, onEdit, onDelete }) {
  if (!schedules || schedules.length === 0) {
    return <p className="text-gray-500">Chưa có lịch diễn nào.</p>
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="bg-surface-dark/80 text-left text-xs uppercase tracking-wide text-slate-400">
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
                className={`inline-flex rounded-full px-2 py-1 text-[11px] font-medium ${STATUS_COLORS[s.status] || ''}`}
              >
                {s.status}
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
                className="mr-3 text-xs font-medium text-blue-400 hover:text-blue-300"
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

