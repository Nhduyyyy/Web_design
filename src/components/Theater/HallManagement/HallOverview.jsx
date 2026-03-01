import './HallOverview.css'

const HallOverview = ({ hall, todayPerformances, stats }) => {
  return (
    <div className="hall-overview">
      {/* Today's Performances */}
      <div className="overview-section">
        <div className="section-header">
          <h2 className="section-title">
            <span className="material-symbols-outlined">today</span>
            Biểu diễn hôm nay
          </h2>
          <span className="section-badge">{todayPerformances.length} buổi</span>
        </div>

        {todayPerformances.length > 0 ? (
          <div className="performances-grid">
            {todayPerformances.map(perf => (
              <div key={perf.id} className="performance-card">
                <div className="performance-header">
                  <div>
                    <h3 className="performance-title">{perf.play?.title}</h3>
                    <p className="performance-time">
                      <span className="material-symbols-outlined">schedule</span>
                      {perf.start_time} - {perf.end_time || 'Chưa xác định'}
                    </p>
                  </div>
                  <div className="performance-status">
                    {perf.status === 'scheduled' && (
                      <span className="status-badge status-scheduled">Đã lên lịch</span>
                    )}
                    {perf.status === 'ongoing' && (
                      <span className="status-badge status-ongoing">Đang diễn</span>
                    )}
                    {perf.status === 'completed' && (
                      <span className="status-badge status-completed">Hoàn thành</span>
                    )}
                  </div>
                </div>

                <div className="performance-stats">
                  <div className="stat-item">
                    <span className="stat-label">Đã bán</span>
                    <div className="stat-progress">
                      <div 
                        className="stat-progress-bar"
                        style={{ width: `${(perf.sold_seats / perf.total_seats) * 100}%` }}
                      ></div>
                    </div>
                    <span className="stat-value">
                      {perf.sold_seats}/{perf.total_seats} ghế
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Doanh thu</span>
                    <span className="stat-value revenue">
                      {(perf.revenue || 0).toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <span className="material-symbols-outlined">event_busy</span>
            <p>Không có buổi diễn nào hôm nay</p>
          </div>
        )}
      </div>

      {/* Hall Information */}
      <div className="overview-grid">
        <div className="overview-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="material-symbols-outlined">info</span>
              Thông tin khán phòng
            </h3>
          </div>
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Sức chứa</span>
                <span className="info-value">{hall.capacity} ghế</span>
              </div>
              <div className="info-item">
                <span className="info-label">Số hàng ghế</span>
                <span className="info-value">{hall.total_rows}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Ghế mỗi hàng</span>
                <span className="info-value">{hall.seats_per_row}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Loại khán phòng</span>
                <span className="info-value">
                  {hall.hall_type === 'main' && 'Khán phòng chính'}
                  {hall.hall_type === 'small' && 'Khán phòng nhỏ'}
                  {hall.hall_type === 'vip' && 'Phòng VIP'}
                  {hall.hall_type === 'outdoor' && 'Sân khấu ngoài trời'}
                </span>
              </div>
              {hall.stage_width && (
                <div className="info-item">
                  <span className="info-label">Kích thước sân khấu</span>
                  <span className="info-value">
                    {hall.stage_width}m × {hall.stage_depth}m
                  </span>
                </div>
              )}
              {hall.description && (
                <div className="info-item full-width">
                  <span className="info-label">Mô tả</span>
                  <span className="info-value">{hall.description}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="overview-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="material-symbols-outlined">settings_input_component</span>
              Trang thiết bị
            </h3>
          </div>
          <div className="card-content">
            <div className="equipment-grid">
              {[
                { key: 'has_sound_system', label: 'Hệ thống âm thanh', icon: 'volume_up' },
                { key: 'has_lighting_system', label: 'Hệ thống ánh sáng', icon: 'lightbulb' },
                { key: 'has_projection', label: 'Máy chiếu', icon: 'videocam' },
                { key: 'has_orchestra_pit', label: 'Hố nhạc', icon: 'music_note' },
                { key: 'has_backstage', label: 'Hậu trường', icon: 'meeting_room' },
                { key: 'has_dressing_room', label: 'Phòng thay đồ', icon: 'checkroom' }
              ].map(item => (
                <div
                  key={item.key}
                  className={`equipment-item ${hall[item.key] ? 'active' : 'inactive'}`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span className="equipment-label">{item.label}</span>
                  {hall[item.key] && (
                    <span className="material-symbols-outlined check">check_circle</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="overview-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-symbols-outlined">event</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng buổi diễn tháng này</span>
            <span className="stat-value">{stats?.monthlyPerformances || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-symbols-outlined">confirmation_number</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Vé đã bán tháng này</span>
            <span className="stat-value">{stats?.monthlyTickets || 0}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Doanh thu tháng này</span>
            <span className="stat-value">
              {(stats?.monthlyRevenue || 0).toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-symbols-outlined">percent</span>
          </div>
          <div className="stat-info">
            <span className="stat-label">Tỷ lệ lấp đầy trung bình</span>
            <span className="stat-value">{stats?.averageOccupancy || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HallOverview
