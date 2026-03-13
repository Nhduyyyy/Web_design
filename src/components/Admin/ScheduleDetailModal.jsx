import './OrganizationDetailModal.css'

export default function ScheduleDetailModal({ schedule, onClose }) {
  if (!schedule) return null

  const getStatusBadge = (status) => {
    const badges = {
      scheduled: { label: 'Đã lên lịch', class: 'under-review' },
      ongoing: { label: 'Đang diễn ra', class: 'approved' },
      completed: { label: 'Đã kết thúc', class: 'default' },
      cancelled: { label: 'Đã hủy', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{schedule.title || 'Chi tiết lịch'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="info-tab">
            <div className="info-section">
              <h3>Thông tin chung</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Tiêu đề:</label>
                  <span>{schedule.title || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Mã rạp:</label>
                  <span>{schedule.theater_id || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Trạng thái:</label>
                  <span>{getStatusBadge(schedule.status)}</span>
                </div>
                <div className="info-item">
                  <label>Cho phép đặt vé:</label>
                  <span>{schedule.enable_booking ? 'Có' : 'Không'}</span>
                </div>
                <div className="info-item full">
                  <label>Bắt đầu:</label>
                  <span>
                    {schedule.start_datetime
                      ? new Date(schedule.start_datetime).toLocaleString('vi-VN')
                      : '-'}
                  </span>
                </div>
                <div className="info-item full">
                  <label>Kết thúc:</label>
                  <span>
                    {schedule.end_datetime
                      ? new Date(schedule.end_datetime).toLocaleString('vi-VN')
                      : '-'}
                  </span>
                </div>
                {schedule.created_at && (
                  <div className="info-item">
                  <label>Ngày tạo:</label>
                  <span>{new Date(schedule.created_at).toLocaleString('vi-VN')}</span>
                </div>
                )}
                {schedule.updated_at && (
                  <div className="info-item">
                  <label>Cập nhật:</label>
                  <span>{new Date(schedule.updated_at).toLocaleString('vi-VN')}</span>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}
