import { motion } from 'framer-motion'
import './Footer.css'

function Footer() {
  return (
    <section className="footer-page">
      <div className="footer-container">
        {/* Gold Divider */}
        <div className="footer-divider-wrapper">
          <div className="gold-divider"></div>
        </div>

        {/* Footer Content */}
        <div className="footer-grid">
          {/* Brand Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="footer-brand"
          >
            <div className="brand-header">
              <div className="brand-icon">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path 
                    d="M24 4C25.7818 14.2173 33.7827 22.2182 44 24C33.7827 25.7818 25.7818 33.7827 24 44C22.2182 33.7827 14.2173 25.7818 4 24C14.2173 22.2182 22.2182 14.2173 24 4Z" 
                    fill="currentColor"
                  />
                </svg>
              </div>
              <h2 className="brand-title">Văn Hóa Nghệ Thuật Tuồng</h2>
            </div>
            <p className="brand-description">
              Bảo tồn di sản hùng vĩ của nghệ thuật biểu diễn cổ điển Việt Nam thông qua cách kể chuyện hiện đại và sản xuất sân khấu đẳng cấp thế giới.
            </p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Website">
                <span className="social-icon">🌐</span>
              </a>
              <a href="#" className="social-link" aria-label="Social">
                <span className="social-icon">📱</span>
              </a>
              <a href="#" className="social-link" aria-label="Email">
                <span className="social-icon">✉️</span>
              </a>
            </div>
          </motion.div>

          {/* Quick Links Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="footer-links"
          >
            <h5 className="footer-heading">Liên Kết Nhanh</h5>
            <ul className="links-list">
              <li><a href="#" className="link-item">Lịch Biểu Diễn</a></li>
              <li><a href="#" className="link-item">Tiểu Sử Nghệ Sĩ</a></li>
              <li><a href="#" className="link-item">Chương Trình Giáo Dục</a></li>
              <li><a href="#" className="link-item">Thành Viên & Hỗ Trợ</a></li>
            </ul>
          </motion.div>

          {/* Contact Column */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="footer-contact"
          >
            <h5 className="footer-heading">Ghé Thăm Chúng Tôi</h5>
            <address className="contact-address">
              Khu Đô Thị FPT City,<br/>
              Quận Ngũ Hành Sơn,<br/>
              Đà Nẵng, Việt Nam
            </address>
            <p className="contact-phone">+84 234 567 890</p>
          </motion.div>
        </div>

        {/* Footer Bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="footer-bottom"
        >
          <p className="copyright">
            © 2024 Nhà Hát Tuồng Opera. Bảo Lưu Mọi Quyền.
          </p>
          <div className="footer-legal">
            <a href="#" className="legal-link">Chính Sách Bảo Mật</a>
            <a href="#" className="legal-link">Điều Khoản Dịch Vụ</a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Footer
