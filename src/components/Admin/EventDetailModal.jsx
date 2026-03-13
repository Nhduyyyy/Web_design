import './OrganizationDetailModal.css'

export default function EventDetailModal({ event: evt, onClose }) {
  if (!evt) return null

  const getStatusBadge = (status) => {
    const badges = {
      draft: { label: 'Nháp', class: 'draft' },
      scheduled: { label: 'Đã lên lịch', class: 'under-review' },
      published: { label: 'Đã công bố', class: 'approved' },
      completed: { label: 'Đã kết thúc', class: 'default' },
      cancelled: { label: 'Đã hủy', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  const getTypeLabel = (type) => {
    const labels = {
      workshop: 'Workshop',
      tour: 'Tour',
      meet_artist: 'Gặp gỡ nghệ sĩ'
    }
    return labels[type] || type || '-'
  }

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString('vi-VN') : '-'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{evt.title || 'Chi tiết sự kiện'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="info-tab">
            <div className="info-section">
              <h3>Thông tin chung</h3>
              <div className="info-grid">
                <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Tiêu đề:</label>
                  <span>{evt.title || '-'}</span>
                </div>
                <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Loại sự kiện:</label>
                  <span>{getTypeLabel(evt.type)}</span>
                </div>
                <div className="" style={{ color: 'black', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Trạng thái:</label>
                  <span>{getStatusBadge(evt.status)}</span>
                </div>
                <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Nhà hát:</label>
                  <span>{evt.theater?.name ?? evt.theater_id ?? '-'}</span>
                </div>
                <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Rạp / Địa điểm:</label>
                  <span>{evt.venue?.name ?? evt.venue_id ?? '-'}</span>
                </div>
                <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Ngày diễn ra:</label>
                  <span>{formatDate(evt.event_date)}</span>
                </div>
                {evt.duration != null && (
                  <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Thời lượng (phút):</label>
                    <span>{evt.duration}</span>
                  </div>
                )}
                {evt.max_participants != null && (
                  <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Số người tối đa:</label>
                    <span>{evt.max_participants}</span>
                  </div>
                )}
                {evt.current_participants != null && (
                  <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Đã đăng ký:</label>
                    <span>{evt.current_participants}</span>
                  </div>
                )}
                {evt.price != null && evt.price !== '' && (
                  <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Giá (VNĐ):</label>
                    <span>{Number(evt.price).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {evt.instructor && (
                  <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Người hướng dẫn:</label>
                    <span>{evt.instructor}</span>
                  </div>
                )}
                {evt.created_at && (
                  <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Ngày tạo:</label>
                    <span>{formatDate(evt.created_at)}</span>
                  </div>
                )}
                {evt.updated_at && (
                  <div className="" style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Cập nhật:</label>
                    <span>{formatDate(evt.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            {evt.description && (
              <div className="info-section">
                <h3>Mô tả</h3>
                <p className="admin-note">{evt.description}</p>
              </div>
            )}
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
