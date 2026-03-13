import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatPrice } from '../../utils/booking'
import { validateName, validateEmail, validatePhone, validateSeatSelection } from '../../utils/validation'
import './booking.css'

export default function BookingSummary({ event, selectedSeats, total, customerInfo, onInfoChange, onContinue, onBack }) {
  const [formData, setFormData] = useState(customerInfo)
  const [errors, setErrors] = useState({})

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}
    
    // Validate name
    const nameValidation = validateName(formData.name)
    if (!nameValidation.valid) {
      newErrors.name = nameValidation.error
    }
    
    // Validate email
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.error
    }
    
    // Validate phone
    const phoneValidation = validatePhone(formData.phone)
    if (!phoneValidation.valid) {
      newErrors.phone = phoneValidation.error
    }
    
    // Validate seat selection
    const seatValidation = validateSeatSelection(selectedSeats, 1, 10)
    if (!seatValidation.valid) {
      newErrors.seats = seatValidation.error
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validate()) {
      onInfoChange(formData)
      onContinue(formData)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content booking-summary"
    >
      <h2>Tóm Tắt Đặt Vé</h2>

      <div className="summary-sections">
        {/* Event Info */}
        <div className="summary-section">
          <h3>Thông tin sự kiện</h3>
          <div className="summary-info">
            <p><strong>Tên sự kiện:</strong> {event.title}</p>
            <p><strong>Ngày giờ:</strong> {new Date(event.startDatetime).toLocaleString('vi-VN')}</p>
            <p><strong>Địa điểm:</strong> {event.venue?.name}</p>
            <p><strong>Địa chỉ:</strong> {event.venue?.address}, {event.venue?.city}</p>
          </div>
        </div>

        {/* Selected Seats */}
        <div className="summary-section">
          <h3>Ghế đã chọn</h3>
          {errors.seats && (
            <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fff1f2', border: '2px solid #f44336', borderRadius: '8px', color: '#c62828' }}>
              ⚠️ {errors.seats}
            </div>
          )}
          {selectedSeats.length === 0 ? (
            <div className="muted" style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>
              Chưa có ghế nào được chọn
            </div>
          ) : (
            <div className="seats-summary">
              {selectedSeats.map(seat => (
                <div key={seat.id} className="seat-summary-item">
                  <span className="seat-label">{seat.label ?? seat.id}</span>
                  <span className="seat-type">{(seat.type || '').toUpperCase()}</span>
                  <span className="seat-price">{formatPrice(seat.price)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Info Form */}
        <div className="summary-section">
          <h3>Thông tin khách hàng</h3>
          <div className="customer-form">
            <div className="form-group">
              <label htmlFor="name">Họ và tên *</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
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
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={errors.email ? 'error' : ''}
                placeholder="example@email.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
              <small>Email xác nhận sẽ được gửi đến địa chỉ này</small>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Số điện thoại *</label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={errors.phone ? 'error' : ''}
                placeholder="0901234567"
              />
              {errors.phone && <span className="error-message">{errors.phone}</span>}
              <small>SMS xác nhận sẽ được gửi đến số này</small>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="summary-section total-section">
          <div className="total-breakdown">
            <div className="total-row">
              <span>Số lượng vé:</span>
              <span>{selectedSeats.length} vé</span>
            </div>
            <div className="total-row">
              <span>Tổng tiền:</span>
              <span className="total-amount">{formatPrice(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        <button className="btn-secondary" onClick={onBack}>
          ← Quay lại
        </button>
        <button className="btn-primary" onClick={handleContinue}>
          Tiếp tục thanh toán →
        </button>
      </div>
    </motion.div>
  )
}
