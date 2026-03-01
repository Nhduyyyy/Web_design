import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatEventDate, formatDuration, EVENT_TYPES } from '../data/eventsData'
import { formatPrice } from '../utils/booking'
import EventBookingModal from './Booking/EventBookingModal'
import './Events.css'

export default function EventDetail({ event, onClose }) {
  const [showBookingModal, setShowBookingModal] = useState(false)

  const typeInfo = EVENT_TYPES[event.type] || { label: event.type, icon: '📅', color: '#666' }
  const isFull = (event.currentParticipants || event.current_participants || 0) >= (event.maxParticipants || event.max_participants || 0)

  const handleRegister = () => {
    if (isFull) return
    setShowBookingModal(true)
  }
  
  const handleBookingClose = () => {
    setShowBookingModal(false)
  }

  return (
    <div className="event-detail-overlay" onClick={onClose}>
      <motion.div
        className="event-detail-modal"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>✕</button>

        <>
            {/* Event Info */}
            <div className="event-detail-header">
              <div className="event-detail-thumbnail">
                <img src={event.thumbnail} alt={event.title} />
                <div className="event-type-badge-large" style={{ background: typeInfo.color }}>
                  <span className="type-icon">{typeInfo.icon}</span>
                  <span className="type-label">{typeInfo.label}</span>
                </div>
              </div>
              <div className="event-detail-title">
                <h2>{event.title}</h2>
                <p className="event-detail-description">{event.description}</p>
              </div>
            </div>

            <div className="event-detail-content">
              {/* Key Information */}
              <div className="detail-section">
                <h3>📋 Thông Tin Sự Kiện</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>📅 Ngày giờ:</strong>
                    <span>{formatEventDate(event.date)}</span>
                  </div>
                  <div className="info-item">
                    <strong>⏱️ Thời lượng:</strong>
                    <span>{formatDuration(event.duration)}</span>
                  </div>
                  <div className="info-item">
                    <strong>📍 Địa điểm:</strong>
                    <span>{event.venue.name}</span>
                  </div>
                  <div className="info-item">
                    <strong>🏙️ Địa chỉ:</strong>
                    <span>{event.venue.address}, {event.venue.city}</span>
                  </div>
                  {event.type === 'workshop' && event.instructor && (
                    <div className="info-item">
                      <strong>👨‍🏫 Giảng viên:</strong>
                      <span>{event.instructor}</span>
                    </div>
                  )}
                  {event.type === 'tour' && event.guide && (
                    <div className="info-item">
                      <strong>👤 Hướng dẫn viên:</strong>
                      <span>{event.guide}</span>
                    </div>
                  )}
                  {event.type === 'meet-artist' && event.artists && (
                    <div className="info-item">
                      <strong>🎭 Nghệ sĩ:</strong>
                      <span>{event.artists.join(', ')}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <strong>👥 Số lượng:</strong>
                    <span>{event.currentParticipants}/{event.maxParticipants} người đã đăng ký</span>
                  </div>
                  <div className="info-item">
                    <strong>💰 Giá:</strong>
                    <span className="price-highlight">
                      {event.price > 0 ? formatPrice(event.price) : 'Miễn phí'}
                    </span>
                  </div>
                </div>
              </div>

              {/* What's Included */}
              {event.includes && event.includes.length > 0 && (
                <div className="detail-section">
                  <h3>✨ Bao Gồm</h3>
                  <ul className="includes-list">
                    {event.includes.map((item, index) => (
                      <li key={index}>✓ {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {event.requirements && event.requirements.length > 0 && (
                <div className="detail-section">
                  <h3>📝 Yêu Cầu</h3>
                  <ul className="requirements-list">
                    {event.requirements.map((req, index) => (
                      <li key={index}>• {req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {event.tags && event.tags.length > 0 && (
                <div className="detail-section">
                  <h3>🏷️ Tags</h3>
                  <div className="tags-list">
                    {event.tags.map((tag, index) => (
                      <span key={index} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="event-detail-actions">
              <button className="btn-secondary" onClick={onClose}>
                Đóng
              </button>
              <button
                className="btn-primary"
                onClick={handleRegister}
                disabled={isFull}
              >
                {isFull ? 'Đã hết chỗ' : 'Đăng ký ngay →'}
              </button>
            </div>
        </>
      </motion.div>
      
      {/* Event Booking Modal */}
      <AnimatePresence>
        {showBookingModal && (
          <EventBookingModal
            event={event}
            isOpen={showBookingModal}
            onClose={handleBookingClose}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
