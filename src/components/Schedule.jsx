import { useEffect, useMemo, useState } from 'react'
import ScheduleFilters from './ScheduleFilters'
import ScheduleList from './ScheduleList'
import ScheduleCalendar from './ScheduleCalendar'
import BookingModal from './Booking/BookingModal'
import { events as EVENTS, getCities, getValidatedEvents } from '../data/scheduleData'
import { parseISO } from '../utils/dateUtils'
import { isEventVisible, deriveEventStatus } from '../utils/scheduleValidator'
import './Schedule.css'

export default function Schedule() {
  // initialize filters from URL
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

  useEffect(() => {
    // sync filters -> url (debounce not necessary for MVP)
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

  // get validated events (and report invalid entries)
  const { events: VALID_EVENTS, invalid: INVALID_EVENTS } = useMemo(() => getValidatedEvents(), [])
  const cities = useMemo(() => getCities(VALID_EVENTS), [VALID_EVENTS])

  const filtered = useMemo(() => {
    // Normalize filters -> Date objects (local timezone)
    let fromDate = null
    let toDate = null
    if (filters.from) {
      const d = parseISO(filters.from + 'T00:00:00')
      fromDate = d
    }
    if (filters.to) {
      const d = parseISO(filters.to + 'T23:59:59')
      toDate = d
    }

    // If user provided invalid range, treat as no-range (ScheduleFilters prevents this in UI)
    if (fromDate && toDate && fromDate > toDate) {
      fromDate = null
      toDate = null
    }

    // Use helper logic for visibility
    return VALID_EVENTS.filter(ev => {
      return isEventVisible(ev, { city: filters.city, fromDate, toDate, q: filters.q })
    }).sort((a, b) => new Date(a.startDatetime) - new Date(b.startDatetime))
  }, [filters, VALID_EVENTS])

  // JSON-LD for the first few events (SEO-friendly when server renders / prerender)
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
    <section className="schedule-page container">
      <header className="schedule-hero">
        <div>
          <h2>Lịch diễn</h2>
          <p className="lead">Danh sách vở, ngày‑giờ và địa điểm — lọc theo thành phố hoặc theo thời gian.</p>
        </div>
      </header>

      {INVALID_EVENTS && INVALID_EVENTS.length > 0 && (
        <div className="validation-banner" role="status" aria-live="polite">
          <strong>Cảnh báo dữ liệu:</strong> {INVALID_EVENTS.length} sự kiện bị bỏ qua do lỗi định dạng. Kiểm tra console để biết chi tiết.
        </div>
      )}

      <ScheduleFilters cities={cities} filters={filters} onChange={setFilters} />

      <main className="schedule-main">
        {filters.view === 'list' ? (
          <ScheduleList 
            events={filtered} 
            onSelect={setSelectedEvent}
            onBook={(event) => {
              setBookingEvent(event)
              setIsBookingOpen(true)
            }}
          />
        ) : (
          <ScheduleCalendar events={filtered} onSelect={setSelectedEvent} />
        )}

        <aside className="schedule-side">
          <div className="upcoming">
            <h4>Sắp tới</h4>
            {filtered.slice(0,3).map(ev => (
              <div key={ev.id} className="up-item" onClick={() => setSelectedEvent(ev)}>
                <div className="u-time">{new Date(ev.startDatetime).toLocaleString()}</div>
                <div className="u-title">{ev.title}</div>
              </div>
            ))}
            {!filtered.length && <div className="muted">Không có sự kiện</div>}
          </div>

          <div className="tips">
            <h4>Tip</h4>
            <p>Chọn một ngày hoặc thành phố để thu hẹp kết quả. Dùng nút "Lịch" để xem dạng agenda.</p>
          </div>
        </aside>
      </main>

      {selectedEvent && (
        <div className="event-detail" role="dialog" aria-modal="true">
          <div className="detail-card">
            <button className="close" onClick={() => setSelectedEvent(null)}>✕</button>
            <h3>{selectedEvent.title}</h3>
            <div className="meta">{new Date(selectedEvent.startDatetime).toLocaleString()} — {selectedEvent.venue?.name}, {selectedEvent.venue?.city}</div>
            <p>{selectedEvent.description}</p>
            {selectedEvent.status !== 'canceled' && (
              <button 
                className="btn" 
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
              <a className="btn ghost" href={selectedEvent.ticketUrl} target="_blank" rel="noreferrer">
                Mua vé (Link ngoài)
              </a>
            )}
            <div className="status-row"><strong>Trạng thái:</strong> <span className={`status ${selectedEvent.status}`}>{selectedEvent.status}</span></div>
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
    </section>
  )
}
