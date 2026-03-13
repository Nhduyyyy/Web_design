import { motion } from 'framer-motion'
import { formatPrice } from '../../utils/booking'
import './booking.css'

export default function EventConfirmation({ 
  registrationId, 
  event, 
  quantity, 
  total, 
  customerInfo, 
  paymentMethod, 
  paymentResult, 
  onClose 
}) {
  const paymentMethodNames = {
    wallet: 'Ví điện tử',
    card: 'Thẻ tín dụng/Ghi nợ',
    qr: 'QR Code'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="step-content confirmation"
    >
      {paymentResult?.success || event.price === 0 ? (
        <>
          <div className="confirmation-success">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="success-icon"
            >
              ✓
            </motion.div>
            <h2>Đăng Ký Thành Công!</h2>
            <p className="success-message">
              Cảm ơn bạn đã đăng ký. Thông tin xác nhận đã được gửi đến email và SMS của bạn.
            </p>
          </div>

          <div className="confirmation-details">
            <div className="confirmation-section">
              <h3>Mã đăng ký</h3>
              <div className="booking-id-large">{registrationId}</div>
              <p className="booking-note">Vui lòng lưu mã này để tra cứu và tham gia sự kiện</p>
            </div>

            <div className="confirmation-section">
              <h3>Thông tin sự kiện</h3>
              <div className="info-grid">
                <div className="bg-background-dark">
                  <strong>Tên sự kiện:</strong>
                  <span>{event.title}</span>
                </div>
                <div className="bg-background-dark">
                  <strong>Ngày giờ:</strong>
                  <span>{new Date(event.event_date || event.date).toLocaleString('vi-VN')}</span>
                </div>
                <div className="bg-background-dark">
                  <strong>Địa điểm:</strong>
                  <span>{event.venue?.name || event.venue_name}</span>
                </div>
                <div className="bg-background-dark">
                  <strong>Địa chỉ:</strong>
                  <span>{event.venue?.address || event.address}, {event.venue?.city || event.city}</span>
                </div>
              </div>
            </div>

            <div className="confirmation-section">
              <h3>Thông tin đăng ký</h3>
              <div className="info-grid">
                <div className="bg-background-dark">
                  <strong>Số lượng người:</strong>
                  <span>{quantity} người</span>
                </div>
                {event.price > 0 && (
                  <>
                    <div className="bg-background-dark">
                      <strong>Giá mỗi người:</strong>
                      <span>{formatPrice(event.price)}</span>
                    </div>
                    <div className="bg-background-dark">
                      <strong>Tổng tiền:</strong>
                      <span className="total-highlight">{formatPrice(total)}</span>
                    </div>
                  </>
                )}
                {event.price === 0 && (
                  <div className="bg-background-dark">
                    <strong>Giá:</strong>
                    <span className="total-highlight">Miễn phí</span>
                  </div>
                )}
              </div>
            </div>

            {event.price > 0 && paymentMethod && (
              <div className="confirmation-section">
                <h3>Thông tin thanh toán</h3>
                <div className="info-grid">
                  <div className="bg-background-dark">
                    <strong>Phương thức:</strong>
                    <span>{paymentMethodNames[paymentMethod] || paymentMethod}</span>
                  </div>
                  {paymentResult?.transactionId && (
                    <div className="bg-background-dark">
                      <strong>Mã giao dịch:</strong>
                      <span>{paymentResult.transactionId}</span>
                    </div>
                  )}
                  {paymentResult?.timestamp && (
                    <div className="bg-background-dark">
                      <strong>Thời gian:</strong>
                      <span>{new Date(paymentResult.timestamp).toLocaleString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="confirmation-section">
              <h3>Thông tin người đăng ký</h3>
              <div className="info-grid">
                <div className="bg-background-dark">
                  <strong>Họ tên:</strong>
                  <span>{customerInfo.name}</span>
                </div>
                <div className="bg-background-dark">
                  <strong>Email:</strong>
                  <span>{customerInfo.email}</span>
                </div>
                <div className="bg-background-dark">
                  <strong>Số điện thoại:</strong>
                  <span>{customerInfo.phone}</span>
                </div>
                {customerInfo.notes && (
                  <div className="bg-background-dark">
                    <strong>Ghi chú:</strong>
                    <span>{customerInfo.notes}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="confirmation-reminder">
              <h4>📧 Email & SMS xác nhận</h4>
              <p>Chúng tôi đã gửi email và SMS xác nhận đến:</p>
              <ul>
                <li>📧 Email: {customerInfo.email}</li>
                <li>📱 SMS: {customerInfo.phone}</li>
              </ul>
              <p className="reminder-note">
                ⏰ Bạn sẽ nhận được email nhắc nhở 24 giờ trước khi sự kiện diễn ra.
              </p>
            </div>
          </div>

          <div className="confirmation-actions">
            <button className="btn-primary" onClick={onClose}>
              Hoàn tất
            </button>
            <button className="btn-secondary" onClick={() => window.print()}>
              In xác nhận
            </button>
          </div>
        </>
      ) : (
        <div className="confirmation-error">
          <div className="error-icon">✕</div>
          <h2>Thanh Toán Thất Bại</h2>
          <p>{paymentResult?.message || 'Đã có lỗi xảy ra trong quá trình thanh toán.'}</p>
          <button className="btn-primary" onClick={onClose}>
            Quay lại
          </button>
        </div>
      )}
    </motion.div>
  )
}
