import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import './OrganizationDetailModal.css'

export default function LivestreamDetailModal({ livestream, onClose }) {
  const [commentCount, setCommentCount] = useState(0)

  useEffect(() => {
    if (!livestream?.id) return
    const loadCommentCount = async () => {
      const { count, error } = await supabase
        .from('livestream_comments')
        .select('*', { count: 'exact', head: true })
        .eq('livestream_id', livestream.id)
      if (!error) setCommentCount(count ?? 0)
    }
    loadCommentCount()
  }, [livestream?.id])

  if (!livestream) return null

  const getStatusBadge = (status) => {
    const badges = {
      upcoming: { label: 'Sắp phát', class: 'submitted' },
      live: { label: 'Đang phát', class: 'approved' },
      ended: { label: 'Đã kết thúc', class: 'default' },
      cancelled: { label: 'Đã hủy', class: 'rejected' }
    }
    const badge = badges[status] || { label: status || '-', class: 'default' }
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>
  }

  const formatDate = (value) =>
    value ? new Date(value).toLocaleString('vi-VN') : '-'

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{livestream.title || 'Chi tiết livestream'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="info-tab">
            <div className="info-section">
              <h3>Thông tin chung</h3>
              <div className="info-grid">
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Tiêu đề:</label>
                  <span>{livestream.title || '-'}</span>
                </div>
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Trạng thái:</label>
                  <span>{getStatusBadge(livestream.status)}</span>
                </div>
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Mã nhà hát:</label>
                  <span>{livestream.theater_id ?? '-'}</span>
                </div>
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Mã lịch:</label>
                  <span>{livestream.schedule_id ?? '-'}</span>
                </div>
                {livestream.access_type != null && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Loại truy cập:</label>
                    <span>{livestream.access_type}</span>
                  </div>
                )}
                {livestream.price != null && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Giá (VNĐ):</label>
                    <span>{Number(livestream.price).toLocaleString('vi-VN')}</span>
                  </div>
                )}
                {livestream.chat_enabled != null && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Bật chat:</label>
                    <span>{livestream.chat_enabled ? 'Có' : 'Không'}</span>
                  </div>
                )}
                {livestream.partner_name && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Đối tác:</label>
                    <span>{livestream.partner_name}</span>
                  </div>
                )}
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Bắt đầu:</label>
                  <span>{formatDate(livestream.start_time)}</span>
                </div>
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Kết thúc:</label>
                  <span>{formatDate(livestream.end_time)}</span>
                </div>
                {livestream.created_at && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Ngày tạo:</label>
                    <span>{formatDate(livestream.created_at)}</span>
                  </div>
                )}
                {livestream.updated_at && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Cập nhật:</label>
                    <span>{formatDate(livestream.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="info-section">
              <h3>Thống kê</h3>
              <div className="info-grid">
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Người xem hiện tại:</label>
                  <span>{livestream.current_viewers ?? 0}</span>
                </div>
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Tổng lượt xem:</label>
                  <span>{livestream.total_views ?? 0}</span>
                </div>
                {livestream.peak_viewers != null && (
                  <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label>Lượt xem cao nhất:</label>
                    <span>{livestream.peak_viewers}</span>
                  </div>
                )}
                <div style={{ color: 'black' , display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <label>Số comment:</label>
                  <span>{commentCount}</span>
                </div>
              </div>
            </div>

            {livestream.description && (
              <div className="info-section">
                <h3>Mô tả</h3>
                <p className="admin-note">{livestream.description}</p>
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
