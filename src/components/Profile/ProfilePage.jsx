import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../../contexts/AuthContext'
import { updateProfile, uploadAvatar, deleteAvatar } from '../../services/authService'
import { getRegistrationsByUser } from '../../services/eventService'
import { getBookingsByUser } from '../../services/bookingService'
import { formatPrice } from '../../utils/booking'
import './Profile.css'

const sectionTransition = {
  initial: { opacity: 0, y: 28 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
}

export default function ProfilePage({ onClose, setActiveSection }) {
  const { user, profile, isAuthenticated } = useAuth()
  const [activeTab, setActiveTab] = useState('personal')
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    phone: ''
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deletingAvatar, setDeletingAvatar] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [bookings, setBookings] = useState([])
  const [registrations, setRegistrations] = useState([])
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingRegistrations, setLoadingRegistrations] = useState(false)
  const [bookingsError, setBookingsError] = useState(null)
  const [registrationsError, setRegistrationsError] = useState(null)

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || ''
      })
      setAvatarPreview(profile.avatar_url || null)
    }
  }, [profile])

  useEffect(() => {
    if (isAuthenticated && user) {
      if (activeTab === 'bookings') {
        loadBookings()
      } else if (activeTab === 'events') {
        loadRegistrations()
      }
    }
  }, [isAuthenticated, user, activeTab])

  const loadBookings = async () => {
    setLoadingBookings(true)
    setBookingsError(null)
    try {
      const data = await getBookingsByUser(user.id)
      setBookings(data || [])
    } catch (error) {
      console.error('Error loading bookings:', error)
      setBookings([])
      setBookingsError('Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.')
    } finally {
      setLoadingBookings(false)
    }
  }

  const loadRegistrations = async () => {
    setLoadingRegistrations(true)
    setRegistrationsError(null)
    try {
      const data = await getRegistrationsByUser(user.id)
      setRegistrations(data || [])
    } catch (error) {
      console.error('Error loading registrations:', error)
      setRegistrations([])
      setRegistrationsError('Không thể tải lịch sử đăng ký sự kiện. Vui lòng thử lại sau.')
    } finally {
      setLoadingRegistrations(false)
    }
  }

  // Validation functions
  const validateFullName = (name) => {
    if (!name || name.trim().length === 0) {
      return 'Họ và tên không được để trống'
    }
    if (name.trim().length < 2) {
      return 'Họ và tên phải có ít nhất 2 ký tự'
    }
    if (name.trim().length > 100) {
      return 'Họ và tên không được vượt quá 100 ký tự'
    }
    // Check for invalid characters (only allow Vietnamese characters, spaces, and common punctuation)
    const invalidChars = /[<>{}[\]\\\/]/
    if (invalidChars.test(name)) {
      return 'Họ và tên chứa ký tự không hợp lệ'
    }
    return null
  }

  const validatePhone = (phone) => {
    if (!phone || phone.trim().length === 0) {
      return null // Phone is optional
    }
    
    // Remove spaces and common formatting
    const cleaned = phone.replace(/[\s\-\(\)]/g, '')
    
    // Check if it's a valid Vietnamese phone number
    // Format: 0xxxxxxxxx (10 digits starting with 0) or +84xxxxxxxxx
    const vietnamesePhoneRegex = /^(0|\+84)[1-9][0-9]{8,9}$/
    
    if (!vietnamesePhoneRegex.test(cleaned)) {
      return 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (10 số, bắt đầu bằng 0)'
    }
    
    return null
  }

  const validateForm = () => {
    const errors = {}
    
    const fullNameError = validateFullName(formData.full_name)
    if (fullNameError) {
      errors.full_name = fullNameError
    }
    
    const phoneError = validatePhone(formData.phone)
    if (phoneError) {
      errors.phone = phoneError
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Real-time validation
    if (name === 'full_name') {
      const error = validateFullName(value)
      setFormErrors(prev => ({
        ...prev,
        full_name: error || undefined
      }))
    } else if (name === 'phone') {
      const error = validatePhone(value)
      setFormErrors(prev => ({
        ...prev,
        phone: error || undefined
      }))
    }
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('File phải là hình ảnh (JPG, PNG, GIF)')
        return
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File ảnh không được vượt quá 5MB')
        return
      }
      
      setError(null)
      setAvatarFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result)
      }
      reader.onerror = () => {
        setError('Không thể đọc file ảnh. Vui lòng thử lại.')
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validate form before submission
    if (!validateForm()) {
      setError('Vui lòng sửa các lỗi trong form trước khi lưu')
      return
    }

    setLoading(true)

    try {
      // Trim and clean form data
      const updates = {
        full_name: formData.full_name.trim(),
        phone: formData.phone.trim() || null
      }

      // Upload avatar if changed
      if (avatarFile) {
        try {
          const avatarUrl = await uploadAvatar(user.id, avatarFile)
          updates.avatar_url = avatarUrl
          console.log('Avatar uploaded successfully:', avatarUrl)
        } catch (avatarError) {
          console.error('Avatar upload failed:', avatarError)
          // If avatar upload fails, still try to update other profile info
          // but show error message
          setError(`Lỗi upload avatar: ${avatarError.message}. Thông tin khác vẫn được cập nhật.`)
          
          // Continue with profile update even if avatar fails
          await updateProfile(user.id, updates)
          setSuccess('Cập nhật thông tin thành công, nhưng avatar chưa được cập nhật.')
          setIsEditing(false)
          setAvatarFile(null)
          setLoading(false)
          return
        }
      }

      // Update profile
      await updateProfile(user.id, updates)

      setSuccess('Cập nhật hồ sơ thành công!')
      setIsEditing(false)
      setAvatarFile(null)
      setFormErrors({})
      
      // Reload page after 1.5 seconds to refresh profile
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error updating profile:', error)
      setError(error.message || 'Có lỗi xảy ra khi cập nhật hồ sơ')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!profile?.avatar_url && !avatarPreview) {
      setError('Không có avatar để xóa')
      return
    }

    // Confirm deletion
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa avatar?')
    if (!confirmed) return

    setDeletingAvatar(true)
    setError(null)
    setSuccess(null)

    try {
      // If there's an existing avatar URL, delete from storage
      if (profile?.avatar_url) {
        await deleteAvatar(user.id, profile.avatar_url)
      }

      // Clear preview if in edit mode
      setAvatarFile(null)
      setAvatarPreview(null)

      setSuccess('Đã xóa avatar thành công!')
      
      // Reload page after 1.5 seconds to refresh profile
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (error) {
      console.error('Error deleting avatar:', error)
      setError(error.message || 'Có lỗi xảy ra khi xóa avatar')
    } finally {
      setDeletingAvatar(false)
    }
  }

  const handleBack = () => {
    if (onClose) {
      onClose()
    } else if (setActiveSection) {
      setActiveSection('experience')
    }
  }

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return '👑 Quản trị viên'
      case 'theater':
        return '🎭 Nhà hát'
      default:
        return '👤 Người dùng'
    }
  }

  const getStatusBadge = (status) => {
    const normalized = status === 'canceled' ? 'cancelled' : (status || '')
    const statusMap = {
      confirmed: { text: 'Đã xác nhận', class: 'status-confirmed' },
      pending: { text: 'Chờ thanh toán', class: 'status-pending' },
      cancelled: { text: 'Đã hủy', class: 'status-cancelled' },
      completed: { text: 'Đã thanh toán', class: 'status-confirmed' },
      failed: { text: 'Thất bại', class: 'status-cancelled' },
      refunded: { text: 'Đã hoàn tiền', class: 'status-cancelled' }
    }
    const statusInfo = statusMap[normalized] || { text: status || '—', class: 'status-default' }
    return (
      <span className={`status-badge ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    )
  }

  if (!isAuthenticated) {
    return (
      <motion.div
        className="profile-page"
        {...sectionTransition}
      >
        <div className="profile-container">
          <div className="profile-not-authenticated">
            <p>Vui lòng đăng nhập để xem hồ sơ</p>
          </div>
        </div>
      </motion.div>
    )
  }

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User'
  const displayEmail = user?.email || ''
  const avatarUrl = avatarPreview || profile?.avatar_url || null

  return (
    <motion.div
      className="profile-page"
      {...sectionTransition}
    >
      <div className="profile-container">
        {/* Header */}
        <header className="profile-header">
          <div className="profile-header-content">
            <button 
              className="profile-back-btn"
              onClick={handleBack}
              aria-label="Quay lại"
            >
              <svg fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                <path d="m15 18-6-6 6-6"></path>
              </svg>
            </button>
            <h1 className="profile-title">Hồ Sơ Của Tôi</h1>
          </div>
        </header>

        <div className="profile-layout">
          {/* Sidebar Navigation */}
          <aside className="profile-sidebar">
            <nav className="profile-nav">
              <button
                className={`profile-nav-item ${activeTab === 'personal' ? 'active' : ''}`}
                onClick={() => setActiveTab('personal')}
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                Thông tin cá nhân
              </button>
              <button
                className={`profile-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
                onClick={() => setActiveTab('bookings')}
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <rect height="18" rx="2" width="18" x="3" y="3"></rect>
                  <path d="M3 9h18"></path>
                  <path d="M3 15h18"></path>
                </svg>
                Lịch sử đặt vé
              </button>
              <button
                className={`profile-nav-item ${activeTab === 'events' ? 'active' : ''}`}
                onClick={() => setActiveTab('events')}
              >
                <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
                Sự kiện đã đăng ký
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <section className="profile-content">
            {/* Error/Success Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-alert profile-alert-error"
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="profile-alert profile-alert-success"
              >
                {success}
              </motion.div>
            )}

            {/* Profile Header Card */}
            <div className="profile-header-card">
              <div className="profile-header-card-content">
                {/* Avatar */}
                <div className="profile-avatar-container">
                  <div className="profile-avatar-wrapper">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={displayName} className="profile-avatar" />
                    ) : (
                      <div className="profile-avatar-placeholder">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {isEditing && (
                      <>
                        <label className="profile-avatar-upload">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            style={{ display: 'none' }}
                          />
                          📷
                        </label>
                        {(avatarUrl || avatarPreview) && (
                          <button
                            className="profile-avatar-delete"
                            onClick={handleDeleteAvatar}
                            disabled={deletingAvatar}
                            aria-label="Xóa avatar"
                            title="Xóa avatar"
                          >
                            {deletingAvatar ? '...' : '🗑️'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* User Info Summary */}
                <div className="profile-info-summary">
                  <div className="profile-name-row">
                    <h2 className="profile-name">{displayName}</h2>
                    <span className="profile-role-badge">
                      {getRoleLabel(profile?.role || 'user')}
                    </span>
                  </div>
                  <p className="profile-email">{displayEmail}</p>
                  {!isEditing && (
                    <button
                      className="btn-primary profile-edit-btn"
                      onClick={() => setIsEditing(true)}
                    >
                      Chỉnh sửa hồ sơ
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'personal' && (
              <div className="profile-section">
                {!isEditing ? (
                  <>
                    <h3 className="profile-section-title">Thông tin cá nhân</h3>
                    <div className="profile-details-grid">
                      <div className="profile-detail-item">
                        <p className="profile-detail-label">Họ và tên</p>
                        <p className="profile-detail-value">{profile?.full_name || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="profile-detail-item">
                        <p className="profile-detail-label">Email</p>
                        <p className="profile-detail-value">{displayEmail}</p>
                      </div>
                      <div className="profile-detail-item">
                        <p className="profile-detail-label">Số điện thoại</p>
                        <p className="profile-detail-value">{profile?.phone || 'Chưa cập nhật'}</p>
                      </div>
                      <div className="profile-detail-item">
                        <p className="profile-detail-label">Ngày tham gia</p>
                        <p className="profile-detail-value">
                          {profile?.created_at 
                            ? new Date(profile.created_at).toLocaleDateString('vi-VN')
                            : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  <form className="profile-edit-form" onSubmit={handleSubmit}>
                    <h3 className="profile-section-title">Chỉnh sửa thông tin</h3>
                    <div className="profile-form-grid">
                      <div className="profile-form-group">
                        <label htmlFor="full_name" className="profile-form-label">
                          Họ và tên *
                        </label>
                        <input
                          type="text"
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleInputChange}
                          required
                          className="profile-form-input"
                          placeholder="Nhập họ và tên"
                        />
                      </div>
                      <div className="profile-form-group">
                        <label htmlFor="phone" className="profile-form-label">
                          Số điện thoại
                        </label>
                        <input
                          type="tel"
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="profile-form-input"
                          placeholder="0901234567"
                        />
                      </div>
                    </div>
                    <div className="profile-form-actions">
                      <button
                        type="button"
                        className="profile-btn-secondary"
                        onClick={() => {
                          setIsEditing(false)
                          setError(null)
                          setSuccess(null)
                          setAvatarFile(null)
                          setAvatarPreview(profile?.avatar_url || null)
                          setFormErrors({})
                          setFormData({
                            full_name: profile?.full_name || '',
                            phone: profile?.phone || ''
                          })
                        }}
                        disabled={loading}
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={loading || Object.keys(formErrors).length > 0}
                      >
                        {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'bookings' && (
              <div className="profile-section">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">Lịch sử đặt vé</h3>
                </div>
                {loadingBookings ? (
                  <div className="profile-loading">Đang tải...</div>
                ) : bookingsError ? (
                  <div className="profile-empty-state">
                    <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>{bookingsError}</p>
                    <button 
                      className="btn-primary"
                      onClick={loadBookings}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="profile-empty-state">
                    <p>Bạn chưa đặt vé nào</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setActiveSection && setActiveSection('watch')}
                    >
                      Đặt vé ngay
                    </button>
                  </div>
                ) : (
                  <div className="profile-list">
                    {bookings.map((booking) => (
                      <motion.div
                        key={booking.id}
                        className="profile-list-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="profile-list-item-content">
                          <div className="profile-list-item-icon">
                            {booking.schedule?.show?.title?.charAt(0) || 'T'}
                          </div>
                          <div className="profile-list-item-info">
                            <h4 className="profile-list-item-title">
                              {booking.schedule?.show?.title || 'Vở diễn Tuồng'}
                            </h4>
                            <p className="profile-list-item-meta">
                              {booking.schedule?.start_datetime 
                                ? new Date(booking.schedule.start_datetime).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'N/A'} 
                              {booking.seat_ids && booking.seat_ids.length > 0 && (
                                <> • Ghế {booking.seat_ids.join(', ')}</>
                              )}
                              {booking.booking_code && (
                                <> • Mã: <strong>{booking.booking_code}</strong></>
                              )}
                              {booking.total_amount && booking.total_amount > 0 && (
                                <> • {formatPrice(booking.total_amount)}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="profile-list-item-status">
                          {getStatusBadge(booking.status)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div className="profile-section">
                <div className="profile-section-header">
                  <h3 className="profile-section-title">Sự kiện đã đăng ký</h3>
                </div>
                {loadingRegistrations ? (
                  <div className="profile-loading">Đang tải...</div>
                ) : registrationsError ? (
                  <div className="profile-empty-state">
                    <p style={{ color: '#fca5a5', marginBottom: '1rem' }}>{registrationsError}</p>
                    <button 
                      className="btn-primary"
                      onClick={loadRegistrations}
                    >
                      Thử lại
                    </button>
                  </div>
                ) : registrations.length === 0 ? (
                  <div className="profile-empty-state">
                    <p>Bạn chưa đăng ký sự kiện nào</p>
                    <button 
                      className="btn-primary"
                      onClick={() => setActiveSection && setActiveSection('watch')}
                    >
                      Xem sự kiện
                    </button>
                  </div>
                ) : (
                  <div className="profile-list">
                    {registrations.map((reg) => (
                      <motion.div
                        key={reg.id}
                        className="profile-list-item"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="profile-list-item-content">
                          <div className="profile-list-item-icon event-icon">
                            <svg fill="none" height="24" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                          </div>
                          <div className="profile-list-item-info">
                            <h4 className="profile-list-item-title">
                              {reg.event?.title || 'Sự kiện'}
                            </h4>
                            <p className="profile-list-item-meta">
                              {reg.event?.event_date 
                                ? new Date(reg.event.event_date).toLocaleString('vi-VN', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : 'N/A'}
                              {reg.event?.venue?.name && (
                                <> • {reg.event.venue.name}</>
                              )}
                              {reg.registration_code && (
                                <> • Mã: <strong>{reg.registration_code}</strong></>
                              )}
                              {reg.amount && reg.amount > 0 && (
                                <> • {formatPrice(reg.amount)}</>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="profile-list-item-status">
                          {getStatusBadge(reg.status)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  )
}
