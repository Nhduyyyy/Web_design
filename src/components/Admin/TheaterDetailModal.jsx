import './OrganizationDetailModal.css'

export default function TheaterDetailModal({ theater, onClose }) {
  if (!theater) return null

  const getStatusBadge = (status) => {
    const badges = {
      pending: { label: 'Chờ duyệt', class: 'submitted' },
      approved: { label: 'Đã duyệt', class: 'approved' },
      rejected: { label: 'Từ chối', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{theater.name || 'Chi tiết nhà hát'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="info-tab">
            <div className="info-section">
              <h3>Thông tin cơ bản</h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Tên nhà hát:</label>
                  <span>{theater.name || '-'}</span>
                </div>
                <div className="info-item">
                  <label>Trạng thái:</label>
                  <span>{getStatusBadge(theater.status)}</span>
                </div>
                {theater.address && (
                  <div className="info-item full">
                    <label>Địa chỉ:</label>
                    <span>{theater.address}</span>
                  </div>
                )}
                {theater.phone && (
                  <div className="info-item">
                    <label>Điện thoại:</label>
                    <span>{theater.phone}</span>
                  </div>
                )}
                {theater.email && (
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{theater.email}</span>
                  </div>
                )}
                {theater.owner_id && (
                  <div className="info-item">
                    <label>Mã chủ sở hữu:</label>
                    <span>{theater.owner_id}</span>
                  </div>
                )}
                {theater.created_at && (
                  <div className="info-item">
                    <label>Ngày tạo:</label>
                    <span>{new Date(theater.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {theater.updated_at && (
                  <div className="info-item">
                    <label>Cập nhật:</label>
                    <span>{new Date(theater.updated_at).toLocaleString('vi-VN')}</span>
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
