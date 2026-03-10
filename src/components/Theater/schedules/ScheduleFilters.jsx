import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'

const STATUS_OPTIONS = ['', 'draft', 'scheduled', 'ongoing', 'completed', 'cancelled']

export default function ScheduleFilters({ theaterId, onChange }) {
  const [venues, setVenues] = useState([])
  const [filters, setFilters] = useState({
    status: '',
    venue_id: '',
    from: '',
    to: '',
  })

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
    setFilters(next)
    const cleaned = Object.fromEntries(Object.entries(next).filter(([, v]) => v !== ''))
    onChange?.(cleaned)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
        value={filters.status}
        onChange={(e) => update('status', e.target.value)}
      >
        <option value="">Tất cả trạng thái</option>
        {STATUS_OPTIONS.filter(Boolean).map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
        value={filters.venue_id}
        onChange={(e) => update('venue_id', e.target.value)}
      >
        <option value="">Tất cả địa điểm</option>
        {venues.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </select>

      <input
        type="date"
        className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
        value={filters.from}
        onChange={(e) => update('from', e.target.value)}
      />
      <input
        type="date"
        className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
        value={filters.to}
        onChange={(e) => update('to', e.target.value)}
      />
    </div>
  )
}

