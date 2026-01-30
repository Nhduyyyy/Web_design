import { useMemo, useState } from 'react'
import { validateDateRange, validateSearchQuery } from '../utils/validation'
import './Schedule.css'

export default function ScheduleFilters({ cities = [], filters, onChange }) {
  const [local, setLocal] = useState({ ...filters })
  const [error, setError] = useState('')

  const presets = useMemo(() => ([
    { id: 'today', label: 'Hôm nay' },
    { id: 'this-week', label: 'Tuần này' },
    { id: 'this-month', label: 'Tháng này' }
  ]), [])

  function apply(changes) {
    const next = { ...local, ...changes }
    
    // Validate date range
    if (next.from || next.to) {
      const dateValidation = validateDateRange(next.from, next.to)
      if (!dateValidation.valid) {
        setError(dateValidation.error)
        setLocal(next)
        return
      }
    }
    
    // Validate search query
    if (next.q !== undefined) {
      const queryValidation = validateSearchQuery(next.q, 2)
      if (!queryValidation.valid) {
        setError(queryValidation.error)
        setLocal(next)
        return
      }
      // Use cleaned query
      if (queryValidation.cleaned !== undefined) {
        next.q = queryValidation.cleaned
      }
    }
    
    setError('')
    setLocal(next)
    onChange && onChange(next)
  }

  function clearFilters() {
    const next = { city: '', from: '', to: '', q: '', view: local.view || 'list' }
    setLocal(next)
    setError('')
    onChange && onChange(next)
  }

  return (
    <div className="schedule-filters">
      <div className="filters-row">
        <label className="field">
          <span>Thành phố</span>
          <select value={local.city || ''} onChange={e => apply({ city: e.target.value })}>
            <option value="">Tất cả</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Khoảng</span>
          <div className="range-inputs">
            <input type="date" value={local.from || ''} onChange={e => apply({ from: e.target.value })} />
            <input type="date" value={local.to || ''} onChange={e => apply({ to: e.target.value })} />
          </div>
        </label>

        <label className="field search-field">
          <span>Tìm</span>
          <input placeholder="Tên vở, địa điểm..." value={local.q || ''} onChange={e => apply({ q: e.target.value })} />
        </label>

        <label className="field view-toggle" title="Chuyển view">
          <span>Hiển thị</span>
          <div className="view-buttons">
            <button className={local.view === 'list' ? 'active' : ''} onClick={() => apply({ view: 'list' })}>Danh sách</button>
            <button className={local.view === 'calendar' ? 'active' : ''} onClick={() => apply({ view: 'calendar' })}>Lịch</button>
          </div>
        </label>

        <div className="field actions">
          <button className="btn-clear" onClick={clearFilters}>Xóa</button>
        </div>
      </div>

      <div className="presets-row">
        {presets.map(p => (
          <button key={p.id} className="preset" onClick={() => {
            const now = new Date()
            if (p.id === 'today') {
              const iso = now.toISOString().slice(0, 10)
              apply({ from: iso, to: iso })
            } else if (p.id === 'this-week') {
              const start = new Date(now)
              start.setDate(now.getDate() - now.getDay())
              const end = new Date(start)
              end.setDate(start.getDate() + 6)
              apply({ from: start.toISOString().slice(0,10), to: end.toISOString().slice(0,10) })
            } else if (p.id === 'this-month') {
              const start = new Date(now.getFullYear(), now.getMonth(), 1)
              const end = new Date(now.getFullYear(), now.getMonth()+1, 0)
              apply({ from: start.toISOString().slice(0,10), to: end.toISOString().slice(0,10) })
            }
          }}>{p.label}</button>
        ))}

        {error && <div className="field-error" role="alert">{error}</div>}
      </div>
    </div>
  )
}
