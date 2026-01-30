import { motion } from 'framer-motion'
import './FamousArtists.css'

function FamousArtists() {
  const performances = [
    {
      date: 'T10 24',
      day: 'Thứ Năm 19:30',
      title: 'Sơn Hậu',
      subtitle: 'Tuồng Cổ Truyền Thống',
      venue: 'Nhà Hát Lớn, Hà Nội',
      status: 'available'
    },
    {
      date: 'T10 28',
      day: 'Thứ Hai 20:00',
      title: 'Tam Nữ Đồ Vương',
      subtitle: 'Sử Thi Lịch Sử',
      venue: 'Nhà Hát Di Sản, Huế',
      status: 'available'
    },
    {
      date: 'T11 02',
      day: 'Thứ Bảy 19:00',
      title: 'Đào Tam Xuân',
      subtitle: 'Bi Kịch Kinh Điển',
      venue: 'Sân Khấu Hoàng Gia, Đà Nẵng',
      status: 'sold-out'
    },
    {
      date: 'T11 15',
      day: 'Thứ Sáu 20:30',
      title: 'Quan Công',
      subtitle: 'Anh Hùng Huyền Thoại',
      venue: 'Nhà Hát Quốc Gia, TP.HCM',
      status: 'available'
    },
    {
      date: 'T11 22',
      day: 'Thứ Sáu 19:00',
      title: 'Bạch Viên',
      subtitle: 'Tình Yêu & Bi Kịch',
      venue: 'Trung Tâm Văn Hóa, Hà Nội',
      status: 'available'
    }
  ]

  return (
    <section className="artists-section">
      <div className="artists-container">
        {/* Gold Divider */}
        <div className="section-divider-wrapper">
          <div className="gold-divider"></div>
        </div>

        {/* Schedule Header */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="schedule-header"
        >
          <div className="header-content">
            <h2 className="schedule-title">Lịch Biểu Diễn</h2>
            <p className="schedule-season">Mùa Đông 2024</p>
          </div>
          <a href="#" className="view-calendar">
            Xem Lịch Đầy Đủ
            <span className="arrow-icon">→</span>
          </a>
        </motion.div>

        {/* Performance Table */}
        <div className="performance-table-wrapper">
          <table className="performance-table">
            <thead>
              <tr>
                <th className="table-header">Ngày</th>
                <th className="table-header">Tiết Mục</th>
                <th className="table-header venue-col">Địa Điểm</th>
                <th className="table-header action-col">Hành Động</th>
              </tr>
            </thead>
            <tbody>
              {performances.map((show, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="table-row"
                >
                  <td className="table-cell date-cell">
                    <div className="date-wrapper">
                      <span className="date-text">{show.date}</span>
                      <span className="day-text">{show.day}</span>
                    </div>
                  </td>
                  <td className="table-cell performance-cell">
                    <h3 className="performance-title">{show.title}</h3>
                    <p className="performance-subtitle">{show.subtitle}</p>
                  </td>
                  <td className="table-cell venue-cell venue-col">
                    <span className="venue-text">{show.venue}</span>
                  </td>
                  <td className="table-cell action-cell action-col">
                    <button 
                      className={`action-button ${show.status === 'sold-out' ? 'sold-out' : ''}`}
                      disabled={show.status === 'sold-out'}
                    >
                      {show.status === 'sold-out' ? 'Hết Vé' : 'Đặt Vé'}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}

export default FamousArtists
