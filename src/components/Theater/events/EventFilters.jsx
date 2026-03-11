import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const EVENT_TYPES = [
  { value: '', label: 'Tất cả loại' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'tour', label: 'Tour tham quan' },
  { value: 'meet_artist', label: 'Gặp gỡ nghệ sĩ' },
]

const EVENT_STATUS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'draft', label: 'Bản nháp' },
  { value: 'published', label: 'Đã đăng' },
  { value: 'cancelled', label: 'Đã hủy' },
  { value: 'completed', label: 'Đã kết thúc' },
]

const EventFilters = ({ theaterId, filters, onChange }) => {
  const [venues, setVenues] = useState([])

  useEffect(() => {
    if (!theaterId) return
    supabase
      .from('venues')
      .select('id, name')
      .eq('theater_id', theaterId)
      .then(({ data }) => setVenues(data || []))
  }, [theaterId])

  const update = (key, value) => {
    const next = { ...filters, [key]: value }
    const cleaned = Object.fromEntries(
      Object.entries(next).filter(([, v]) => v !== '' && v != null)
    )
    onChange?.(cleaned)
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-400">Loại sự kiện</label>
        <select
          className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
          value={filters.type || ''}
          onChange={(e) => update('type', e.target.value)}
        >
          {EVENT_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-400">Trạng thái</label>
        <select
          className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
          value={filters.status || ''}
          onChange={(e) => update('status', e.target.value)}
        >
          {EVENT_STATUS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-400">Địa điểm</label>
        <select
          className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
          value={filters.venue_id || ''}
          onChange={(e) => update('venue_id', e.target.value)}
        >
          <option value="">Tất cả địa điểm</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-400">Từ ngày</label>
        <input
          type="date"
          className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
          value={filters.dateFrom || ''}
          onChange={(e) => update('dateFrom', e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-slate-400">Đến ngày</label>
        <input
          type="date"
          className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
          value={filters.dateTo || ''}
          onChange={(e) => update('dateTo', e.target.value)}
        />
      </div>

      <div className="flex flex-1 min-w-[200px] flex-col gap-1">
        <label className="text-xs font-medium text-slate-400">Tìm kiếm</label>
        <div className="relative">
          <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            search
          </span>
          <input
            type="text"
            placeholder="Tìm theo tên sự kiện..."
            className="w-full rounded-md border border-border-gold bg-background-dark px-9 py-2 text-sm text-slate-100 placeholder:text-slate-500"
            value={filters.search || ''}
            onChange={(e) => update('search', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

export default EventFilters

