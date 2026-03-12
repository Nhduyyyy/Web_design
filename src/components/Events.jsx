import { useEffect, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EventDetail from './EventDetail'
import EventBookingModal from './Booking/EventBookingModal'
import { formatEventDateForCard, formatDuration } from '../data/eventsData'
import { formatPrice } from '../utils/booking'
import { supabase } from '../lib/supabase'
import './Events.css'

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'tour', label: 'Tour Backstage' },
  { id: 'meet_artist', label: 'Gặp Nghệ Sĩ' }
]

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [bookingEvent, setBookingEvent] = useState(null)

  useEffect(() => {
    let ignore = false

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error: queryError } = await supabase
          .from('events')
          .select(
            `
            id,
            type,
            thumbnail_url,
            title,
            description,
            event_date,
            duration,
            instructor,
            guide,
            artists,
            current_participants,
            max_participants,
            price,
            tags,
            venues (id, name, address, city)
          `,
          )
          .in('status', ['scheduled', 'ongoing', 'completed'])
          .order('event_date', { ascending: true })

        if (queryError) throw queryError
        if (!ignore) setEvents(data || [])
      } catch (err) {
        console.error('Failed to load events:', err)
        if (!ignore) setError(err.message || 'Không thể tải danh sách sự kiện')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    load()
    return () => {
      ignore = true
    }
  }, [])

  const filteredEvents = useMemo(() => {
    let result = events
    if (activeFilter !== 'all') {
      result = result.filter((event) => event.type === activeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(event =>
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        (event.tags || []).some(tag => tag.toLowerCase().includes(q))
      )
    }
    return result.sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
  }, [events, activeFilter, searchQuery])

  const getAvailabilityStatus = (event) => {
    const pct = (event.current_participants / event.max_participants) * 100
    if (pct >= 90) return { status: 'almost-full', text: 'Còn ít chỗ' }
    if (pct >= 50) return { status: 'limited', text: 'Còn ít chỗ' }
    return { status: 'available', text: 'Còn chỗ' }
  }

  return (
    <div className="events-page">
      <div className="container">
        <header className="events-header">
          <h2>Sự Kiện</h2>
          <p className="section-description">
            Tham gia các workshop, tour backstage và gặp gỡ nghệ sĩ Tuồng để cảm nhận hơi thở của di sản văn hóa truyền thống.
          </p>
        </header>

        <div className="events-search-bar">
          <div className="events-search-wrap">
            <span className="search-icon" aria-hidden>🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Tìm kiếm sự kiện, workshop, tour..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" className="search-clear" onClick={() => setSearchQuery('')} aria-label="Xóa">
                ✕
              </button>
            )}
          </div>
          <div className="events-filters">
            {FILTER_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={`filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
                onClick={() => setActiveFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="empty-icon">⏳</div>
            <p>Đang tải sự kiện...</p>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <p>Không thể tải sự kiện</p>
            <p className="empty-subtitle">{error}</p>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Không tìm thấy sự kiện nào</p>
            <p className="empty-subtitle">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => {
              const availability = getAvailabilityStatus(event)
              const venue = Array.isArray(event.venues) ? event.venues[0] : event.venues
              const locationText = venue?.name
                ? `${venue.name}${venue.address ? ` - ${venue.address}` : ''}${
                    venue.city ? ` - ${venue.city}` : ''
                  }`
                : 'Chưa có địa điểm'
              return (
                <motion.article
                  key={event.id}
                  className="event-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -2 }}
                  onClick={() => setSelectedEvent(event)}
                >
                  <div className="event-card-inner">
                    <div className="event-thumbnail">
                      <img src={event.thumbnail_url} alt={event.title} />
                      {availability.status !== 'available' && (
                        <div className={`availability-badge ${availability.status}`}>
                          {availability.text}
                        </div>
                      )}
                    </div>
                    <div className="event-body">
                      <div>
                        <h3>{event.title}</h3>
                        <p className="event-description">{event.description}</p>
                        <div className="event-meta">
                          <div className="meta-item">
                            <span className="meta-icon" aria-hidden>📅</span>
                            <span>{formatEventDateForCard(event.event_date)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon" aria-hidden>⏱</span>
                            <span>{formatDuration(event.duration || 0)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon" aria-hidden>📍</span>
                            <span>{locationText}</span>
                          </div>
                          {event.type === 'tour' && event.guide && (
                            <div className="meta-item">
                              <span className="meta-icon" aria-hidden>👤</span>
                              <span>HDV: {event.guide}</span>
                            </div>
                          )}
                          {event.type === 'workshop' && event.instructor && (
                            <div className="meta-item">
                              <span className="meta-icon" aria-hidden>👤</span>
                              <span>{event.instructor}</span>
                            </div>
                          )}
                          {event.type === 'meet_artist' && event.artists && (
                            <div className="meta-item">
                              <span className="meta-icon" aria-hidden>🎭</span>
                              <span>{(event.artists || []).length} nghệ sĩ</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="event-divider">
                        <div className="event-footer">
                          <div className="participants-info">
                            <span className="participants-label">Đã đăng ký</span>
                            <span className="participants-count">
                              {event.current_participants}/{event.max_participants}
                            </span>
                          </div>
                          <div className="event-price">
                            {event.price > 0 ? (
                              <span className="price">{formatPrice(event.price)}</span>
                            ) : (
                              <span className="price free">Miễn phí</span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          className="btn-register"
                          disabled={event.current_participants >= event.max_participants}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (event.current_participants < event.max_participants) {
                              setBookingEvent(event)
                            }
                          }}
                        >
                          {event.current_participants >= event.max_participants
                            ? 'Đã hết chỗ'
                            : 'Đăng ký ngay'}
                          <span aria-hidden>→</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.article>
              )
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {bookingEvent && (
          <EventBookingModal
            event={bookingEvent}
            isOpen={!!bookingEvent}
            onClose={() => setBookingEvent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
