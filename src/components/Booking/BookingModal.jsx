import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SeatSelection from './SeatSelection'
import BookingSummary from './BookingSummary'
import PaymentMethod from './PaymentMethod'
import Confirmation from './Confirmation'
import { useAuth } from '../../contexts/AuthContext'
import { generateSeatingChart, calculateTotal, generateBookingId, processPayment, sendEmailConfirmation, sendSMSConfirmation, scheduleReminder } from '../../utils/booking'
import { cancelBooking, createBooking, updateBooking } from '../../services/bookingService'
import { getScheduleById } from '../../services/scheduleService'
import seatPricingSyncService from '../../services/seatPricingSyncService'
import './booking.css'

const STEPS = {
  SELECT_SHOW: 1,
  SELECT_SEATS: 2,
  SUMMARY: 3,
  PAYMENT: 4,
  CONFIRMATION: 5
}

export default function BookingModal({ event, isOpen, onClose }) {
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(STEPS.SELECT_SHOW)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [seatingChart, setSeatingChart] = useState([])
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [bookingId, setBookingId] = useState(null) // booking_code
  const [bookingDbId, setBookingDbId] = useState(null) // bookings.id (uuid)
  const [bookingExpiresAt, setBookingExpiresAt] = useState(null) // bookings.payment_expires_at
  
  // Error states
  const [bookingError, setBookingError] = useState(null)
  const [paymentError, setPaymentError] = useState(null)
  const [networkError, setNetworkError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Pending booking holds selected seats (no reserve on seats table)
  const [scheduleStatus, setScheduleStatus] = useState(null)
  const scheduleCheckIntervalRef = useRef(null)
  const [theaterId, setTheaterId] = useState(null)

  // Set up pricing sync for real-time updates
  useEffect(() => {
    if (theaterId && event?.venue_id) {
      const unsubscribe = seatPricingSyncService.subscribe(
        theaterId,
        event.venue_id,
        (payload) => {
          console.log('Pricing updated during booking:', payload)
          // Recalculate totals for selected seats
          // This will trigger re-render with updated prices
        }
      )

      return unsubscribe
    }
  }, [theaterId, event?.venue_id])

  // Initialize seating chart when modal opens
  useEffect(() => {
    if (isOpen && event) {
      const chart = generateSeatingChart(10, 12)
      setSeatingChart(chart)
      // Skip step 1 (select show) since event is already selected, go directly to seat selection
      setCurrentStep(STEPS.SELECT_SEATS)
      setSelectedSeats([])
      setCustomerInfo({ name: '', email: '', phone: '' })
      setPaymentMethod(null)
      setPaymentResult(null)
      setBookingId(null)
      setBookingDbId(null)
      setBookingExpiresAt(null)
      setBookingError(null)
      setPaymentError(null)

      // Load full schedule data to get venue_id and theater_id
      if (event.schedule_id) {
        loadScheduleData()
      }
      
      // Check schedule status
      checkScheduleStatus()
      
      // Check schedule status periodically (every 30 seconds)
      scheduleCheckIntervalRef.current = setInterval(() => {
        checkScheduleStatus()
      }, 30000)
    }
    
    return () => {
      if (scheduleCheckIntervalRef.current) {
        clearInterval(scheduleCheckIntervalRef.current)
        scheduleCheckIntervalRef.current = null
      }
      if (bookingDbId) {
        cancelPendingBooking()
      }
    }
  }, [isOpen, event])
  
  // Load schedule data to get venue_id and theater_id
  const loadScheduleData = async () => {
    if (!event?.schedule_id) return
    
    try {
      const schedule = await getScheduleById(event.schedule_id)
      // Update event with venue_id if not already present
      if (schedule.venue_id && !event.venue_id) {
        event.venue_id = schedule.venue_id
      }
      // Set theater_id for pricing sync
      if (schedule.theater_id) {
        setTheaterId(schedule.theater_id)
      }
    } catch (error) {
      console.error('Error loading schedule data:', error)
    }
  }
  
  // Check schedule status
  const checkScheduleStatus = async () => {
    if (!event?.schedule_id) return
    
    try {
      const schedule = await getScheduleById(event.schedule_id)
      setScheduleStatus(schedule.status)
      
      // If schedule is cancelled, show error
      if (schedule.status === 'cancelled') {
        setBookingError('Suất chiếu này đã bị hủy. Vui lòng chọn suất chiếu khác.')
      }
    } catch (error) {
      console.error('Error checking schedule status:', error)
    }
  }
  
  // Cancel pending booking (giải phóng ghế vì availability theo bookings)
  const cancelPendingBooking = async () => {
    if (!bookingDbId) return
    
    try {
      await cancelBooking(bookingDbId)
      setBookingId(null)
      setBookingDbId(null)
      setBookingExpiresAt(null)
    } catch (error) {
      console.error('Error canceling booking:', error)
    }
  }

  const handleSeatsSelected = async (seats) => {
    if (seats.length === 0) {
      setSelectedSeats(seats)
      setCurrentStep(STEPS.SUMMARY)
      return
    }
    // Giữ ghế bằng cách tạo booking pending (bảng seats không có schedule_id/reserved_by)
    if (!user?.id || !event?.schedule_id) {
      setSelectedSeats(seats)
      setCurrentStep(STEPS.SUMMARY)
      return
    }
    try {
      const seatIds = seats.map(s => s.id || s.seat_id).filter(Boolean)
      const createdBooking = await createBooking({
        user_id: user.id,
        schedule_id: event.schedule_id,
        customer_name: '',
        customer_email: '',
        customer_phone: '',
        seat_ids: seatIds,
        total_amount: calculateTotal(seats),
        payment_timeout_minutes: 15,
      })
      setBookingDbId(createdBooking.id)
      setBookingId(createdBooking.booking_code)
      setBookingExpiresAt(createdBooking.payment_expires_at || null)
    } catch (error) {
      console.error('Error creating booking (hold seats):', error)
      setBookingError('Không thể giữ ghế. Vui lòng thử lại.')
      return
    }
    setSelectedSeats(seats)
    setCurrentStep(STEPS.SUMMARY)
  }

  // Network error detection
  useEffect(() => {
    const handleOnline = () => {
      setNetworkError(false)
      setRetryCount(0)
    }
    const handleOffline = () => {
      setNetworkError(true)
    }
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check initial network status
    if (!navigator.onLine) {
      setNetworkError(true)
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Helper function to check if error is network-related
  const isNetworkError = (error) => {
    if (!navigator.onLine) return true
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) return true
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNABORTED') return true
    return false
  }

  // Helper function to get user-friendly error message
  // PGRST116 = PostgREST "0 rows" (thường từ updateBooking/select().single() khi không trả về dòng nào)
  const getErrorMessage = (error, defaultMessage) => {
    if (isNetworkError(error)) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.'
    }

    if (error?.message) {
      const errorMessages = {
        'PGRST116': 'Không tìm thấy đặt vé hoặc phiên hết hạn. Vui lòng quay lại bước chọn ghế và thử lại.',
        '23505': 'Dữ liệu đã tồn tại. Vui lòng thử lại.',
        '23503': 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        '42501': 'Không có quyền thực hiện thao tác này.',
        'TIMEOUT': 'Yêu cầu quá thời gian. Vui lòng thử lại.'
      }

      for (const [code, message] of Object.entries(errorMessages)) {
        if (error.message.includes(code) || error.code === code) {
          return message
        }
      }

      return error.message
    }

    return defaultMessage || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
  }

  const handleSummaryContinue = async (info) => {
    const customer = info ?? customerInfo
    setCustomerInfo(customer)
    setBookingError(null)
    setRetryCount(0)

    if (scheduleStatus === 'cancelled') {
      setBookingError('Suất chiếu này đã bị hủy. Vui lòng chọn suất chiếu khác.')
      return
    }

    if (!navigator.onLine) {
      setNetworkError(true)
      setBookingError('Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
      return
    }

    if (selectedSeats.length === 0) {
      setBookingError('Vui lòng chọn ít nhất 1 ghế.')
      return
    }

    if (!user?.id) {
      setBookingError('Bạn cần đăng nhập để tiếp tục thanh toán.')
      return
    }

    try {
      if (bookingDbId) {
        await updateBooking(bookingDbId, {
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
        })
      } else {
        const seatIds = selectedSeats.map(s => s.seat_id || s.id).filter(Boolean)
        const createdBooking = await createBooking({
          user_id: user.id,
          schedule_id: event?.schedule_id,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          seat_ids: seatIds,
          total_amount: calculateTotal(selectedSeats),
          payment_timeout_minutes: 15,
        })
        setBookingDbId(createdBooking.id)
        setBookingId(createdBooking.booking_code)
        setBookingExpiresAt(createdBooking.payment_expires_at || null)
      }
      setCurrentStep(STEPS.PAYMENT)
    } catch (error) {
      console.error('Error in handleSummaryContinue:', error)
      setBookingError(getErrorMessage(error, 'Không thể cập nhật đặt vé. Vui lòng thử lại.'))
    }
  }
  
  const retryBooking = async () => {
    if (retryCount >= 3) {
      setBookingError('Đã thử lại quá nhiều lần. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.')
      return
    }
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    setBookingError(null)
    try {
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)))
      if (!user?.id) {
        setBookingError('Bạn cần đăng nhập để tiếp tục thanh toán.')
        return
      }
      if (bookingDbId) {
        await updateBooking(bookingDbId, {
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
        })
      } else {
        const seatIds = selectedSeats.map(s => s.seat_id || s.id).filter(Boolean)
        const createdBooking = await createBooking({
          user_id: user.id,
          schedule_id: event?.schedule_id,
          customer_name: customerInfo.name,
          customer_email: customerInfo.email,
          customer_phone: customerInfo.phone,
          seat_ids: seatIds,
          total_amount: calculateTotal(selectedSeats),
          payment_timeout_minutes: 15,
        })
        setBookingDbId(createdBooking.id)
        setBookingId(createdBooking.booking_code)
        setBookingExpiresAt(createdBooking.payment_expires_at || null)
      }
      setCurrentStep(STEPS.PAYMENT)
      setRetryCount(0)
    } catch (error) {
      console.error('Retry booking failed:', error)
      setBookingError(getErrorMessage(error, 'Không thể tạo/cập nhật mã đặt vé. Vui lòng thử lại.'))
    } finally {
      setIsRetrying(false)
    }
  }

  const handlePayment = async (method, amount, options = {}) => {
    const { alreadyCompleted = false } = options
    setPaymentMethod(method)
    setPaymentError(null)

    if (!navigator.onLine && !alreadyCompleted) {
      setNetworkError(true)
      setPaymentError('Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
      setPaymentResult({
        success: false,
        message: 'Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.'
      })
      return
    }

    if (alreadyCompleted) {
      setPaymentResult({
        success: true,
        message: 'Thanh toán thành công!',
        transactionId: null,
        bookingId,
        amount,
        paymentMethod: method,
        timestamp: new Date().toISOString()
      })
      const booking = {
        bookingId,
        event,
        selectedSeats,
        total: amount,
        customerInfo,
        paymentMethod: method
      }
      sendEmailConfirmation({ ...booking, customerEmail: customerInfo.email })
        .catch(err => console.error('Failed to send email:', err))
      sendSMSConfirmation({ ...booking, customerPhone: customerInfo.phone })
        .catch(err => console.error('Failed to send SMS:', err))
      scheduleReminder(event, booking)
      setCurrentStep(STEPS.CONFIRMATION)
      return
    }

    try {
      const result = await processPayment(method, amount, bookingId)
      setPaymentResult(result)

      if (result.success) {
        const booking = {
          bookingId,
          event,
          selectedSeats,
          total: amount,
          customerInfo,
          paymentMethod: method
        }
        sendEmailConfirmation({ ...booking, customerEmail: customerInfo.email })
          .catch(err => console.error('Failed to send email:', err))
        sendSMSConfirmation({ ...booking, customerPhone: customerInfo.phone })
          .catch(err => console.error('Failed to send SMS:', err))
        scheduleReminder(event, booking)
        setCurrentStep(STEPS.CONFIRMATION)
      } else {
        setPaymentError(result.message || 'Thanh toán thất bại. Vui lòng thử lại.')
      }
    } catch (error) {
      console.error('Payment error:', error)
      const errorMessage = getErrorMessage(error, 'Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.')
      setPaymentError(errorMessage)
      setPaymentResult({
        success: false,
        message: errorMessage
      })
    }
  }
  
  // Retry payment
  const retryPayment = async () => {
    if (!paymentMethod) return
    
    setPaymentError(null)
    setRetryCount(prev => prev + 1)
    
    if (retryCount >= 3) {
      setPaymentError('Đã thử lại quá nhiều lần. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.')
      return
    }
    
    setIsRetrying(true)
    
    try {
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)))
      
      const total = calculateTotal(selectedSeats)
      await handlePayment(paymentMethod, total)
      setRetryCount(0)
    } catch (error) {
      console.error('Retry payment failed:', error)
      const errorMessage = getErrorMessage(error, 'Không thể thực hiện thanh toán. Vui lòng thử lại.')
      setPaymentError(errorMessage)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleBack = async () => {
    if (currentStep === STEPS.PAYMENT && bookingId) {
      const confirmed = window.confirm(
        'Bạn có chắc muốn quay lại? Đặt vé đã tạo sẽ bị hủy và ghế sẽ được giải phóng.'
      )
      if (!confirmed) return
      await cancelPendingBooking()
      setBookingId(null)
    }
    if (currentStep === STEPS.SUMMARY && bookingDbId) {
      const confirmed = window.confirm(
        'Bạn có chắc muốn quay lại chọn ghế? Đặt vé tạm sẽ bị hủy và ghế sẽ được giải phóng.'
      )
      if (!confirmed) return
      await cancelPendingBooking()
      setBookingDbId(null)
      setBookingId(null)
      setBookingExpiresAt(null)
    }
    if (currentStep > STEPS.SELECT_SEATS) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = async () => {
    if (currentStep === STEPS.CONFIRMATION) {
      onClose()
      return
    }
    const confirmed = window.confirm('Bạn có chắc muốn hủy đặt vé? Tất cả thông tin sẽ bị mất.')
    if (!confirmed) return
    await cancelPendingBooking()
    setSelectedSeats([])
    setCustomerInfo({ name: '', email: '', phone: '' })
    setPaymentMethod(null)
    setPaymentResult(null)
    setBookingId(null)
    setBookingDbId(null)
    setBookingExpiresAt(null)
    setBookingError(null)
    setPaymentError(null)
    onClose()
  }
  
  // Handle QR payment timeout
  const handleQRTimeout = async () => {
    setPaymentError('Mã QR đã hết hạn. Vui lòng tạo lại mã QR mới.')
    // Booking đã được cancel trong PaymentMethod component
    setBookingId(null)
    setBookingDbId(null)
    setBookingExpiresAt(null)
  }

  if (!isOpen || !event) return null

  const total = calculateTotal(selectedSeats)

  return (
    <AnimatePresence>
      <div className="booking-modal-overlay" onClick={handleClose}>
        <motion.div
          className="booking-modal"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="booking-modal-close" onClick={handleClose}>✕</button>
          
          {/* Progress Steps */}
          <div className="booking-progress">
            <div className="progress-step completed">
              <div className="step-number">1</div>
              <div className="step-label">Chọn suất</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.SELECT_SEATS ? 'active' : ''} ${currentStep > STEPS.SELECT_SEATS ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Chọn ghế</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.SUMMARY ? 'active' : ''} ${currentStep > STEPS.SUMMARY ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Tóm tắt</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.PAYMENT ? 'active' : ''} ${currentStep > STEPS.PAYMENT ? 'completed' : ''}`}>
              <div className="step-number">4</div>
              <div className="step-label">Thanh toán</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.CONFIRMATION ? 'active' : ''} ${currentStep > STEPS.CONFIRMATION ? 'completed' : ''}`}>
              <div className="step-number">5</div>
              <div className="step-label">Xác nhận</div>
            </div>
          </div>

          {/* Step Content */}
          <div className="booking-content">
            {/* Show event info at the top for all steps */}
            <div className="event-info-header">
              <h3>{event.title}</h3>
              <div className="event-info-meta">
                <span>📅 {new Date(event.startDatetime).toLocaleString('vi-VN')}</span>
                <span>📍 {event.venue?.name}, {event.venue?.city}</span>
              </div>
            </div>

            {currentStep === STEPS.SELECT_SEATS && (
              <SeatSelection
                seatingChart={seatingChart}
                selectedSeats={selectedSeats}
                onSeatsChange={setSelectedSeats}
                onContinue={() => handleSeatsSelected(selectedSeats)}
                onBack={handleBack}
                event={event}
                scheduleId={event?.schedule_id}
                userId={user?.id || null}
              />
            )}

            {currentStep === STEPS.SUMMARY && (
              <>
                {/* Schedule Status Error */}
                {scheduleStatus === 'cancelled' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="schedule-error-banner"
                    style={{
                      background: '#fff1f2',
                      border: '2px solid #f44336',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#c62828'
                    }}
                  >
                    ⚠️ Suất chiếu này đã bị hủy. Vui lòng chọn suất chiếu khác.
                  </motion.div>
                )}
                
                {/* Network Error Banner */}
                {networkError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="network-error-banner"
                    style={{
                      background: '#fff3cd',
                      border: '2px solid #ffc107',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      textAlign: 'center',
                      fontWeight: 600,
                      color: '#856404'
                    }}
                  >
                    ⚠️ Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.
                  </motion.div>
                )}
                
                {/* Booking Error */}
                {bookingError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="booking-error"
                    style={{
                      background: '#fff1f2',
                      border: '2px solid #f44336',
                      borderRadius: '8px',
                      padding: '1rem',
                      marginBottom: '1rem',
                      color: '#c62828'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span>⚠️</span>
                      <strong>Lỗi tạo đặt vé</strong>
                    </div>
                    <p style={{ margin: '0.5rem 0' }}>{bookingError}</p>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                      <button
                        onClick={retryBooking}
                        disabled={isRetrying || retryCount >= 3}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#f44336',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isRetrying || retryCount >= 3 ? 'not-allowed' : 'pointer',
                          opacity: isRetrying || retryCount >= 3 ? 0.6 : 1
                        }}
                      >
                        {isRetrying ? 'Đang thử lại...' : `Thử lại (${retryCount}/3)`}
                      </button>
                      {retryCount >= 3 && (
                        <button
                          onClick={() => {
                            setBookingError(null)
                            setRetryCount(0)
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            background: '#666',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          Đóng
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
                
                <BookingSummary
                  event={event}
                  selectedSeats={selectedSeats}
                  total={total}
                  customerInfo={customerInfo}
                  onInfoChange={setCustomerInfo}
                  onContinue={handleSummaryContinue}
                  onBack={handleBack}
                />
              </>
            )}

            {currentStep === STEPS.PAYMENT && (
              <PaymentMethod
                total={total}
                bookingId={bookingId}
                bookingDbId={bookingDbId}
                bookingExpiresAt={bookingExpiresAt}
                userId={user?.id || null}
                paymentContext={{
                  type: 'booking',
                  bookingDbId,
                  userId: user?.id || null,
                  expiresAt: bookingExpiresAt,
                }}
                onPayment={handlePayment}
                onBack={handleBack}
                paymentResult={paymentResult}
                paymentError={paymentError}
                networkError={networkError}
                onRetryPayment={retryPayment}
                isRetrying={isRetrying}
                retryCount={retryCount}
                onTimeout={handleQRTimeout}
              />
            )}

            {currentStep === STEPS.CONFIRMATION && (
              <Confirmation
                bookingId={bookingId}
                event={event}
                selectedSeats={selectedSeats}
                total={total}
                customerInfo={customerInfo}
                paymentMethod={paymentMethod}
                paymentResult={paymentResult}
                onClose={handleClose}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
