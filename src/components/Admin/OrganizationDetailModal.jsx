import { useState, useEffect } from 'react'
import { getDocumentsByOrganization, getReviewsByOrganization } from '../../services/organizationService'
import './OrganizationDetailModal.css'

export default function OrganizationDetailModal({
  organization,
  onClose,
  onApprove,
  onReject,
  onRequestMoreInfo,
  onSuspend
}) {
  const [documents, setDocuments] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('info')
  const [actionNote, setActionNote] = useState('')
  const [showActionForm, setShowActionForm] = useState(null)

  useEffect(() => {
    loadData()
  }, [organization.id])

  const loadData = async () => {
    try {
      const [docs, revs] = await Promise.all([
        getDocumentsByOrganization(organization.id),
        getReviewsByOrganization(organization.id)
      ])
      setDocuments(docs)
      setReviews(revs)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action) => {
    if (!actionNote && action !== 'approve') {
      alert('Vui lòng nhập ghi chú')
      return
    }

    switch (action) {
      case 'approve':
        await onApprove(organization.id, actionNote)
        break
      case 'reject':
        await onReject(organization.id, actionNote)
        break
      case 'request_info':
        await onRequestMoreInfo(organization.id, actionNote)
        break
      case 'suspend':
        await onSuspend(organization.id, actionNote)
        break
    }

    setActionNote('')
    setShowActionForm(null)
  }

  const getTypeLabel = (type) => {
    const labels = {
      individual: 'Cá nhân',
      enterprise: 'Doanh nghiệp',
      theater: 'Nhà hát'
    }
    return labels[type] || type
  }

  const getDocTypeLabel = (type) => {
    const labels = {
      business_license: 'Giấy phép kinh doanh',
      id_card_front: 'CCCD mặt trước',
      id_card_back: 'CCCD mặt sau',
      authorization: 'Hợp đồng ủy quyền',
      tax_certificate: 'Giấy chứng nhận thuế',
      bank_statement: 'Sao kê ngân hàng',
      other: 'Khác'
    }
    return labels[type] || type
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{organization.legal_name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={activeTab === 'info' ? 'active' : ''}
            onClick={() => setActiveTab('info')}
          >
            📋 Thông tin
          </button>
          <button
            className={activeTab === 'documents' ? 'active' : ''}
            onClick={() => setActiveTab('documents')}
          >
            📄 Tài liệu ({documents.length})
          </button>
          <button
            className={activeTab === 'reviews' ? 'active' : ''}
            onClick={() => setActiveTab('reviews')}
          >
            📝 Lịch sử ({reviews.length})
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'info' && (
            <div className="info-tab">
              <div className="info-section">
                <h3>Loại hình</h3>
                <p>{getTypeLabel(organization.type)}</p>
              </div>

              <div className="info-section">
                <h3>Thông tin cơ bản</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Tên tổ chức:</label>
                    <span>{organization.legal_name}</span>
                  </div>
                  {organization.display_name && (
                    <div className="info-item">
                      <label>Tên hiển thị:</label>
                      <span>{organization.display_name}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{organization.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Điện thoại:</label>
                    <span>{organization.phone}</span>
                  </div>
                  {organization.address && (
                    <div className="info-item full">
                      <label>Địa chỉ:</label>
                      <span>{organization.address}</span>
                    </div>
                  )}
                  {organization.city && (
                    <div className="info-item">
                      <label>Thành phố:</label>
                      <span>{organization.city}</span>
                    </div>
                  )}
                  {organization.website && (
                    <div className="info-item">
                      <label>Website:</label>
                      <span>
                        <a href={organization.website} target="_blank" rel="noopener noreferrer">
                          {organization.website}
                        </a>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>Thông tin pháp lý</h3>
                <div className="info-grid">
                  {organization.tax_code && (
                    <div className="info-item">
                      <label>Mã số thuế:</label>
                      <span>{organization.tax_code}</span>
                    </div>
                  )}
                  {organization.business_license_number && (
                    <div className="info-item">
                      <label>Số GPKD:</label>
                      <span>{organization.business_license_number}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <label>Người đại diện:</label>
                    <span>{organization.legal_representative_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Số CCCD:</label>
                    <span>{organization.legal_representative_id}</span>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Thông tin ngân hàng</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Ngân hàng:</label>
                    <span>{organization.bank_name}</span>
                  </div>
                  <div className="info-item">
                    <label>Số tài khoản:</label>
                    <span>{organization.bank_account_number}</span>
                  </div>
                  <div className="info-item full">
                    <label>Tên tài khoản:</label>
                    <span>{organization.bank_account_name}</span>
                  </div>
                  {organization.bank_branch && (
                    <div className="info-item full">
                      <label>Chi nhánh:</label>
                      <span>{organization.bank_branch}</span>
                    </div>
                  )}
                </div>
              </div>

              {organization.admin_notes && (
                <div className="info-section">
                  <h3>Ghi chú của Admin</h3>
                  <p className="admin-note">{organization.admin_notes}</p>
                </div>
              )}

              {organization.rejection_reason && (
                <div className="info-section">
                  <h3>Lý do từ chối</h3>
                  <p className="rejection-note">{organization.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="documents-tab">
              {loading ? (
                <p>Đang tải tài liệu...</p>
              ) : documents.length === 0 ? (
                <p className="empty-message">Chưa có tài liệu nào</p>
              ) : (
                <div className="documents-grid">
                  {documents.map(doc => (
                    <div key={doc.id} className="document-card">
                      <div className="document-header">
                        <span className="doc-type">{getDocTypeLabel(doc.type)}</span>
                        <span className={`doc-status ${doc.status}`}>
                          {doc.status === 'pending' && '⏳ Chờ duyệt'}
                          {doc.status === 'approved' && '✓ Đã duyệt'}
                          {doc.status === 'rejected' && '✗ Từ chối'}
                        </span>
                      </div>
                      <div className="document-body">
                        <p className="doc-filename">{doc.file_name}</p>
                        <p className="doc-size">{(doc.file_size / 1024).toFixed(0)} KB</p>
                        {doc.rejection_reason && (
                          <p className="doc-rejection">{doc.rejection_reason}</p>
                        )}
                      </div>
                      <div className="document-footer">
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-view-doc"
                        >
                          Xem tài liệu
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-tab">
              {reviews.length === 0 ? (
                <p className="empty-message">Chưa có lịch sử xem xét</p>
              ) : (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-item">
                      <div className="review-header">
                        <span className="reviewer">{review.reviewer?.full_name}</span>
                        <span className="review-date">
                          {new Date(review.created_at).toLocaleString('vi-VN')}
                        </span>
                      </div>
                      <div className="review-body">
                        <p className="review-status">
                          {review.previous_status} → {review.new_status}
                        </p>
                        {review.comment && (
                          <p className="review-comment">{review.comment}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {organization.status !== 'approved' && organization.status !== 'rejected' && (
          <div className="modal-actions">
            {!showActionForm ? (
              <>
                <button
                  className="btn-action approve"
                  onClick={() => setShowActionForm('approve')}
                >
                  ✓ Phê duyệt
                </button>
                <button
                  className="btn-action request-info"
                  onClick={() => setShowActionForm('request_info')}
                >
                  📝 Yêu cầu bổ sung
                </button>
                <button
                  className="btn-action reject"
                  onClick={() => setShowActionForm('reject')}
                >
                  ✗ Từ chối
                </button>
              </>
            ) : (
              <div className="action-form">
                <textarea
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder={
                    showActionForm === 'approve'
                      ? 'Ghi chú (tùy chọn)'
                      : 'Nhập lý do...'
                  }
                  rows={3}
                />
                <div className="action-form-buttons">
                  <button
                    className="btn-confirm"
                    onClick={() => handleAction(showActionForm)}
                  >
                    Xác nhận
                  </button>
                  <button
                    className="btn-cancel"
                    onClick={() => {
                      setShowActionForm(null)
                      setActionNote('')
                    }}
                  >
                    Hủy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {organization.status === 'approved' && (
          <div className="modal-actions">
            <button
              className="btn-action suspend"
              onClick={() => setShowActionForm('suspend')}
            >
              ⏸ Tạm ngưng
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
