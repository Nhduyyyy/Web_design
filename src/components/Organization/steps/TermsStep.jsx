import '../Documents.css'

export default function TermsStep({ formData, updateFormData }) {
  return (
    <div className="form-step">
      <h2>Điều khoản và chính sách</h2>
      <p className="step-description">
        Vui lòng đọc và đồng ý với các điều khoản sau
      </p>

      <div className="terms-container">
        <div className="terms-section">
          <h3>📋 Điều khoản bán vé</h3>
          <div className="terms-content">
            <ul>
              <li>Hệ thống sẽ giữ 10% hoa hồng trên mỗi giao dịch bán vé</li>
              <li>Tiền bán vé sẽ được giữ trong 7 ngày trước khi chuyển về tài khoản</li>
              <li>Nhà hát chịu trách nhiệm hoàn tiền nếu hủy show trong vòng 24h trước diễn</li>
              <li>Phải cung cấp đầy đủ thông tin về show trước khi mở bán vé</li>
              <li>Không được bán vé giả, lừa đảo hoặc vi phạm pháp luật</li>
            </ul>
          </div>
        </div>

        <div className="terms-section">
          <h3>📺 Chính sách livestream</h3>
          <div className="terms-content">
            <ul>
              <li>Nội dung livestream phải phù hợp với thuần phong mỹ tục Việt Nam</li>
              <li>Không được phát nội dung vi phạm bản quyền</li>
              <li>Không được phát nội dung bạo lực, khiêu dâm, chính trị nhạy cảm</li>
              <li>Hệ thống có quyền tắt livestream nếu phát hiện vi phạm</li>
              <li>Chất lượng stream tối thiểu: 720p, 30fps</li>
            </ul>
          </div>
        </div>

        <div className="terms-section">
          <h3>💰 Chính sách hoàn tiền</h3>
          <div className="terms-content">
            <ul>
              <li>Khách hàng có thể yêu cầu hoàn tiền nếu show bị hủy</li>
              <li>Hoàn 100% nếu hủy trước 7 ngày</li>
              <li>Hoàn 50% nếu hủy trong vòng 3-7 ngày</li>
              <li>Không hoàn tiền nếu hủy trong vòng 3 ngày trước show</li>
              <li>Nhà hát chịu phí xử lý hoàn tiền (2% giá trị giao dịch)</li>
            </ul>
          </div>
        </div>

        <div className="terms-section">
          <h3>⚖️ Trách nhiệm và quyền lợi</h3>
          <div className="terms-content">
            <ul>
              <li>Nhà hát chịu trách nhiệm về chất lượng show diễn</li>
              <li>Nhà hát phải tuân thủ các quy định về an toàn, PCCC</li>
              <li>Hệ thống không chịu trách nhiệm về tranh chấp giữa nhà hát và khách hàng</li>
              <li>Nhà hát có quyền tự quản lý giá vé, lịch diễn</li>
              <li>Hệ thống có quyền tạm ngưng tài khoản nếu phát hiện gian lận</li>
            </ul>
          </div>
        </div>

        <div className="terms-section">
          <h3>🔒 Bảo mật thông tin</h3>
          <div className="terms-content">
            <ul>
              <li>Thông tin cá nhân và doanh nghiệp được bảo mật tuyệt đối</li>
              <li>Không chia sẻ thông tin cho bên thứ ba không có sự đồng ý</li>
              <li>Dữ liệu được mã hóa và lưu trữ an toàn</li>
              <li>Tuân thủ luật bảo vệ dữ liệu cá nhân Việt Nam</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="terms-acceptance">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={formData.terms_accepted}
            onChange={(e) => updateFormData({ terms_accepted: e.target.checked })}
          />
          <span>
            Tôi đã đọc và đồng ý với tất cả các điều khoản và chính sách trên.
            Tôi cam kết tuân thủ các quy định và chịu trách nhiệm về nội dung
            tổ chức trên nền tảng.
          </span>
        </label>
      </div>

      <div className="info-box">
        <div className="info-icon">ℹ️</div>
        <div>
          <strong>Lưu ý:</strong> Bạn có thể xem lại điều khoản đầy đủ tại{' '}
          <a href="/terms" target="_blank">đây</a>. Nếu có thắc mắc, vui lòng
          liên hệ support@tuong.vn
        </div>
      </div>
    </div>
  )
}
