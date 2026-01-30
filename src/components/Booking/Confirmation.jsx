import { motion } from 'framer-motion'
import { formatPrice } from '../../utils/booking'
import './booking.css'

export default function Confirmation({ bookingId, event, selectedSeats, total, customerInfo, paymentMethod, paymentResult, onClose }) {
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
      {paymentResult?.success ? (
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
            <h2>Đặt Vé Thành Công!</h2>
            <p className="success-message">
              Cảm ơn bạn đã đặt vé. Thông tin xác nhận đã được gửi đến email và SMS của bạn.
            </p>
          </div>

          <div className="confirmation-details">
            <div className="confirmation-section">
              <h3>Mã đặt vé</h3>
              <div className="booking-id-large">{bookingId}</div>
              <p className="booking-note">Vui lòng lưu mã này để tra cứu và nhận vé tại rạp</p>
            </div>

            <div className="confirmation-section">
              <h3>Thông tin sự kiện</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Tên sự kiện:</strong>
                  <span>{event.title}</span>
                </div>
                <div className="info-item">
                  <strong>Ngày giờ:</strong>
                  <span>{new Date(event.startDatetime).toLocaleString('vi-VN')}</span>
                </div>
                <div className="info-item">
                  <strong>Địa điểm:</strong>
                  <span>{event.venue?.name}</span>
                </div>
                <div className="info-item">
                  <strong>Địa chỉ:</strong>
                  <span>{event.venue?.address}, {event.venue?.city}</span>
                </div>
              </div>
            </div>

            <div className="confirmation-section">
              <h3>Ghế đã đặt</h3>
              <div className="confirmed-seats">
                {selectedSeats.map(seat => (
                  <div key={seat.id} className="confirmed-seat">
                    <span className="seat-badge">{seat.id}</span>
                    <span className="seat-type-badge">{seat.type.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="confirmation-section">
              <h3>Thông tin thanh toán</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Số lượng vé:</strong>
                  <span>{selectedSeats.length} vé</span>
                </div>
                <div className="info-item">
                  <strong>Tổng tiền:</strong>
                  <span className="total-highlight">{formatPrice(total)}</span>
                </div>
                <div className="info-item">
                  <strong>Phương thức:</strong>
                  <span>{paymentMethodNames[paymentMethod] || paymentMethod}</span>
                </div>
                <div className="info-item">
                  <strong>Mã giao dịch:</strong>
                  <span>{paymentResult?.transactionId}</span>
                </div>
                <div className="info-item">
                  <strong>Thời gian:</strong>
                  <span>{new Date(paymentResult?.timestamp).toLocaleString('vi-VN')}</span>
                </div>
              </div>
            </div>

            <div className="confirmation-section">
              <h3>Thông tin khách hàng</h3>
              <div className="info-grid">
                <div className="info-item">
                  <strong>Họ tên:</strong>
                  <span>{customerInfo.name}</span>
                </div>
                <div className="info-item">
                  <strong>Email:</strong>
                  <span>{customerInfo.email}</span>
                </div>
                <div className="info-item">
                  <strong>Số điện thoại:</strong>
                  <span>{customerInfo.phone}</span>
                </div>
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
              In vé
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
