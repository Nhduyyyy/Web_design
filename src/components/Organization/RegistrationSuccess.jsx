import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './RegistrationSuccess.css'

export default function RegistrationSuccess() {
  const navigate = useNavigate()
  const location = useLocation()
  const organizationId = location.state?.organizationId

  useEffect(() => {
    // Set dark mode
    document.documentElement.classList.add('dark')
    document.body.style.backgroundColor = '#121212'
    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  return (
    <div className="registration-success">
      <div className="success-container">
        <div className="success-icon-wrapper">
          <div className="success-icon">✓</div>
        </div>
        
        <h1 className="success-title">Đăng ký thành công!</h1>
        
        <p className="success-message">
          Cảm ơn bạn đã đăng ký trở thành đối tác của chúng tôi.
          Đơn đăng ký của bạn đã được gửi và đang chờ xem xét.
        </p>

        <div className="success-info">
          <div className="info-item">
            <span className="info-icon">📋</span>
            <div className="info-content">
              <h3>Trạng thái</h3>
              <p>Chờ duyệt</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">⏱️</span>
            <div className="info-content">
              <h3>Thời gian xử lý</h3>
              <p>1-3 ngày làm việc</p>
            </div>
          </div>
          
          <div className="info-item">
            <span className="info-icon">📧</span>
            <div className="info-content">
              <h3>Thông báo</h3>
              <p>Qua email đã đăng ký</p>
            </div>
          </div>
        </div>

        <div className="next-steps">
          <h2>Các bước tiếp theo</h2>
          <ol>
            <li>
              <strong>Chờ xem xét:</strong> Admin sẽ kiểm tra thông tin và tài liệu của bạn
            </li>
            <li>
              <strong>Nhận thông báo:</strong> Bạn sẽ nhận email khi có kết quả
            </li>
            <li>
              <strong>Bổ sung (nếu cần):</strong> Nếu cần thêm thông tin, bạn sẽ được yêu cầu cập nhật
            </li>
            <li>
              <strong>Hoàn tất:</strong> Sau khi được duyệt, bạn có thể bắt đầu sử dụng nền tảng
            </li>
          </ol>
        </div>

        <div className="success-actions">
          <button
            onClick={() => navigate('/theater')}
            className="btn-primary"
          >
            Về trang Theater
          </button>
          <button
            onClick={() => navigate('/')}
            className="btn-secondary"
          >
            Về trang chủ
          </button>
        </div>

        <div className="support-info">
          <p>
            Có thắc mắc? Liên hệ với chúng tôi qua email{' '}
            <a href="mailto:support@tuong.vn">support@tuong.vn</a>
          </p>
        </div>
      </div>
    </div>
  )
}
