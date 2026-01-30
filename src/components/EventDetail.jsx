import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatEventDate, formatDuration, EVENT_TYPES } from '../data/eventsData'
import { formatPrice, processPayment, generateBookingId } from '../utils/booking'
import { validateEventRegistration, validateNotes } from '../utils/validation'
import './Events.css'

export default function EventDetail({ event, onClose }) {
  const [showRegistration, setShowRegistration] = useState(false)
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    quantity: 1,
    notes: ''
  })
  const [errors, setErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState(null)

  const typeInfo = EVENT_TYPES[event.type] || { label: event.type, icon: '📅', color: '#666' }
  const totalPrice = event.price * registrationData.quantity
  const isFull = event.currentParticipants >= event.maxParticipants

  const handleInputChange = (field, value) => {
    setRegistrationData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    // Use comprehensive validation utility
    const validation = validateEventRegistration(registrationData, event)
    
    // Validate notes if provided
    if (registrationData.notes) {
      const notesValidation = validateNotes(registrationData.notes, 500)
      if (!notesValidation.valid) {
        validation.errors.notes = notesValidation.error
        validation.valid = false
      }
    }
    
    setErrors(validation.errors)
    return validation.valid
  }

  const handleRegister = () => {
    if (isFull) return
    setShowRegistration(true)
  }

  const handleSubmitRegistration = async () => {
    if (!validateForm()) return
    
    setIsProcessing(true)
    
    // Process payment if required
    if (event.price > 0) {
      const bookingId = generateBookingId()
      const result = await processPayment('wallet', totalPrice, bookingId)
      setPaymentResult(result)
      
      if (result.success) {
        // Simulate sending confirmation
        console.log('📧 Email xác nhận đã được gửi đến:', registrationData.email)
        console.log('📱 SMS xác nhận đã được gửi đến:', registrationData.phone)
        console.log('Đăng ký thành công:', {
          bookingId,
          event: event.title,
          participants: registrationData.quantity,
          total: formatPrice(totalPrice)
        })
        
        // Close modal after success
        setTimeout(() => {
          onClose()
          alert('Đăng ký thành công! Vui lòng kiểm tra email và SMS để xem chi tiết.')
        }, 2000)
      }
    } else {
      // Free event - no payment needed
      console.log('Đăng ký miễn phí thành công:', {
        event: event.title,
        participants: registrationData.quantity
      })
      
      setTimeout(() => {
        onClose()
        alert('Đăng ký thành công! Vui lòng kiểm tra email để xem chi tiết.')
      }, 1000)
    }
    
    setIsProcessing(false)
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

        {!showRegistration ? (
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
        ) : (
          <>
            {/* Registration Form */}
            <div className="registration-form">
              <h2>Đăng Ký Sự Kiện</h2>
              <p className="form-subtitle">{event.title}</p>

              <div className="form-section">
                <h3>Thông Tin Người Đăng Ký</h3>
                <div className="form-group">
                  <label htmlFor="name">Họ và tên *</label>
                  <input
                    type="text"
                    id="name"
                    value={registrationData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={errors.name ? 'error' : ''}
                    placeholder="Nhập họ và tên"
                  />
                  {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    value={registrationData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={errors.email ? 'error' : ''}
                    placeholder="example@email.com"
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại *</label>
                  <input
                    type="tel"
                    id="phone"
                    value={registrationData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className={errors.phone ? 'error' : ''}
                    placeholder="0901234567"
                  />
                  {errors.phone && <span className="error-message">{errors.phone}</span>}
                </div>
              </div>

              <div className="form-section">
                <h3>Thông Tin Đăng Ký</h3>
                <div className="form-group">
                  <label htmlFor="quantity">Số lượng người tham gia *</label>
                  <input
                    type="number"
                    id="quantity"
                    min="1"
                    max={event.maxParticipants - event.currentParticipants}
                    value={registrationData.quantity}
                    onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                    className={errors.quantity ? 'error' : ''}
                  />
                  <small>Còn {event.maxParticipants - event.currentParticipants} chỗ trống</small>
                  {errors.quantity && <span className="error-message">{errors.quantity}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Ghi chú (tùy chọn)</label>
                  <textarea
                    id="notes"
                    value={registrationData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className={errors.notes ? 'error' : ''}
                    placeholder="Ghi chú thêm nếu có..."
                    rows="3"
                    maxLength={500}
                  />
                  <small>{registrationData.notes.length}/500 ký tự</small>
                  {errors.notes && <span className="error-message">{errors.notes}</span>}
                </div>
              </div>

              {event.price > 0 && (
                <div className="payment-summary">
                  <div className="summary-row">
                    <span>Giá mỗi người:</span>
                    <span>{formatPrice(event.price)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Số lượng:</span>
                    <span>{registrationData.quantity} người</span>
                  </div>
                  <div className="summary-row total">
                    <span>Tổng cộng:</span>
                    <span className="total-price">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {paymentResult && !paymentResult.success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="payment-error"
                  >
                    ⚠️ {paymentResult.message}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="form-actions">
                <button
                  className="btn-secondary"
                  onClick={() => setShowRegistration(false)}
                  disabled={isProcessing}
                >
                  ← Quay lại
                </button>
                <button
                  className="btn-primary"
                  onClick={handleSubmitRegistration}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <span className="spinner"></span>
                      Đang xử lý...
                    </>
                  ) : (
                    event.price > 0 ? `Thanh toán ${formatPrice(totalPrice)}` : 'Xác nhận đăng ký'
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
