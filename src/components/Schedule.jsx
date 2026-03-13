import { useEffect, useMemo, useState } from 'react'
import ScheduleCalendar from './ScheduleCalendar'
import BookingModal from './Booking/BookingModal'
import { getSchedules } from '../services/scheduleService'
import { parseISO, formatTimeHHMMSS, formatDateShort, formatDateSidebar } from '../utils/dateUtils'
import { deriveEventStatus } from '../utils/scheduleValidator'
import './Schedule.css'

const PER_PAGE = 3

export default function Schedule() {
  const qp = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const initial = {
    city: qp.get('city') || '',
    from: qp.get('from') || '',
    to: qp.get('to') || '',
    q: qp.get('q') || '',
    view: qp.get('view') || 'list'
  }

  const [filters, setFilters] = useState(initial)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [bookingEvent, setBookingEvent] = useState(null)
  const [isBookingOpen, setIsBookingOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    const sp = new URLSearchParams()
    if (filters.city) sp.set('city', filters.city)
    if (filters.from) sp.set('from', filters.from)
    if (filters.to) sp.set('to', filters.to)
    if (filters.q) sp.set('q', filters.q)
    if (filters.view) sp.set('view', filters.view)
    const qs = sp.toString()
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    window.history.replaceState({}, '', url)
  }, [filters])

  useEffect(() => {
    let mounted = true

    const run = async () => {
      try {
        setLoading(true)
        setLoadError('')

        const startDate = filters.from
          ? new Date(`${filters.from}T00:00:00`).toISOString()
          : undefined
        const endDate = filters.to
          ? new Date(`${filters.to}T23:59:59`).toISOString()
          : undefined

        const schedules = await getSchedules({
          city: filters.city || undefined,
          startDate,
          endDate,
        })

        const mapped = (schedules || []).map((s) => {
          const venue = s.venue || {}
          const show = s.show || {}
          const normalizedStatus = s.status === 'cancelled' ? 'canceled' : s.status

          return {
            id: String(s.id),
            schedule_id: s.id,
            venue_id: s.venue_id || venue.id,
            title: s.title || show.title || 'Lịch diễn',
            description: s.description || show.description || '',
            detail: s.description || show.synopsis || '',
            startDatetime: s.start_datetime,
            endDatetime: s.end_datetime,
            timezone: s.timezone || 'Asia/Ho_Chi_Minh',
            status: normalizedStatus,
            ticketUrl: s.ticket_url || null,
            venue: {
              id: String(venue.id || s.venue_id || ''),
              name: venue.name || '—',
              city: venue.city || '',
              address: venue.address || '',
            },
            tags: show.tags || [],
          }
        })

        mapped.sort((a, b) => new Date(a.startDatetime) - new Date(b.startDatetime))
        if (!mounted) return
        setEvents(mapped)
      } catch (err) {
        console.error('Failed to load schedules', err)
        if (!mounted) return
        setLoadError(err?.message || 'Không thể tải lịch diễn')
        setEvents([])
      } finally {
        if (!mounted) return
        setLoading(false)
      }
    }

    run()
    return () => {
      mounted = false
    }
  }, [filters.city, filters.from, filters.to])

  const cities = useMemo(() => {
    const s = new Set()
    events.forEach((e) => {
      if (e.venue?.city) s.add(e.venue.city)
    })
    return Array.from(s).sort()
  }, [events])

  const filtered = useMemo(() => {
    let fromDate = null
    let toDate = null
    if (filters.from) fromDate = parseISO(filters.from + 'T00:00:00')
    if (filters.to) toDate = parseISO(filters.to + 'T23:59:59')
    if (fromDate && toDate && fromDate > toDate) {
      fromDate = null
      toDate = null
    }
    const q = (filters.q || '').trim().toLowerCase()
    return (events || [])
      .filter((ev) => {
        if (filters.city && ev.venue?.city?.toLowerCase() !== String(filters.city).toLowerCase()) {
          return false
        }
        if (fromDate || toDate) {
          const s = ev.startDatetime ? Date.parse(ev.startDatetime) : NaN
          if (Number.isNaN(s)) return false
          if (fromDate && s < fromDate.getTime()) return false
          if (toDate && s > toDate.getTime()) return false
        }
        if (q) {
          const hay = `${ev.title || ''} ${ev.description || ''} ${ev.venue?.name || ''} ${ev.venue?.city || ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .sort((a, b) => new Date(a.startDatetime) - new Date(b.startDatetime))
  }, [filters, events])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * PER_PAGE
    return filtered.slice(start, start + PER_PAGE)
  }, [filtered, page])

  useEffect(() => {
    setPage(1)
  }, [filters.city, filters.from, filters.to, filters.q])

  const applyFilter = (changes) => {
    setFilters(prev => ({ ...prev, ...changes }))
  }

  const clearFilters = () => {
    setFilters({ city: '', from: '', to: '', q: '', view: filters.view || 'list' })
    setPage(1)
  }

  const jsonLd = useMemo(() => {
    const ld = filtered.slice(0, 5).map(ev => ({
      '@type': 'Event',
      name: ev.title,
      startDate: ev.startDatetime,
      endDate: ev.endDatetime,
      location: {
        '@type': 'Place',
        name: ev.venue?.name,
        address: ev.venue?.address
      }
    }))
    return ld.length ? JSON.stringify({ '@context': 'https://schema.org', '@graph': ld }) : null
  }, [filtered])

  return (
    <main className="schedule-page">
      <header className="schedule-header">
        <h1 className="schedule-title">Lịch diễn</h1>
        <p className="schedule-lead">
          Danh sách vở, ngày-giờ và địa điểm — lọc theo thành phố hoặc theo thời gian để tìm trải nghiệm nghệ thuật phù hợp nhất.
        </p>
      </header>

      {!!loadError && (
        <div className="schedule-validation" role="status" aria-live="polite">
          <strong>Lỗi tải dữ liệu:</strong> {loadError}
        </div>
      )}

      <div className="schedule-filters-bar glass">
        <div className="schedule-field">
          <label className="schedule-label">Thành phố</label>
          <select
            className="schedule-input"
            value={filters.city || ''}
            onChange={e => applyFilter({ city: e.target.value })}
          >
            <option value="">Tất cả các thành phố</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="schedule-field schedule-field-range">
          <div className="schedule-field-half">
            <label className="schedule-label">Từ ngày</label>
            <input
              type="date"
              className="schedule-input"
              value={filters.from || ''}
              onChange={e => applyFilter({ from: e.target.value })}
            />
          </div>
          <div className="schedule-field-half">
            <label className="schedule-label">Đến ngày</label>
            <input
              type="date"
              className="schedule-input"
              value={filters.to || ''}
              onChange={e => applyFilter({ to: e.target.value })}
            />
          </div>
        </div>
        <div className="schedule-field">
          <label className="schedule-label">Tìm kiếm</label>
          <input
            type="text"
            className="schedule-input"
            placeholder="Tên vở, địa điểm..."
            value={filters.q || ''}
            onChange={e => applyFilter({ q: e.target.value })}
          />
        </div>
        <div className="schedule-filters-actions">
          <button
            type="button"
            className={`schedule-btn schedule-btn-primary ${filters.view === 'list' ? 'active' : ''}`}
            onClick={() => applyFilter({ view: 'list' })}
          >
            Danh sách
          </button>
          <button
            type="button"
            className={`schedule-btn schedule-btn-outline ${filters.view === 'calendar' ? 'active' : ''}`}
            onClick={() => applyFilter({ view: 'calendar' })}
          >
            Lịch
          </button>
          <button
            type="button"
            className="schedule-btn-icon"
            onClick={clearFilters}
            title="Xóa bộ lọc"
            aria-label="Xóa bộ lọc"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </div>

      <div className="schedule-grid">
        <div className="schedule-main-col">
          {filters.view === 'calendar' ? (
            <div className="schedule-calendar-wrap">
              <ScheduleCalendar events={filtered} onSelect={setSelectedEvent} />
            </div>
          ) : (
            <>
              {paginatedEvents.length === 0 ? (
                <div className="schedule-empty">Không có lịch trong khoảng đã chọn.</div>
              ) : (
                <div className="schedule-list">
                  {paginatedEvents.map(ev => (
                    <article
                      key={ev.id}
                      className={`schedule-card glass gold-border ${ev.status === 'canceled' ? 'canceled' : ''}`}
                    >
                      <div className="schedule-card-left">
                        <div className="schedule-card-time">{formatTimeHHMMSS(ev.startDatetime)}</div>
                        <div className="schedule-card-date">{formatDateShort(ev.startDatetime)}</div>
                        <div className="schedule-card-venue">
                          <span className="material-symbols-outlined">location_on</span>
                          {ev.venue?.name} — {ev.venue?.city}
                        </div>
                      </div>
                      <div className="schedule-card-right">
                        <div className="schedule-card-head">
                          <h3 className="schedule-card-title">{ev.title}</h3>
                          {ev.status !== 'canceled' && (
                            <span className="schedule-card-tag">Upcoming</span>
                          )}
                          {ev.status === 'canceled' && (
                            <span className="schedule-card-tag canceled">Hủy</span>
                          )}
                        </div>
                        <p className="schedule-card-desc">{ev.detail || ev.description}</p>
                        <div className="schedule-card-actions">
                          {ev.status !== 'canceled' && (
                            <button
                              type="button"
                              className="schedule-btn schedule-btn-primary schedule-btn-glow"
                              onClick={() => {
                                setBookingEvent(ev)
                                setIsBookingOpen(true)
                              }}
                            >
                              <span className="material-symbols-outlined">confirmation_number</span>
                              Mua vé
                            </button>
                          )}
                          {ev.ticketUrl ? (
                            <a
                              href={ev.ticketUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="schedule-btn schedule-btn-outline"
                            >
                              Link ngoài
                            </a>
                          ) : (
                            ev.status !== 'canceled' && (
                              <button
                                type="button"
                                className="schedule-btn schedule-btn-outline"
                                onClick={() => setSelectedEvent(ev)}
                              >
                                Chi tiết
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <aside className="schedule-sidebar">
          <div className="schedule-widget glass">
            <div className="schedule-widget-header schedule-widget-header-red">
              <h2 className="schedule-widget-title">
                <span className="material-symbols-outlined">event</span>
                Sắp tới
              </h2>
            </div>
            <div className="schedule-widget-body">
              {filtered
                .filter((ev) => {
                  const t = ev.startDatetime ? Date.parse(ev.startDatetime) : NaN
                  if (Number.isNaN(t)) return false
                  return t >= Date.now()
                })
                .slice(0, 3)
                .map((ev, idx) => (
                <div
                  key={ev.id}
                  className={`schedule-upcoming-item ${idx === 0 ? 'first' : ''}`}
                  onClick={() => setSelectedEvent(ev)}
                  onKeyDown={e => e.key === 'Enter' && setSelectedEvent(ev)}
                  role="button"
                  tabIndex={0}
                >
                  <div className="schedule-upcoming-meta">
                    <span className={idx === 0 ? 'schedule-upcoming-date primary' : 'schedule-upcoming-date'}>
                      {formatDateSidebar(ev.startDatetime)}
                    </span>
                    <span className="schedule-upcoming-time">{formatTimeHHMMSS(ev.startDatetime)}</span>
                  </div>
                  <h4 className="schedule-upcoming-title">{ev.title.replace(/^Tuồng:\s*/i, '')}</h4>
                  <p className="schedule-upcoming-venue">{ev.venue?.name}</p>
                </div>
              ))}
              {filtered.length === 0 && (
                <div className="schedule-upcoming-empty">Không có sự kiện</div>
              )}
            </div>
            <div className="schedule-widget-tip">
              <h5 className="schedule-tip-title">
                <span className="material-symbols-outlined">lightbulb</span>
                Mẹo nhỏ
              </h5>
              <p className="schedule-tip-text">
                Chọn một ngày hoặc thành phố để thu hẹp kết quả. Dùng nút &quot;Lịch&quot; để xem dạng agenda trực quan hơn cho tuần này.
              </p>
            </div>
          </div>

          <div className="schedule-widget glass gold-border schedule-widget-history">
            <span className="material-symbols-outlined schedule-history-icon">history_edu</span>
            <h3 className="schedule-history-title">Lịch Sử Nghệ Thuật</h3>
            <p className="schedule-history-text">
              Tuồng là loại hình nghệ thuật sân khấu cổ truyền của Việt Nam, xuất hiện từ thế kỷ 17 và đạt đến đỉnh cao vào triều Nguyễn.
            </p>
            <a href="#about" className="schedule-history-link">
              Khám phá thêm
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
          </div>
        </aside>
      </div>

      {filters.view === 'list' && filtered.length > 0 && (
        <div className="schedule-pagination">
          <button
            type="button"
            className="schedule-pagination-btn"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            aria-label="Trang trước"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <span className="schedule-pagination-text">
            <span className="current">{String(page).padStart(2, '0')}</span>
            {' / '}
            <span>{String(totalPages).padStart(2, '0')}</span>
          </span>
          <button
            type="button"
            className="schedule-pagination-btn"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            aria-label="Trang sau"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {selectedEvent && (
        <div className="schedule-detail-overlay" role="dialog" aria-modal="true">
          <div className="schedule-detail-card glass gold-border">
            <button
              type="button"
              className="schedule-detail-close"
              onClick={() => setSelectedEvent(null)}
              aria-label="Đóng"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <h3 className="schedule-detail-title">{selectedEvent.title}</h3>
            <div className="schedule-detail-meta">
              {new Date(selectedEvent.startDatetime).toLocaleString()} — {selectedEvent.venue?.name}, {selectedEvent.venue?.city}
            </div>
            <p className="schedule-detail-desc">{selectedEvent.description}</p>
            {selectedEvent.status !== 'canceled' && (
              <button
                type="button"
                className="schedule-btn schedule-btn-primary"
                onClick={() => {
                  setBookingEvent(selectedEvent)
                  setIsBookingOpen(true)
                  setSelectedEvent(null)
                }}
              >
                Mua vé
              </button>
            )}
            {selectedEvent.ticketUrl && (
              <a className="schedule-btn schedule-btn-outline" href={selectedEvent.ticketUrl} target="_blank" rel="noreferrer">
                Link ngoài
              </a>
            )}
            <div className="schedule-detail-status">
              <strong>Trạng thái:</strong>{' '}
              <span className={`schedule-status-badge ${selectedEvent.status} ${deriveEventStatus(selectedEvent)}`}>
                {selectedEvent.status === 'canceled' ? 'Hủy' : deriveEventStatus(selectedEvent)}
              </span>
            </div>
          </div>
        </div>
      )}

      <BookingModal
        event={bookingEvent}
        isOpen={isBookingOpen}
        onClose={() => {
          setIsBookingOpen(false)
          setBookingEvent(null)
        }}
      />

      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
      )}
    </main>
  )
}
