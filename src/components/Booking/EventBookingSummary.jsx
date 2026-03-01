import { useState } from 'react'
import { motion } from 'framer-motion'
import { formatPrice } from '../../utils/booking'
import { validateName, validateEmail, validatePhone } from '../../utils/validation'
import './booking.css'

export default function EventBookingSummary({ 
  event, 
  quantity, 
  total, 
  customerInfo, 
  onInfoChange, 
  onQuantityChange,
  onContinue, 
  onBack 
}) {
  const [formData, setFormData] = useState(customerInfo)
  const [errors, setErrors] = useState({})
  const [qty, setQty] = useState(quantity)

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Helper function to get max available slots (support both camelCase and snake_case)
  const getMaxAvailable = () => {
    // Support both camelCase (from mock data) and snake_case (from Supabase)
    const maxParticipants = event?.maxParticipants || event?.max_participants || 0
    const currentParticipants = event?.currentParticipants || event?.current_participants || 0
    
    // Debug: Log event data to help troubleshoot
    if (process.env.NODE_ENV === 'development') {
      console.log('Event data for quantity selection:', {
        event: event,
        max_participants: event?.max_participants,
        maxParticipants: event?.maxParticipants,
        current_participants: event?.current_participants,
        currentParticipants: event?.currentParticipants,
        calculatedMax: maxParticipants,
        calculatedCurrent: currentParticipants,
        available: Math.max(0, maxParticipants - currentParticipants)
      })
    }
    
    // Calculate available slots
    const available = Math.max(0, maxParticipants - currentParticipants)
    
    // If maxParticipants is 0 or undefined, it means data is missing
    // In this case, we should still allow at least 1 selection for display
    // But show a warning that data might be incorrect
    if (maxParticipants === 0) {
      console.warn('Event maxParticipants is 0 or missing. Using fallback value.')
      return 100 // Fallback to allow selection
    }
    
    return available
  }

  const handleQuantityChange = (value) => {
    const numValue = parseInt(value) || 1
    const maxAvailable = getMaxAvailable()
    // If maxAvailable is 0 or negative, allow at least 1 (for display purposes)
    const upperLimit = maxAvailable > 0 ? maxAvailable : 1
    const newQty = Math.max(1, Math.min(numValue, upperLimit))
    setQty(newQty)
    onQuantityChange(newQty)
    
    if (errors.quantity) {
      setErrors(prev => ({ ...prev, quantity: '' }))
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
    
    // Validate quantity
    const maxAvailable = getMaxAvailable()
    if (qty < 1) {
      newErrors.quantity = 'Vui lòng chọn ít nhất 1 người tham gia.'
    } else if (maxAvailable <= 0) {
      newErrors.quantity = 'Sự kiện này đã hết chỗ. Vui lòng chọn sự kiện khác.'
    } else if (qty > maxAvailable) {
      newErrors.quantity = `Chỉ còn ${maxAvailable} chỗ trống. Vui lòng giảm số lượng.`
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleContinue = () => {
    if (validate()) {
      onInfoChange(formData)
      onContinue(formData, qty)
    }
  }

  const maxAvailable = getMaxAvailable()

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content booking-summary"
    >
      <h2>Tóm Tắt Đăng Ký</h2>

      <div className="summary-sections">
        {/* Event Info */}
        <div className="summary-section">
          <h3>Thông tin sự kiện</h3>
          <div className="summary-info">
            <p><strong>Tên sự kiện:</strong> {event.title}</p>
            <p><strong>Ngày giờ:</strong> {new Date(event.event_date || event.date).toLocaleString('vi-VN')}</p>
            <p><strong>Địa điểm:</strong> {event.venue?.name || event.venue_name}</p>
            <p><strong>Địa chỉ:</strong> {event.venue?.address || event.address}, {event.venue?.city || event.city}</p>
            <p><strong>Giá mỗi người:</strong> {event.price > 0 ? formatPrice(event.price) : 'Miễn phí'}</p>
          </div>
        </div>

        {/* Quantity Selection */}
        <div className="summary-section">
          <h3>Số lượng người tham gia</h3>
          {errors.quantity && (
            <div className="error-message" style={{ marginBottom: '1rem', padding: '0.75rem', background: '#fff1f2', border: '2px solid #f44336', borderRadius: '8px', color: '#c62828' }}>
              ⚠️ {errors.quantity}
            </div>
          )}
          <div className="quantity-selection" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f5f5f5', borderRadius: '8px' }}>
            <label htmlFor="quantity" style={{ fontWeight: 600 }}>Số lượng:</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => handleQuantityChange(qty - 1)}
                disabled={qty <= 1}
                style={{
                  padding: '0.5rem 1rem',
                  background: qty <= 1 ? '#ccc' : '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                −
              </button>
              <input
                type="number"
                id="quantity"
                min="1"
                max={maxAvailable > 0 ? maxAvailable : 1}
                value={qty}
                onChange={(e) => handleQuantityChange(e.target.value)}
                disabled={maxAvailable <= 0}
                className={errors.quantity ? 'error' : ''}
                style={{
                  width: '80px',
                  padding: '0.5rem',
                  textAlign: 'center',
                  border: errors.quantity ? '2px solid #f44336' : '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  cursor: maxAvailable <= 0 ? 'not-allowed' : 'text',
                  background: maxAvailable <= 0 ? '#f5f5f5' : 'white',
                  opacity: maxAvailable <= 0 ? 0.6 : 1
                }}
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(qty + 1)}
                disabled={qty >= maxAvailable || maxAvailable <= 0}
                style={{
                  padding: '0.5rem 1rem',
                  background: (qty >= maxAvailable || maxAvailable <= 0) ? '#ccc' : '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: (qty >= maxAvailable || maxAvailable <= 0) ? 'not-allowed' : 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: 'bold'
                }}
              >
                +
              </button>
            </div>
            <span style={{ color: maxAvailable <= 0 ? '#f44336' : '#666', fontSize: '0.9rem', fontWeight: maxAvailable <= 0 ? 600 : 400 }}>
              {maxAvailable <= 0 ? '(Đã hết chỗ)' : `(Còn ${maxAvailable} chỗ trống)`}
            </span>
          </div>
        </div>

        {/* Customer Info Form */}
        <div className="summary-section">
          <h3>Thông tin người đăng ký</h3>
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

            <div className="form-group">
              <label htmlFor="notes">Ghi chú (tùy chọn)</label>
              <textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="Ghi chú thêm nếu có..."
                rows="3"
                maxLength={500}
              />
              <small>{(formData.notes || '').length}/500 ký tự</small>
            </div>
          </div>
        </div>

        {/* Total */}
        <div className="summary-section total-section">
          <div className="total-breakdown">
            <div className="total-row">
              <span>Số lượng người:</span>
              <span>{qty} người</span>
            </div>
            {event.price > 0 && (
              <>
                <div className="total-row">
                  <span>Giá mỗi người:</span>
                  <span>{formatPrice(event.price)}</span>
                </div>
                <div className="total-row">
                  <span>Tổng tiền:</span>
                  <span className="total-amount">{formatPrice(total)}</span>
                </div>
              </>
            )}
            {event.price === 0 && (
              <div className="total-row">
                <span>Tổng tiền:</span>
                <span className="total-amount">Miễn phí</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        <button className="btn-secondary" onClick={onBack}>
          ← Quay lại
        </button>
        <button className="btn-primary" onClick={handleContinue}>
          {event.price > 0 ? `Tiếp tục thanh toán →` : 'Xác nhận đăng ký →'}
        </button>
      </div>
    </motion.div>
  )
}
