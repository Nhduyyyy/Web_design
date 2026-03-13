import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import EventBookingSummary from './EventBookingSummary'
import PaymentMethod from './PaymentMethod'
import EventConfirmation from './EventConfirmation'
import { useAuth } from '../../contexts/AuthContext'
import { sendEmailConfirmation, sendSMSConfirmation, scheduleReminder } from '../../utils/booking'
import { cancelRegistration, createEventRegistration, getEventById } from '../../services/eventService'
import { checkEventRegistrationPaymentStatus } from '../../services/paymentService'
import { supabase } from '../../lib/supabase'
import './booking.css'

const STEPS = {
  SUMMARY: 1,
  PAYMENT: 2,
  CONFIRMATION: 3
}

export default function EventBookingModal({ event, isOpen, onClose }) {
  const { user, isAuthenticated } = useAuth()
  const [currentStep, setCurrentStep] = useState(STEPS.SUMMARY)
  const [quantity, setQuantity] = useState(1)
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    notes: ''
  })
  const [paymentMethod, setPaymentMethod] = useState(null)
  const [paymentResult, setPaymentResult] = useState(null)
  const [registrationId, setRegistrationId] = useState(null) // event_registrations.id (uuid)
  const [registrationCode, setRegistrationCode] = useState(null) // event_registrations.registration_code (REG...)
  const [paymentExpiresAt, setPaymentExpiresAt] = useState(null) // UI-only expiry timestamp
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [isRegistrationConfirmed, setIsRegistrationConfirmed] = useState(false) // Track if registration is confirmed
  const successTimerRef = useRef(null)
  
  // Error states
  const [bookingError, setBookingError] = useState(null)
  const [paymentError, setPaymentError] = useState(null)
  const [networkError, setNetworkError] = useState(false)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  
  // Event status check
  const [eventStatus, setEventStatus] = useState(null)
  const eventCheckIntervalRef = useRef(null)
  
  // Real-time event data (for participant updates)
  const [eventData, setEventData] = useState(event)
  const realtimeSubscriptionRef = useRef(null)
  
  // Session timeout handling
  const [sessionWarning, setSessionWarning] = useState(false)

  // Session timeout detection and state saving
  useEffect(() => {
    if (!isOpen) return
    
    // Check if user is authenticated
    if (!isAuthenticated && user) {
      // User was logged in but session expired
      // Save booking state to localStorage
      const bookingState = {
        event: eventData || event,
        quantity,
        customerInfo,
        currentStep,
        registrationId,
        timestamp: Date.now()
      }
      localStorage.setItem('eventBookingState', JSON.stringify(bookingState))
      
      setBookingError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục.')
      setSessionWarning(true)
    } else if (isAuthenticated && user) {
      // User is authenticated, check for saved state
      const savedState = localStorage.getItem('eventBookingState')
      if (savedState) {
        try {
          const state = JSON.parse(savedState)
          // Only restore if state is recent (within 1 hour)
          const stateAge = Date.now() - (state.timestamp || 0)
          if (stateAge < 60 * 60 * 1000) {
            // Restore state
            if (state.event) setEventData(state.event)
            if (state.quantity) setQuantity(state.quantity)
            if (state.customerInfo) setCustomerInfo(state.customerInfo)
            if (state.currentStep) setCurrentStep(state.currentStep)
            if (state.registrationId) setRegistrationId(state.registrationId)
            
            // Clear saved state
            localStorage.removeItem('eventBookingState')
            setSessionWarning(false)
          } else {
            // State is too old, clear it
            localStorage.removeItem('eventBookingState')
          }
        } catch (error) {
          console.error('Error restoring booking state:', error)
          localStorage.removeItem('eventBookingState')
        }
      }
    }
  }, [isAuthenticated, user, isOpen])
  
  // Initialize when modal opens
  useEffect(() => {
    if (isOpen && event) {
      // Debug: Log event object to see what fields it has
      console.log('EventBookingModal - Event object received:', {
        id: event.id,
        title: event.title,
        maxParticipants: event.maxParticipants,
        max_participants: event.max_participants,
        currentParticipants: event.currentParticipants,
        current_participants: event.current_participants,
        fullEvent: event
      })
      
      setCurrentStep(STEPS.SUMMARY)
      setQuantity(1)
      setCustomerInfo({ name: '', email: '', phone: '', notes: '' })
      setPaymentMethod(null)
      setPaymentResult(null)
      setRegistrationId(null)
      setRegistrationCode(null)
      setPaymentExpiresAt(null)
      setShowPaymentSuccess(false)
      setBookingError(null)
      setPaymentError(null)
      setEventData(event) // Initialize event data
      
      // Check event status (only if event has id from database)
      // For mock data without id, skip this check
      if (event.id && event.id.startsWith && !event.id.startsWith('evt-')) {
        checkEventStatus()
      }
      
      // Check event status periodically (every 30 seconds)
      eventCheckIntervalRef.current = setInterval(() => {
        checkEventStatus()
      }, 30000)
    }
    
    return () => {
      // Cleanup on unmount
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current)
        successTimerRef.current = null
      }
      if (eventCheckIntervalRef.current) {
        clearInterval(eventCheckIntervalRef.current)
        eventCheckIntervalRef.current = null
      }
      // Unsubscribe from real-time updates
      if (realtimeSubscriptionRef.current) {
        supabase.removeChannel(realtimeSubscriptionRef.current)
        realtimeSubscriptionRef.current = null
      }
      // Only cancel registration if it hasn't been confirmed yet
      if (registrationId && !isRegistrationConfirmed) {
        console.log('🧹 Cleanup: Canceling pending registration', registrationId)
        cancelPendingRegistration()
      } else if (registrationId && isRegistrationConfirmed) {
        console.log('✅ Cleanup: Registration already confirmed, skipping cancel', registrationId)
      }
    }
  }, [isOpen, event])
  
  // Real-time subscription to events table for participant updates
  useEffect(() => {
    // Skip for mock data (events with id like 'evt-001')
    if (!isOpen || !event?.id || (event.id.startsWith && event.id.startsWith('evt-'))) {
      return
    }
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel(`event-${event.id}-participants`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${event.id}`
        },
        (payload) => {
          console.log('Real-time event update received:', payload)
          
          // Update event data
          const updatedEvent = payload.new
          setEventData(prev => ({ ...prev, ...updatedEvent }))
          
          // Update event status
          if (updatedEvent.status) {
            setEventStatus(updatedEvent.status)
          }
          
          // Recalculate available slots
          const maxParticipants = updatedEvent.max_participants || updatedEvent.maxParticipants || 0
          const currentParticipants = updatedEvent.current_participants || updatedEvent.currentParticipants || 0
          const available = Math.max(0, maxParticipants - currentParticipants)
          
          // Show warning if event is cancelled
          if (updatedEvent.status === 'cancelled') {
            setBookingError('Sự kiện này đã bị hủy. Vui lòng chọn sự kiện khác.')
            return
          }
          
          // Show warning if event is full
          if (available <= 0) {
            setBookingError('Sự kiện này đã hết chỗ. Vui lòng chọn sự kiện khác.')
            // Auto-adjust quantity to 0 (will be handled by validation)
            if (quantity > 0) {
              setQuantity(0)
            }
            return
          }
          
          // Show warning if available slots decreased and user selected more than available
          if (quantity > available) {
            setBookingError(`Chỉ còn ${available} chỗ trống. Vui lòng giảm số lượng người tham gia.`)
            // Auto-adjust quantity to available slots
            setQuantity(available)
          } else if (available < (eventData?.max_participants || eventData?.maxParticipants || 0) - (eventData?.current_participants || eventData?.currentParticipants || 0)) {
            // Show info message if slots decreased but still enough for user's selection
            console.log(`Available slots decreased to ${available}. Your selection (${quantity}) is still valid.`)
          }
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to event updates')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error')
        }
      })
    
    realtimeSubscriptionRef.current = channel
    
    return () => {
      // Cleanup subscription
      if (realtimeSubscriptionRef.current) {
        supabase.removeChannel(realtimeSubscriptionRef.current)
        realtimeSubscriptionRef.current = null
      }
    }
  }, [isOpen, event?.id, quantity, eventData])
  
  // Check event status
  const checkEventStatus = async () => {
    // Skip check for mock data (events with id like 'evt-001')
    if (!event?.id || (event.id.startsWith && event.id.startsWith('evt-'))) {
      return
    }
    
    try {
      const latestEventData = await getEventById(event.id)
      setEventStatus(latestEventData.status)
      setEventData(prev => ({ ...prev, ...latestEventData }))
      
      // If event is cancelled or full, show error
      if (latestEventData.status === 'cancelled') {
        setBookingError('Sự kiện này đã bị hủy. Vui lòng chọn sự kiện khác.')
      } else if (latestEventData.current_participants >= latestEventData.max_participants) {
        setBookingError('Sự kiện này đã hết chỗ. Vui lòng chọn sự kiện khác.')
      }
    } catch (error) {
      console.error('Error checking event status:', error)
      // If error (e.g., table is empty), don't block the user
      // They can still use mock data
    }
  }
  
  // Cancel pending registration (DB)
  const cancelPendingRegistration = async () => {
    if (!registrationId) return
    
    try {
      setRegistrationId(null)
      setRegistrationCode(null)
      setPaymentExpiresAt(null)
      await cancelRegistration(registrationId)
    } catch (error) {
      console.error('Error canceling registration:', error)
    }
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
  const getErrorMessage = (error, defaultMessage) => {
    if (isNetworkError(error)) {
      return 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.'
    }
    
    if (error?.message) {
      // Map common error codes to user-friendly messages
      const errorMessages = {
        'PGRST116': 'Không tìm thấy dữ liệu. Vui lòng thử lại.',
        '23505': 'Dữ liệu đã tồn tại. Vui lòng thử lại.',
        '23503': 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
        '42501': 'Không có quyền thực hiện thao tác này.',
        'TIMEOUT': 'Yêu cầu quá thời gian. Vui lòng thử lại.',
        'Event is full': 'Sự kiện đã hết chỗ. Vui lòng chọn sự kiện khác.'
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

  const handleSummaryContinue = async (info, qty) => {
    setCustomerInfo(info)
    setQuantity(qty)
    setBookingError(null)
    setRetryCount(0)
    
    // Check event status before proceeding
    if (eventStatus === 'cancelled') {
      setBookingError('Sự kiện này đã bị hủy. Vui lòng chọn sự kiện khác.')
      return
    }
    
    // Check if event is full (use latest eventData from real-time updates)
    const maxParticipants = eventData?.max_participants || eventData?.maxParticipants || event?.max_participants || event?.maxParticipants || 0
    const currentParticipants = eventData?.current_participants || eventData?.currentParticipants || event?.current_participants || event?.currentParticipants || 0
    const availableSlots = Math.max(0, maxParticipants - currentParticipants)
    
    if (qty > availableSlots) {
      setBookingError(`Chỉ còn ${availableSlots} chỗ trống. Vui lòng giảm số lượng người tham gia.`)
      return
    }
    
    // Check network before proceeding
    if (!navigator.onLine) {
      setNetworkError(true)
      setBookingError('Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
      return
    }
    
    try {
      let latestEventFromDb = null
      // Double-check available slots before creating registration (handle race condition)
      // Only check if event has database ID (not mock data)
      if (event.id && event.id.startsWith && !event.id.startsWith('evt-')) {
        try {
          const latestEventData = await getEventById(event.id)
          latestEventFromDb = latestEventData
          const maxParticipants = latestEventData.max_participants || latestEventData.maxParticipants || 0
          const currentParticipants = latestEventData.current_participants || latestEventData.currentParticipants || 0
          const availableSlots = Math.max(0, maxParticipants - currentParticipants)
          
          // Check if event is cancelled
          if (latestEventData.status === 'cancelled') {
            setBookingError('Sự kiện này đã bị hủy. Vui lòng chọn sự kiện khác.')
            return
          }
          
          // Check if event is full
          if (availableSlots <= 0) {
            setBookingError('Sự kiện này đã hết chỗ. Vui lòng chọn sự kiện khác.')
            // Update eventData to reflect latest state
            setEventData(prev => ({ ...prev, ...latestEventData }))
            return
          }
          
          // Check if user selected more than available
          if (qty > availableSlots) {
            setBookingError(`Chỉ còn ${availableSlots} chỗ trống. Vui lòng giảm số lượng người tham gia.`)
            // Auto-adjust quantity
            setQuantity(availableSlots)
            return
          }
          
          // Update eventData with latest data
          setEventData(prev => ({ ...prev, ...latestEventData }))
        } catch (error) {
          console.error('Error checking event availability:', error)
          // If error checking, still allow to proceed (fallback to optimistic approach)
          // But log the error for monitoring
        }
      }
      
      // Create booking in DB so QR/polling can work with real records
      if (!user?.id) {
        setBookingError('Bạn cần đăng nhập để tiếp tục thanh toán.')
        return
      }

      const createdReg = await createEventRegistration({
        event_id: (latestEventFromDb || eventData || event).id,
        user_id: user.id,
        participant_name: info.name,
        participant_email: info.email,
        participant_phone: info.phone,
        amount: total,
        payment_status: total > 0 ? 'pending' : 'completed',
      })

      setRegistrationId(createdReg.id)
      setRegistrationCode(createdReg.registration_code)
      setPaymentExpiresAt(new Date(Date.now() + 15 * 60 * 1000).toISOString())

      if (total > 0) {
        setCurrentStep(STEPS.PAYMENT)
      } else {
        setPaymentResult({ success: true, message: 'Miễn phí' })
        setCurrentStep(STEPS.CONFIRMATION)
      }
    } catch (error) {
      console.error('Error in handleSummaryContinue:', error)
      const errorMessage = getErrorMessage(error, 'Không thể tạo mã đăng ký. Vui lòng thử lại.')
      setBookingError(errorMessage)
    }
  }
  
  // Retry booking creation
  const retryBooking = async () => {
    if (retryCount >= 3) {
      setBookingError('Đã thử lại quá nhiều lần. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.')
      return
    }
    
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)
    setBookingError(null)
    
    try {
      // Wait a bit before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.min(1000 * Math.pow(2, retryCount), 5000)))
      
      // Retry the operation
      if (!user?.id) {
        setBookingError('Bạn cần đăng nhập để tiếp tục thanh toán.')
        return
      }

      const latest = (event?.id && event.id.startsWith && !event.id.startsWith('evt-'))
        ? await getEventById(event.id)
        : null
      if (latest) setEventData(prev => ({ ...prev, ...latest }))

      const createdReg = await createEventRegistration({
        event_id: (latest || eventData || event).id,
        user_id: user.id,
        participant_name: customerInfo.name,
        participant_email: customerInfo.email,
        participant_phone: customerInfo.phone,
        amount: total,
        payment_status: total > 0 ? 'pending' : 'completed',
      })

      setRegistrationId(createdReg.id)
      setRegistrationCode(createdReg.registration_code)
      setPaymentExpiresAt(new Date(Date.now() + 15 * 60 * 1000).toISOString())
      setCurrentStep(total > 0 ? STEPS.PAYMENT : STEPS.CONFIRMATION)
      setRetryCount(0)
    } catch (error) {
      console.error('Retry booking failed:', error)
      const errorMessage = getErrorMessage(error, 'Không thể tạo mã đăng ký. Vui lòng thử lại.')
      setBookingError(errorMessage)
    } finally {
      setIsRetrying(false)
    }
  }

  const handlePayment = async (method, amount) => {
    setPaymentMethod(method)
    setPaymentError(null)
    setShowPaymentSuccess(false)
    
    // Check network before proceeding
    if (!navigator.onLine) {
      setNetworkError(true)
      setPaymentError('Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
      setPaymentResult({
        success: false,
        message: 'Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.'
      })
      return
    }
    
    try {
      // For QR, success must be based on DB status (payments.status === 'completed')
      let result
      if (method === 'qr') {
        const status = await checkEventRegistrationPaymentStatus(registrationCode, amount)
        result = {
          success: !!status.success,
          transactionId: status.payment?.transaction_id || null,
          bookingId: registrationCode,
          amount,
          paymentMethod: method,
          timestamp: status.payment?.completed_at || new Date().toISOString(),
          message: status.message || (status.success ? 'Thanh toán thành công' : 'Đang chờ thanh toán...'),
        }

        if (status.amountMismatch) {
          result.success = false
          result.message = status.message
        }
      } else {
        // Fallback (wallet/card): current project still simulates payment
        const bookingUtils = await import('../../utils/booking')
        result = await bookingUtils.processPayment(method, amount, registrationId)
      }
      setPaymentResult(result)
      
      if (result.success) {
        // Mark registration as confirmed to prevent cleanup cancellation
        setIsRegistrationConfirmed(true)
        console.log('✅ Event registration confirmed, marked to prevent cleanup cancel')
        
        // Send confirmations (with error handling)
        const registration = {
          registrationId,
          event,
          quantity,
          total: amount,
          customerInfo,
          paymentMethod: method
        }
        
        // Send email (non-blocking, don't fail if email fails)
        sendEmailConfirmation({ ...registration, customerEmail: customerInfo.email })
          .catch(err => console.error('Failed to send email:', err))
        
        // Send SMS (non-blocking, don't fail if SMS fails)
        sendSMSConfirmation({ ...registration, customerPhone: customerInfo.phone })
          .catch(err => console.error('Failed to send SMS:', err))
        
        // Schedule reminder (non-blocking)
        scheduleReminder(event, registration)

        // Show "payment success" briefly, then move to confirmation/thank you
        setShowPaymentSuccess(true)
        if (successTimerRef.current) clearTimeout(successTimerRef.current)
        successTimerRef.current = setTimeout(() => {
          setShowPaymentSuccess(false)
          setCurrentStep(STEPS.CONFIRMATION)
        }, 1200)
      } else {
        // Payment failed
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
      
      const currentEvent = eventData || event
      const total = (currentEvent.price || 0) * quantity
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
    if (currentStep === STEPS.PAYMENT) {
      // Back from Payment: Clear registration if exists and show confirmation
      if (registrationId) {
        const confirmed = window.confirm(
          'Bạn có chắc muốn quay lại? Đăng ký đã tạo sẽ bị hủy.'
        )
        if (!confirmed) return
        
        await cancelPendingRegistration()
      }
    }
    
    if (currentStep > STEPS.SUMMARY) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleClose = async () => {
    if (currentStep === STEPS.CONFIRMATION) {
      // Already confirmed, just close
      onClose()
      return
    }
    
    // Show confirmation dialog
    const confirmed = window.confirm('Bạn có chắc muốn hủy đăng ký? Tất cả thông tin sẽ bị mất.')
    if (!confirmed) return
    
    // Cleanup: Cancel registration
    await cancelPendingRegistration()
    
    // Clear all state
    setQuantity(1)
    setCustomerInfo({ name: '', email: '', phone: '', notes: '' })
    setPaymentMethod(null)
    setPaymentResult(null)
    setRegistrationId(null)
    setRegistrationCode(null)
    setPaymentExpiresAt(null)
    setBookingError(null)
    setPaymentError(null)
    
    onClose()
  }
  
  // Handle QR payment timeout
  const handleQRTimeout = async () => {
    setPaymentError('Mã QR đã hết hạn. Vui lòng tạo lại mã QR mới.')
    // Registration can be cancelled in PaymentMethod; clear local state
    setRegistrationId(null)
    setRegistrationCode(null)
    setPaymentExpiresAt(null)
  }

  if (!isOpen || !event) return null

  // Use latest eventData for price calculation
  const currentEvent = eventData || event
  const total = (currentEvent.price || 0) * quantity

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
            <div className={`progress-step ${currentStep >= STEPS.SUMMARY ? 'active' : ''} ${currentStep > STEPS.SUMMARY ? 'completed' : ''}`}>
              <div className="step-number">1</div>
              <div className="step-label">Thông tin</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.PAYMENT ? 'active' : ''} ${currentStep > STEPS.PAYMENT ? 'completed' : ''}`}>
              <div className="step-number">2</div>
              <div className="step-label">Thanh toán</div>
            </div>
            <div className={`progress-step ${currentStep >= STEPS.CONFIRMATION ? 'active' : ''} ${currentStep > STEPS.CONFIRMATION ? 'completed' : ''}`}>
              <div className="step-number">3</div>
              <div className="step-label">Xác nhận</div>
            </div>
          </div>

          {/* Step Content */}
          <div className="booking-content">
            {currentStep === STEPS.PAYMENT && showPaymentSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="booking-success-banner"
              >
                ✅ Thanh toán thành công! Đang chuyển sang bước xác nhận...
              </motion.div>
            )}
            {/* Show event info at the top for all steps */}
            <div className="event-info-header">
              <h3>{(eventData || event).title}</h3>
              <div className="event-info-meta">
                <span>📅 {new Date((eventData || event).event_date || (eventData || event).date).toLocaleString('vi-VN')}</span>
                <span>📍 {(eventData || event).venue?.name || (eventData || event).venue_name}, {(eventData || event).venue?.city || (eventData || event).city}</span>
              </div>
            </div>

            {currentStep === STEPS.SUMMARY && (
              <>
                {/* Event Status Error */}
                {eventStatus === 'cancelled' && (
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
                    ⚠️ Sự kiện này đã bị hủy. Vui lòng chọn sự kiện khác.
                  </motion.div>
                )}
                
                {/* Session Warning Banner */}
                {sessionWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="session-warning-banner"
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
                    ⚠️ Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để tiếp tục đăng ký.
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
                      <strong>Lỗi đăng ký</strong>
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
                
                <EventBookingSummary
                  event={eventData || event}
                  quantity={quantity}
                  total={total}
                  customerInfo={customerInfo}
                  onInfoChange={setCustomerInfo}
                  onQuantityChange={setQuantity}
                  onContinue={handleSummaryContinue}
                  onBack={handleBack}
                />
              </>
            )}

            {currentStep === STEPS.PAYMENT && (
              <PaymentMethod
                total={total}
                bookingId={registrationCode} // reference code for transfer_content
                paymentContext={{
                  type: 'event',
                  eventRegistrationId: registrationId,
                  referenceCode: registrationCode,
                  expiresAt: paymentExpiresAt,
                  userId: user?.id || null,
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
              <EventConfirmation
                registrationId={registrationId}
                event={eventData || event}
                quantity={quantity}
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
