import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EventDetail from './EventDetail'
import { getEventsByType, formatEventDateForCard, formatDuration } from '../data/eventsData'
import { formatPrice } from '../utils/booking'
import './Events.css'

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'workshop', label: 'Workshop' },
  { id: 'tour', label: 'Tour Backstage' },
  { id: 'meet-artist', label: 'Gặp Nghệ Sĩ' }
]

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    let result = getEventsByType(activeFilter === 'all' ? 'all' : activeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(event =>
        event.title.toLowerCase().includes(q) ||
        event.description.toLowerCase().includes(q) ||
        event.tags.some(tag => tag.toLowerCase().includes(q))
      )
    }
    return result.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [activeFilter, searchQuery])

  const getAvailabilityStatus = (event) => {
    const pct = (event.currentParticipants / event.maxParticipants) * 100
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

        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Không tìm thấy sự kiện nào</p>
            <p className="empty-subtitle">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => {
              const availability = getAvailabilityStatus(event)
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
                      <img src={event.thumbnail} alt={event.title} />
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
                            <span>{formatEventDateForCard(event.date)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon" aria-hidden>⏱</span>
                            <span>{formatDuration(event.duration)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-icon" aria-hidden>📍</span>
                            <span>{event.venue.name}, {event.venue.city}</span>
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
                          {event.type === 'meet-artist' && event.artists && (
                            <div className="meta-item">
                              <span className="meta-icon" aria-hidden>🎭</span>
                              <span>{event.artists.length} nghệ sĩ</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="event-divider">
                        <div className="event-footer">
                          <div className="participants-info">
                            <span className="participants-label">Đã đăng ký</span>
                            <span className="participants-count">
                              {event.currentParticipants}/{event.maxParticipants}
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
                          disabled={event.currentParticipants >= event.maxParticipants}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (event.currentParticipants < event.maxParticipants) setSelectedEvent(event)
                          }}
                        >
                          {event.currentParticipants >= event.maxParticipants ? 'Đã hết chỗ' : 'Đăng ký ngay'}
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
    </div>
  )
}
