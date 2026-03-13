import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '../../utils/booking'
import { validatePayment } from '../../utils/validation'
import { generateStaticQR } from '../../services/qrPaymentService'
import { checkPaymentStatus, checkEventRegistrationPaymentStatus, createPaymentRecord, completeEventPayment, completeBookingPayment } from '../../services/paymentService'
import { cancelBooking } from '../../services/bookingService'
import './booking.css'

const QR_PAYMENT_TIMEOUT = 15 * 60 * 1000 // 15 phút

const PAYMENT_METHODS = [
  {
    id: 'wallet',
    name: 'Ví điện tử',
    icon: '💳',
    description: 'Ví Momo, ZaloPay, ShopeePay',
    color: '#4ECDC4'
  },
  {
    id: 'card',
    name: 'Thẻ tín dụng/Ghi nợ',
    icon: '💳',
    description: 'Visa, Mastercard, JCB',
    color: '#FF6B6B'
  },
  {
    id: 'qr',
    name: 'QR Code',
    icon: '📱',
    description: 'Quét mã QR để thanh toán',
    color: '#95E1D3'
  }
]

export default function PaymentMethod({ 
  total, 
  bookingId, 
  bookingDbId,
  bookingExpiresAt,
  userId,
  paymentContext,
  onPayment, 
  onBack, 
  paymentResult,
  paymentError: externalPaymentError,
  networkError,
  onRetryPayment,
  isRetrying,
  retryCount,
  onTimeout // Callback khi QR timeout
}) {
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  const [qrRetryCount, setQrRetryCount] = useState(0)
  const [isConfirmingTransfer, setIsConfirmingTransfer] = useState(false)

  // QR Code states
  const [qrData, setQrData] = useState(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const pollingIntervalRef = useRef(null)
  const lastPaymentStatusRef = useRef(null)
  const fakeSuccessTimeoutRef = useRef(null)
  const fakeBookingSuccessTimeoutRef = useRef(null)
  
  // QR Timeout states
  const [timeRemaining, setTimeRemaining] = useState(QR_PAYMENT_TIMEOUT)
  const [isTimeout, setIsTimeout] = useState(false)
  const timeoutTimerRef = useRef(null)
  const qrStartTimeRef = useRef(null)

  // Generate QR code when QR method is selected
  useEffect(() => {
    if (selectedMethod === 'qr' && total > 0 && bookingId && !qrData) {
      generateQRCode()
    }
    
    // Cleanup when component unmounts or method changes
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      if (fakeSuccessTimeoutRef.current) {
        clearTimeout(fakeSuccessTimeoutRef.current)
        fakeSuccessTimeoutRef.current = null
      }
      if (fakeBookingSuccessTimeoutRef.current) {
        clearTimeout(fakeBookingSuccessTimeoutRef.current)
        fakeBookingSuccessTimeoutRef.current = null
      }
      if (timeoutTimerRef.current) {
        clearInterval(timeoutTimerRef.current)
        timeoutTimerRef.current = null
      }
    }
  }, [selectedMethod, total, bookingId])
  
  // Fake auto-complete for event QR payments after 30s (demo mode)
  useEffect(() => {
    if (
      paymentContext?.type === 'event' &&
      selectedMethod === 'qr' &&
      qrData &&
      !paymentStatus?.success &&
      !isTimeout
    ) {
      if (fakeSuccessTimeoutRef.current) {
        clearTimeout(fakeSuccessTimeoutRef.current)
      }

      fakeSuccessTimeoutRef.current = setTimeout(async () => {
        try {
          if (!paymentContext?.eventRegistrationId) return
          const result = await completeEventPayment(paymentContext.eventRegistrationId)
          if (result.success) {
            const successStatus = { success: true, message: 'Thanh toán thành công (giả lập sau 30 giây).' }
            setPaymentStatus(successStatus)
            lastPaymentStatusRef.current = successStatus
            await onPayment('qr', total, { alreadyCompleted: true })
          }
        } catch (error) {
          console.error('Fake auto-complete payment error:', error)
        }
      }, 30000)

      return () => {
        if (fakeSuccessTimeoutRef.current) {
          clearTimeout(fakeSuccessTimeoutRef.current)
          fakeSuccessTimeoutRef.current = null
        }
      }
    }

    if (fakeSuccessTimeoutRef.current) {
      clearTimeout(fakeSuccessTimeoutRef.current)
      fakeSuccessTimeoutRef.current = null
    }
  }, [paymentContext?.type, paymentContext?.eventRegistrationId, selectedMethod, qrData, paymentStatus?.success, isTimeout, total, onPayment])

  // Fake thanh toán thành công sau 20s cho đặt vé (booking QR)
  const FAKE_BOOKING_PAYMENT_DELAY_MS = 20000
  useEffect(() => {
    if (
      paymentContext?.type === 'booking' &&
      paymentContext?.bookingDbId &&
      selectedMethod === 'qr' &&
      qrData &&
      !paymentStatus?.success &&
      !isTimeout
    ) {
      if (fakeBookingSuccessTimeoutRef.current) {
        clearTimeout(fakeBookingSuccessTimeoutRef.current)
      }

      fakeBookingSuccessTimeoutRef.current = setTimeout(async () => {
        try {
          const result = await completeBookingPayment(paymentContext.bookingDbId)
          if (result.success) {
            const successStatus = {
              success: true,
              message: 'Thanh toán thành công (giả lập sau 20 giây).',
            }
            setPaymentStatus(successStatus)
            lastPaymentStatusRef.current = successStatus
            await onPayment('qr', total, { alreadyCompleted: true })
          } else {
            setPaymentError(result.message || 'Không thể hoàn tất thanh toán.')
          }
        } catch (error) {
          console.error('Fake booking payment error:', error)
          setPaymentError('Có lỗi khi xác nhận thanh toán. Vui lòng thử lại.')
        }
      }, FAKE_BOOKING_PAYMENT_DELAY_MS)

      return () => {
        if (fakeBookingSuccessTimeoutRef.current) {
          clearTimeout(fakeBookingSuccessTimeoutRef.current)
          fakeBookingSuccessTimeoutRef.current = null
        }
      }
    }

    if (
      paymentContext?.type === 'booking' &&
      fakeBookingSuccessTimeoutRef.current &&
      (paymentStatus?.success || isTimeout)
    ) {
      clearTimeout(fakeBookingSuccessTimeoutRef.current)
      fakeBookingSuccessTimeoutRef.current = null
    }
  }, [paymentContext?.type, paymentContext?.bookingDbId, selectedMethod, qrData, paymentStatus?.success, isTimeout, total, onPayment])
  
  // QR Timeout countdown timer
  useEffect(() => {
    if (selectedMethod === 'qr' && qrData && !paymentStatus?.success && !isTimeout) {
      // Reset timer when QR is generated
      if (!qrStartTimeRef.current) {
        qrStartTimeRef.current = Date.now()
        setTimeRemaining(QR_PAYMENT_TIMEOUT)
      }
      
      // Start countdown timer
      timeoutTimerRef.current = setInterval(() => {
        const elapsed = Date.now() - qrStartTimeRef.current
        const remaining = Math.max(0, QR_PAYMENT_TIMEOUT - elapsed)
        setTimeRemaining(remaining)
        
        if (remaining <= 0) {
          setIsTimeout(true)
          handleQRTimeout()
        }
      }, 1000)
      
      return () => {
        if (timeoutTimerRef.current) {
          clearInterval(timeoutTimerRef.current)
          timeoutTimerRef.current = null
        }
      }
    } else if (paymentStatus?.success || isTimeout) {
      // Stop timer when payment successful or timeout
      if (timeoutTimerRef.current) {
        clearInterval(timeoutTimerRef.current)
        timeoutTimerRef.current = null
      }
    }
  }, [selectedMethod, qrData, paymentStatus?.success, isTimeout])
  
  // Handle QR timeout
  const handleQRTimeout = async () => {
    if (!bookingId) return
    
    try {
      // Cancel booking
      const bookingUuid = paymentContext?.type === 'booking'
        ? paymentContext.bookingDbId
        : bookingDbId
      if (bookingUuid) await cancelBooking(bookingUuid)
      
      // Stop polling
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      
      // Notify parent component
      if (onTimeout) {
        onTimeout()
      }
      
      setPaymentError('Mã QR đã hết hạn (15 phút). Vui lòng tạo lại mã QR mới.')
    } catch (error) {
      console.error('Error canceling booking on timeout:', error)
      setPaymentError('Đã hết thời gian thanh toán. Vui lòng thử lại.')
    }
  }

  // Poll payment status when QR is displayed
  useEffect(() => {
    if (selectedMethod === 'qr' && qrData && !paymentStatus?.success && !networkError) {
      // Start polling every 5 seconds
      const interval = setInterval(async () => {
        await checkPayment(0) // Start with retryCount 0
      }, 5000)
      
      pollingIntervalRef.current = interval
      
      return () => {
        if (interval) clearInterval(interval)
      }
    } else if (paymentStatus?.success && pollingIntervalRef.current) {
      // Stop polling when payment successful
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    } else if (networkError && pollingIntervalRef.current) {
      // Stop polling when network error
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, qrData, paymentStatus?.success, networkError])

  // Helper to check network error
  const isNetworkError = (error) => {
    if (!navigator.onLine) return true
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) return true
    if (error?.code === 'NETWORK_ERROR' || error?.code === 'ECONNABORTED') return true
    return false
  }

  const generateQRCode = async (isRetry = false) => {
    setIsGeneratingQR(true)
    setPaymentError(null)
    
    // Check network
    if (!navigator.onLine) {
      setPaymentError('Không có kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
      setIsGeneratingQR(false)
      return
    }
    
    try {
      const qr = await generateStaticQR(bookingId, total)

      // Create payment record in DB so webhook/checkPaymentStatus can work
      if (paymentContext?.type === 'event' && paymentContext?.eventRegistrationId) {
        const expiresAt = paymentContext?.expiresAt
          ? new Date(paymentContext.expiresAt).toISOString()
          : new Date(Date.now() + QR_PAYMENT_TIMEOUT).toISOString()

        await createPaymentRecord({
          event_registration_id: paymentContext.eventRegistrationId,
          user_id: paymentContext.userId || userId || null,
          amount: total,
          payment_method: 'qr',
          status: 'pending',
          transfer_content: qr.transferContent,
          bank_account_no: qr.bankInfo?.accountNo,
          bank_account_name: qr.bankInfo?.accountName,
          bank_code: qr.bankInfo?.bankCode,
          expires_at: expiresAt,
          qr_code_url: qr.qrImageUrl,
        })
      } else if (bookingDbId) {
        const expiresAt = bookingExpiresAt
          ? new Date(bookingExpiresAt).toISOString()
          : new Date(Date.now() + QR_PAYMENT_TIMEOUT).toISOString()

        await createPaymentRecord({
          booking_id: bookingDbId,
          user_id: userId || null,
          amount: total,
          payment_method: 'qr',
          status: 'pending',
          transfer_content: qr.transferContent,
          bank_account_no: qr.bankInfo?.accountNo,
          bank_account_name: qr.bankInfo?.accountName,
          bank_code: qr.bankInfo?.bankCode,
          expires_at: expiresAt,
          qr_code_url: qr.qrImageUrl,
        })
      }

      setQrData(qr)
      setQrRetryCount(0) // Reset retry count on success
      setIsTimeout(false) // Reset timeout state
      qrStartTimeRef.current = Date.now() // Reset start time
      const expiry = paymentContext?.expiresAt || bookingExpiresAt
      if (expiry) {
        const remaining = Math.max(0, new Date(expiry).getTime() - Date.now())
        setTimeRemaining(remaining)
      } else {
        setTimeRemaining(QR_PAYMENT_TIMEOUT) // Reset timer
      }
    } catch (error) {
      console.error('Error generating QR:', error)

      if (error?.code === '42501' || String(error?.message || '').toLowerCase().includes('permission')) {
        setPaymentError('Không có quyền tạo thanh toán (RLS 42501). Hãy kiểm tra policy cho bảng payments/event_registrations trên Supabase.')
      } else if (isNetworkError(error)) {
        setPaymentError('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.')
      } else {
        setPaymentError('Không thể tạo mã QR. Vui lòng thử lại.')
      }
      
      // Auto-retry with exponential backoff (max 3 times)
      if (!isRetry && qrRetryCount < 3) {
        const delay = Math.min(1000 * Math.pow(2, qrRetryCount), 5000)
        setTimeout(() => {
          setQrRetryCount(prev => prev + 1)
          generateQRCode(true)
        }, delay)
      }
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const checkPayment = async (retryCount = 0) => {
    if (isCheckingPayment) return
    
    // Check network
    if (!navigator.onLine) {
      console.warn('Network offline, skipping payment check')
      return
    }
    
    setIsCheckingPayment(true)
    try {
      // Use correct check function based on payment context
      const isEventPayment = paymentContext?.type === 'event' && paymentContext?.eventRegistrationId
      const status = isEventPayment
        ? await checkEventRegistrationPaymentStatus(paymentContext.referenceCode || bookingId, total)
        : await checkPaymentStatus(bookingId, total)

      // Check for amount mismatch
      if (status.amountMismatch) {
        setPaymentError(status.message)
        setPaymentStatus({ success: false, message: status.message })
        return
      }
      
      // Only update state if success status actually changed
      const hasChanged = lastPaymentStatusRef.current?.success !== status.success
      
      if (hasChanged) {
        setPaymentStatus(status)
        lastPaymentStatusRef.current = status
        
        if (status.success) {
          await onPayment('qr', total, { alreadyCompleted: true })
        }
      }
    } catch (error) {
      console.error('Error checking payment:', error)
      
      if (retryCount < 3 && isNetworkError(error)) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
        setTimeout(() => { checkPayment(retryCount + 1) }, delay)
      } else if (retryCount >= 3) {
        setPaymentError('Không thể kiểm tra trạng thái thanh toán. Vui lòng thử lại sau.')
      }
    } finally {
      setIsCheckingPayment(false)
    }
  }

  // Called when user clicks "Tôi đã chuyển khoản" (event QR only)
  const handleConfirmTransfer = async () => {
    if (isConfirmingTransfer || !paymentContext?.eventRegistrationId) return
    setIsConfirmingTransfer(true)
    setPaymentError(null)

    try {
      const result = await completeEventPayment(paymentContext.eventRegistrationId)
      if (result.success) {
        const successStatus = { success: true, message: 'Thanh toán thành công!' }
        setPaymentStatus(successStatus)
        lastPaymentStatusRef.current = successStatus
        await onPayment('qr', total, { alreadyCompleted: true })
      } else {
        setPaymentError(result.message || 'Không thể xác nhận thanh toán. Vui lòng thử lại.')
      }
    } catch (err) {
      setPaymentError('Lỗi xác nhận thanh toán. Vui lòng thử lại.')
    } finally {
      setIsConfirmingTransfer(false)
    }
  }

  const copyTransferContent = () => {
    if (qrData?.transferContent) {
      navigator.clipboard.writeText(qrData.transferContent)
      alert('Đã copy nội dung chuyển khoản!')
    }
  }

  const handlePayment = async () => {
    if (selectedMethod === 'qr') {
      // QR payment is handled automatically by polling
      return
    }
    // Validate payment
    const validation = validatePayment(selectedMethod, total)
    if (!validation.valid) {
      setPaymentError(Object.values(validation.errors)[0])
      return
    }

    setPaymentError(null)
    setIsProcessing(true)
    await onPayment(selectedMethod, total)
    setIsProcessing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="step-content payment-method"
    >
      <h2>Chọn Phương Thức Thanh Toán</h2>
      <p className="step-description">Chọn phương thức thanh toán phù hợp với bạn</p>

      <div className="payment-methods-grid">
        {PAYMENT_METHODS.map(method => (
          <motion.button
            key={method.id}
            className={`payment-method-card ${selectedMethod === method.id ? 'selected' : ''}`}
            onClick={() => setSelectedMethod(method.id)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{ borderColor: selectedMethod === method.id ? method.color : '#e0e0e0' }}
          >
            <div className="payment-icon" style={{ color: method.color }}>
              {method.icon}
            </div>
            <h3>{method.name}</h3>
            <p>{method.description}</p>
            {selectedMethod === method.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="selected-check"
              >
                ✓
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>

      {/* QR Code Display */}
      {selectedMethod === 'qr' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="qr-display"
        >
          <h4>Quét mã QR để thanh toán</h4>
          
          {isGeneratingQR ? (
            <div className="qr-loading">
              <div className="spinner"></div>
              <p>Đang tạo mã QR...</p>
            </div>
          ) : qrData ? (
            <>
              {/* Countdown Timer */}
              {!isTimeout && (
                <QRCountdownTimer 
                  timeRemaining={timeRemaining}
                  isWarning={timeRemaining < 60 * 1000} // Warning khi < 1 phút
                />
              )}
              
              {/* Timeout Message */}
              {isTimeout && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="qr-timeout-message"
                  style={{
                    padding: '1rem',
                    background: '#fff1f2',
                    border: '2px solid #f44336',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    textAlign: 'center',
                    color: '#c62828',
                    fontWeight: 600
                  }}
                >
                  ⏰ Mã QR đã hết hạn. Vui lòng tạo lại mã QR mới.
                </motion.div>
              )}
              
              <QRCodeDisplay 
                qrImage={qrData.qrImage}
                bankInfo={qrData.bankInfo}
                transferContent={qrData.transferContent}
                amount={qrData.amount}
                paymentStatus={paymentStatus}
                onCopy={copyTransferContent}
                isTimeout={isTimeout}
              />

              {/* "Tôi đã chuyển khoản" button: only for event payments, when not yet confirmed, not timed out */}
              {paymentContext?.type === 'event' && !isTimeout && !paymentStatus?.success && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center', marginTop: '1.5rem' }}
                >
                  <button
                    type="button"
                    onClick={handleConfirmTransfer}
                    disabled={isConfirmingTransfer}
                    className="btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.85rem 2rem',
                      fontSize: '1rem',
                      cursor: isConfirmingTransfer ? 'not-allowed' : 'pointer',
                      opacity: isConfirmingTransfer ? 0.7 : 1,
                    }}
                  >
                    {isConfirmingTransfer ? (
                      <><span className="spinner" /> Đang xác nhận...</>
                    ) : (
                      '✅ Tôi đã chuyển khoản xong'
                    )}
                  </button>
                  <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'rgba(248,250,252,0.55)' }}>
                    Bấm sau khi chuyển khoản thành công để hệ thống xác nhận đăng ký
                  </p>
                </motion.div>
              )}

              {/* Regenerate QR Button when timeout */}
              {isTimeout && (
                <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                  <button
                    onClick={() => {
                      setIsTimeout(false)
                      setQrData(null)
                      qrStartTimeRef.current = null
                      setTimeRemaining(QR_PAYMENT_TIMEOUT)
                      generateQRCode(false)
                    }}
                    style={{
                      padding: '0.75rem 2rem',
                      background: '#f44336',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '1rem'
                    }}
                  >
                    🔄 Tạo lại mã QR
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="qr-error" style={{
              padding: '1.5rem',
              textAlign: 'center',
              background: '#fff1f2',
              border: '2px solid #f44336',
              borderRadius: '8px'
            }}>
              <p style={{ marginBottom: '1rem', color: '#c62828', fontWeight: 600 }}>
                ⚠️ Không thể tạo mã QR
              </p>
              {paymentError && (
                <p style={{ marginBottom: '1rem', color: '#666' }}>{paymentError}</p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                <button 
                  onClick={() => {
                    setQrRetryCount(0)
                    generateQRCode(false)
                  }}
                  disabled={isGeneratingQR || qrRetryCount >= 3}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: qrRetryCount >= 3 ? '#999' : '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: qrRetryCount >= 3 ? 'not-allowed' : 'pointer',
                    fontWeight: 600
                  }}
                >
                  {isGeneratingQR ? 'Đang tạo...' : qrRetryCount >= 3 ? 'Đã thử quá nhiều lần' : `Thử lại (${qrRetryCount}/3)`}
                </button>
                {qrRetryCount >= 3 && (
                  <button
                    onClick={() => {
                      setPaymentError(null)
                      setQrRetryCount(0)
                    }}
                    style={{
                      padding: '0.5rem 1.5rem',
                      background: '#666',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Đóng
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Payment Summary */}
      <div className="payment-summary">
        <div className="payment-summary-row">
          <span>Tổng thanh toán:</span>
          <span className="payment-total">{formatPrice(total)}</span>
        </div>
        <div className="payment-summary-row">
          <span>Mã đặt vé:</span>
          <span className="booking-id">{bookingId}</span>
        </div>
      </div>

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

      {/* Error Messages */}
      <AnimatePresence>
        {(paymentError || externalPaymentError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="payment-error"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>⚠️</span>
              <span>{paymentError || externalPaymentError}</span>
            </div>
            {onRetryPayment && retryCount < 3 && (
              <button
                onClick={onRetryPayment}
                disabled={isRetrying}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isRetrying ? 'not-allowed' : 'pointer',
                  opacity: isRetrying ? 0.6 : 1,
                  alignSelf: 'flex-start'
                }}
              >
                {isRetrying ? 'Đang thử lại...' : `Thử lại (${retryCount}/3)`}
              </button>
            )}
          </motion.div>
        )}
        {paymentResult && !paymentResult.success && !paymentError && !externalPaymentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="payment-error"
          >
            <span>⚠️</span>
            <span>{paymentResult.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <div className="step-navigation">
        <button 
          className="btn-secondary" 
          onClick={onBack} 
          disabled={isProcessing || selectedMethod === 'qr'}
        >
          ← Quay lại
        </button>
        {selectedMethod !== 'qr' && (
          <button
            className="btn-primary"
            onClick={handlePayment}
            disabled={!selectedMethod || isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="spinner"></span>
                Đang xử lý...
              </>
            ) : (
              'Xác nhận thanh toán →'
            )}
          </button>
        )}
      </div>
    </motion.div>
  )
}

// QR Countdown Timer Component
const QRCountdownTimer = memo(({ timeRemaining, isWarning }) => {
  const minutes = Math.floor(timeRemaining / 60000)
  const seconds = Math.floor((timeRemaining % 60000) / 1000)
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="qr-countdown-timer"
      style={{
        padding: '1rem',
        background: isWarning ? '#fff3cd' : '#e3f2fd',
        border: `2px solid ${isWarning ? '#ffc107' : '#2196f3'}`,
        borderRadius: '8px',
        marginBottom: '1rem',
        textAlign: 'center',
        fontWeight: 600,
        color: isWarning ? '#856404' : '#1565c0',
        fontSize: '1.1rem'
      }}
    >
      {isWarning ? '⚠️' : '⏰'} Thời gian còn lại: <strong>{formattedTime}</strong>
      {isWarning && <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Vui lòng hoàn tất thanh toán sớm!</div>}
    </motion.div>
  )
})

QRCountdownTimer.displayName = 'QRCountdownTimer'

// Memoized QR Code Display Component để tránh re-render không cần thiết
const QRCodeDisplay = memo(({ qrImage, bankInfo, transferContent, amount, paymentStatus, onCopy, isTimeout }) => {
  return (
    <>
      <div className="qr-code-container" style={{ opacity: isTimeout ? 0.5 : 1 }}>
        <img src={qrImage} alt="QR Code" className="qr-code-image" />
        {isTimeout && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '1rem',
            borderRadius: '8px',
            fontWeight: 600
          }}>
            Đã hết hạn
          </div>
        )}
      </div>
      
      <div className="qr-bank-info">
        <h5>Thông tin chuyển khoản:</h5>
        <div className="bank-info-item">
          <span className="label">Ngân hàng:</span>
          <span className="value">{bankInfo.bankName}</span>
        </div>
        <div className="bank-info-item">
          <span className="label">Số tài khoản:</span>
          <span className="value">{bankInfo.accountNo}</span>
        </div>
        <div className="bank-info-item">
          <span className="label">Chủ tài khoản:</span>
          <span className="value">{bankInfo.accountName}</span>
        </div>
        <div className="bank-info-item">
          <span className="label">Số tiền:</span>
          <span className="value amount">{formatPrice(amount)}</span>
        </div>
        <div className="bank-info-item">
          <span className="label">Nội dung CK:</span>
          <span className="value transfer-content" onClick={onCopy} title="Click để copy">
            {transferContent}
            <span className="copy-icon">📋</span>
          </span>
        </div>
      </div>
      
      <div className="qr-instructions">
        <p className="qr-instruction-title">Hướng dẫn thanh toán:</p>
        <ol className="qr-instruction-list">
          <li>Mở app ngân hàng hoặc ví điện tử (Momo, ZaloPay...)</li>
          <li>Quét mã QR hoặc chuyển khoản với thông tin trên</li>
          <li>Nhập đúng nội dung chuyển khoản: <strong>{transferContent}</strong></li>
          <li>Xác nhận thanh toán</li>
          <li>Hệ thống sẽ tự động kiểm tra và xác nhận (5-10 giây)</li>
        </ol>
      </div>
      
      {paymentStatus && (
        <div className={`qr-status ${paymentStatus.success ? 'success' : 'pending'}`}>
          {paymentStatus.success ? (
            <>
              <span className="status-icon">✅</span>
              <span>Thanh toán thành công!</span>
            </>
          ) : (
            <>
              <span className="status-icon">⏳</span>
              <span>Đang chờ thanh toán...</span>
            </>
          )}
        </div>
      )}
    </>
  )
})

QRCodeDisplay.displayName = 'QRCodeDisplay'
