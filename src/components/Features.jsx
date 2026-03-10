import { motion } from 'framer-motion'
import { FaTheaterMasks, FaUserAlt, FaBook, FaVideo, FaPaintBrush, FaMusic } from "react-icons/fa";
import './Features.css'

function Features() {
  const features = [
    {
      icon: FaTheaterMasks,
      title: 'Khám Phá Vai Diễn',
      description: 'Tìm hiểu ý nghĩa của từng màu sắc và nét vẽ trên mặt nạ Tuồng, từ khuôn mặt đỏ trung thành đến khuôn mặt trắng gian trá.',
      color: 'gold'
    },
    {
      icon: FaUserAlt,
      title: 'Bộ Sưu Tập Nhân Vật',
      description: 'Khám phá các nhân vật kinh điển trong nghệ thuật Tuồng với trang phục đặc trưng và câu chuyện lịch sử đằng sau mỗi vai diễn.',
      color: 'primary'
    },
    {
      icon: FaBook,
      title: 'Kho Lưu Trữ Giáo Dục',
      description: 'Truy cập vào kho tài liệu phong phú về lịch sử, kỹ thuật biểu diễn và giá trị văn hóa của nghệ thuật Tuồng Việt Nam.',
      color: 'gold'
    },
    {
      icon: FaVideo,
      title: 'Video & Trailer',
      description: 'Xem các video biểu diễn trực tiếp, hậu trường và trailer của những vở diễn Tuồng nổi tiếng qua các thời kỳ.',
      color: 'primary'
    },
    {
      icon: FaPaintBrush,
      title: 'Trải Nghiệm Tương Tác',
      description: 'Thử nghiệm các mặt nạ Tuồng ảo, tìm hiểu cách trang điểm và khám phá nghệ thuật biểu diễn một cách sinh động.',
      color: 'gold'
    },
    {
      icon: FaMusic,
      title: 'Âm Nhạc Truyền Thống',
      description: 'Lắng nghe những giai điệu truyền thống với tiếng trống chiến và nhạc cụ dân tộc đặc trưng của nghệ thuật Tuồng.',
      color: 'primary'
    }
  ]

  return (
    <section className="features-section">
      <div className="features-container">
        {/* Header */}
        <div className="features-header">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="features-label"
          >
            KHÁM PHÁ
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="features-title"
          >
            Chức Năng Website
          </motion.h2>
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="features-divider"
          />
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="features-description"
          >
            Khám phá những tính năng độc đáo giúp bạn tìm hiểu sâu sắc về nghệ thuật Tuồng Việt Nam - Nơi lưu giữ tinh hoa văn hóa qua từng giai điệu, mặt nạ và điệu bộ điêu luyện.
          </motion.p>
        </div>

        {/* Features Grid */}
        <div className="features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`feature-card feature-card-${feature.color}`}
              >
                <div className="feature-icon">
                  <Icon className="text-3xl text-primary" />
                </div>

                <div className="feature-content">
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-text">{feature.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  )
}

export default Features
