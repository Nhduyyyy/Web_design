import { useState, useEffect, useRef, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '../../utils/booking'
import { validatePayment } from '../../utils/validation'
import { generateStaticQR } from '../../services/qrPaymentService'
import { checkPaymentStatus } from '../../services/paymentService'
import './booking.css'

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

export default function PaymentMethod({ total, bookingId, onPayment, onBack, paymentResult }) {
  const [selectedMethod, setSelectedMethod] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [paymentError, setPaymentError] = useState(null)
  
  // QR Code states
  const [qrData, setQrData] = useState(null)
  const [isGeneratingQR, setIsGeneratingQR] = useState(false)
  const [isCheckingPayment, setIsCheckingPayment] = useState(false)
  const [paymentStatus, setPaymentStatus] = useState(null)
  const pollingIntervalRef = useRef(null)
  const lastPaymentStatusRef = useRef(null)

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
    }
  }, [selectedMethod, total, bookingId])

  // Poll payment status when QR is displayed
  useEffect(() => {
    if (selectedMethod === 'qr' && qrData && !paymentStatus?.success) {
      // Start polling every 5 seconds
      const interval = setInterval(async () => {
        await checkPayment()
      }, 5000)
      
      pollingIntervalRef.current = interval
      
      return () => {
        if (interval) clearInterval(interval)
      }
    } else if (paymentStatus?.success && pollingIntervalRef.current) {
      // Stop polling when payment successful
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMethod, qrData, paymentStatus?.success])

  const generateQRCode = async () => {
    setIsGeneratingQR(true)
    setPaymentError(null)
    try {
      const qr = await generateStaticQR(bookingId, total)
      setQrData(qr)
    } catch (error) {
      console.error('Error generating QR:', error)
      setPaymentError('Không thể tạo mã QR. Vui lòng thử lại.')
    } finally {
      setIsGeneratingQR(false)
    }
  }

  const checkPayment = async () => {
    if (isCheckingPayment) return
    
    try {
      const status = await checkPaymentStatus(bookingId)
      
      // Chỉ update state nếu có thay đổi thực sự (success status thay đổi)
      const hasChanged = lastPaymentStatusRef.current?.success !== status.success
      
      if (hasChanged) {
        setPaymentStatus(status)
        lastPaymentStatusRef.current = status
        
        if (status.success) {
          // Payment successful, trigger onPayment callback
          await onPayment('qr', total)
        }
      }
    } catch (error) {
      console.error('Error checking payment:', error)
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
            <QRCodeDisplay 
              qrImage={qrData.qrImage}
              bankInfo={qrData.bankInfo}
              transferContent={qrData.transferContent}
              amount={qrData.amount}
              paymentStatus={paymentStatus}
              onCopy={copyTransferContent}
            />
              
          ) : (
            <div className="qr-error">
              <p>Không thể tạo mã QR. Vui lòng thử lại.</p>
              <button onClick={generateQRCode}>Thử lại</button>
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

      {/* Error Messages */}
      <AnimatePresence>
        {paymentError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="payment-error"
          >
            <span>⚠️</span>
            <span>{paymentError}</span>
          </motion.div>
        )}
        {paymentResult && !paymentResult.success && (
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

// Memoized QR Code Display Component để tránh re-render không cần thiết
const QRCodeDisplay = memo(({ qrImage, bankInfo, transferContent, amount, paymentStatus, onCopy }) => {
  return (
    <>
      <div className="qr-code-container">
        <img src={qrImage} alt="QR Code" className="qr-code-image" />
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
