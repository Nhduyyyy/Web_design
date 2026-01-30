import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EventDetail from './EventDetail'
import { events, getEventsByType, getUpcomingEvents, EVENT_TYPES, formatEventDate, formatDuration } from '../data/eventsData'
import { formatPrice } from '../utils/booking'
import './Events.css'

const FILTER_TABS = [
  { id: 'all', label: 'Tất cả', icon: '📅' },
  { id: 'workshop', label: 'Workshop', icon: '🎨' },
  { id: 'tour', label: 'Tour Backstage', icon: '🚪' },
  { id: 'meet-artist', label: 'Gặp Nghệ Sĩ', icon: '👋' }
]

export default function Events() {
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredEvents = useMemo(() => {
    let result = getEventsByType(activeFilter === 'all' ? 'all' : activeFilter)
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        event.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }
    
    // Sort by date (upcoming first)
    return result.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [activeFilter, searchQuery])

  const handleEventClick = (event) => {
    setSelectedEvent(event)
  }

  const handleCloseDetail = () => {
    setSelectedEvent(null)
  }

  const getEventTypeInfo = (type) => {
    return EVENT_TYPES[type] || { label: type, icon: '📅', color: '#666' }
  }

  const getAvailabilityStatus = (event) => {
    const percentage = (event.currentParticipants / event.maxParticipants) * 100
    if (percentage >= 90) return { status: 'almost-full', text: 'Sắp hết chỗ' }
    if (percentage >= 50) return { status: 'limited', text: 'Còn ít chỗ' }
    return { status: 'available', text: 'Còn chỗ' }
  }

  return (
    <div className="events-page">
      <div className="container">
        <div className="events-header">
          <h2>🎭 Sự Kiện</h2>
          <p className="section-description">
            Tham gia các workshop, tour backstage và gặp gỡ nghệ sĩ Tuồng
          </p>
        </div>

        {/* Search Bar */}
        <div className="events-search">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm sự kiện, workshop, tour..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              ✕
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="events-filters">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              className={`filter-tab ${activeFilter === tab.id ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.id)}
            >
              <span className="filter-icon">{tab.icon}</span>
              <span className="filter-label">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <p>Không tìm thấy sự kiện nào</p>
            <p className="empty-subtitle">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="events-grid">
            {filteredEvents.map((event) => {
              const typeInfo = getEventTypeInfo(event.type)
              const availability = getAvailabilityStatus(event)
              
              return (
                <motion.div
                  key={event.id}
                  className="event-card"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02, y: -5 }}
                  onClick={() => handleEventClick(event)}
                >
                  <div className="event-thumbnail">
                    <img src={event.thumbnail} alt={event.title} />
                    <div className="event-type-badge" style={{ background: typeInfo.color }}>
                      <span className="type-icon">{typeInfo.icon}</span>
                      <span className="type-label">{typeInfo.label}</span>
                    </div>
                    <div className={`availability-badge ${availability.status}`}>
                      {availability.text}
                    </div>
                  </div>
                  
                  <div className="event-info">
                    <h3>{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    
                    <div className="event-meta">
                      <div className="meta-item">
                        <span className="meta-icon">📅</span>
                        <span>{formatEventDate(event.date)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span>{formatDuration(event.duration)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-icon">📍</span>
                        <span>{event.venue.name}, {event.venue.city}</span>
                      </div>
                      {event.type === 'workshop' && event.instructor && (
                        <div className="meta-item">
                          <span className="meta-icon">👨‍🏫</span>
                          <span>{event.instructor}</span>
                        </div>
                      )}
                      {event.type === 'tour' && event.guide && (
                        <div className="meta-item">
                          <span className="meta-icon">👤</span>
                          <span>HDV: {event.guide}</span>
                        </div>
                      )}
                      {event.type === 'meet-artist' && event.artists && (
                        <div className="meta-item">
                          <span className="meta-icon">🎭</span>
                          <span>{event.artists.length} nghệ sĩ</span>
                        </div>
                      )}
                    </div>

                    <div className="event-footer">
                      <div className="participants-info">
                        <span className="participants-count">
                          {event.currentParticipants}/{event.maxParticipants}
                        </span>
                        <span className="participants-label">người đã đăng ký</span>
                      </div>
                      <div className="event-price">
                        {event.price > 0 ? (
                          <span className="price">{formatPrice(event.price)}</span>
                        ) : (
                          <span className="price free">Miễn phí</span>
                        )}
                      </div>
                    </div>

                    <button className="btn-register">
                      {event.currentParticipants >= event.maxParticipants 
                        ? 'Đã hết chỗ' 
                        : 'Đăng ký ngay →'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetail
            event={selectedEvent}
            onClose={handleCloseDetail}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
