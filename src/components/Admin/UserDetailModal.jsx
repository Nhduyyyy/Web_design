import './OrganizationDetailModal.css'

export default function UserDetailModal({ user, onClose }) {
  if (!user) return null

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Quản trị viên',
      user: 'Người dùng',
      theater_owner: 'Chủ nhà hát'
    }
    return labels[role] || role || '-'
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{user.full_name || user.email || 'Chi tiết người dùng'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="info-tab">
            <div className="info-section">
              <h3>Thông tin cá nhân</h3>
              <div className="info-grid">
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Họ tên:</label>
                  <span>{user.full_name || '-'}</span>
                </div>
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Vai trò:</label>
                  <span>{getRoleLabel(user.role)}</span>
                </div>
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Email:</label>
                  <span>{user.email || '-'}</span>
                </div>
                {user.phone && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Điện thoại:</label>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user.id && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Mã người dùng:</label>
                    <span className="info-id">{user.id}</span>
                  </div>
                )}
                <div></div>
                {user.created_at && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Ngày tạo:</label>
                    <span>{new Date(user.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {user.updated_at && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Cập nhật:</label>
                    <span>{new Date(user.updated_at).toLocaleString('vi-VN')}</span>
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
