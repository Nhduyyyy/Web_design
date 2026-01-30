import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatPrice } from '../../utils/booking'
import { validatePayment } from '../../utils/validation'
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

  const handlePayment = async () => {
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
          <div className="qr-code-placeholder">
            <div className="qr-code">
              <div className="qr-pattern"></div>
              <div className="qr-text">QR Code</div>
              <div className="qr-amount">{formatPrice(total)}</div>
            </div>
          </div>
          <p className="qr-instruction">
            Mở app ví điện tử và quét mã QR này để thanh toán
          </p>
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
        <button className="btn-secondary" onClick={onBack} disabled={isProcessing}>
          ← Quay lại
        </button>
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
      </div>
    </motion.div>
  )
}
