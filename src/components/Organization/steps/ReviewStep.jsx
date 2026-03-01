import { useState, useEffect } from 'react'
import { getOrganizationById, getDocumentsByOrganization } from '../../../services/organizationService'
import '../Documents.css'

export default function ReviewStep({ formData, organizationId }) {
  const [organization, setOrganization] = useState(null)
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [organizationId])

  const loadData = async () => {
    try {
      const [org, docs] = await Promise.all([
        getOrganizationById(organizationId),
        getDocumentsByOrganization(organizationId)
      ])
      setOrganization(org)
      setDocuments(docs)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Đang tải...</div>
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
    <div className="form-step">
      <h2>Xác nhận thông tin</h2>
      <p className="step-description">
        Vui lòng kiểm tra lại tất cả thông tin trước khi gửi đăng ký
      </p>

      <div className="review-container">
        {/* Organization Type */}
        <div className="review-section">
          <h3>Loại hình tổ chức</h3>
          <div className="review-item">
            <span className="review-label">Loại:</span>
            <span className="review-value">{getTypeLabel(organization?.type)}</span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="review-section">
          <h3>Thông tin cơ bản</h3>
          <div className="review-item">
            <span className="review-label">Tên tổ chức:</span>
            <span className="review-value">{organization?.legal_name}</span>
          </div>
          {organization?.display_name && (
            <div className="review-item">
              <span className="review-label">Tên hiển thị:</span>
              <span className="review-value">{organization?.display_name}</span>
            </div>
          )}
          {organization?.description && (
            <div className="review-item">
              <span className="review-label">Mô tả:</span>
              <span className="review-value">{organization?.description}</span>
            </div>
          )}
          <div className="review-item">
            <span className="review-label">Email:</span>
            <span className="review-value">{organization?.email}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Điện thoại:</span>
            <span className="review-value">{organization?.phone}</span>
          </div>
          {organization?.address && (
            <div className="review-item">
              <span className="review-label">Địa chỉ:</span>
              <span className="review-value">{organization?.address}</span>
            </div>
          )}
          {organization?.city && (
            <div className="review-item">
              <span className="review-label">Thành phố:</span>
              <span className="review-value">{organization?.city}</span>
            </div>
          )}
          {organization?.website && (
            <div className="review-item">
              <span className="review-label">Website:</span>
              <span className="review-value">
                <a href={organization?.website} target="_blank" rel="noopener noreferrer">
                  {organization?.website}
                </a>
              </span>
            </div>
          )}
        </div>

        {/* Legal Info */}
        <div className="review-section">
          <h3>Thông tin pháp lý</h3>
          {organization?.tax_code && (
            <div className="review-item">
              <span className="review-label">Mã số thuế:</span>
              <span className="review-value">{organization?.tax_code}</span>
            </div>
          )}
          {organization?.business_license_number && (
            <div className="review-item">
              <span className="review-label">Số GPKD:</span>
              <span className="review-value">{organization?.business_license_number}</span>
            </div>
          )}
          <div className="review-item">
            <span className="review-label">Người đại diện:</span>
            <span className="review-value">{organization?.legal_representative_name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Số CCCD:</span>
            <span className="review-value">{organization?.legal_representative_id}</span>
          </div>
        </div>

        {/* Bank Info */}
        <div className="review-section">
          <h3>Thông tin ngân hàng</h3>
          <div className="review-item">
            <span className="review-label">Ngân hàng:</span>
            <span className="review-value">{organization?.bank_name}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Số tài khoản:</span>
            <span className="review-value">{organization?.bank_account_number}</span>
          </div>
          <div className="review-item">
            <span className="review-label">Tên tài khoản:</span>
            <span className="review-value">{organization?.bank_account_name}</span>
          </div>
          {organization?.bank_branch && (
            <div className="review-item">
              <span className="review-label">Chi nhánh:</span>
              <span className="review-value">{organization?.bank_branch}</span>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="review-section">
          <h3>Tài liệu đã tải lên</h3>
          {documents.length > 0 ? (
            <div className="documents-review">
              {documents.map(doc => (
                <div key={doc.id} className="document-review-item">
                  <span className="doc-icon">📄</span>
                  <div className="doc-info">
                    <div className="doc-type">{getDocTypeLabel(doc.type)}</div>
                    <div className="doc-name">{doc.file_name}</div>
                  </div>
                  <span className={`status-badge ${doc.status}`}>
                    {doc.status === 'pending' && '⏳ Chờ duyệt'}
                    {doc.status === 'approved' && '✓ Đã duyệt'}
                    {doc.status === 'rejected' && '✗ Từ chối'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-documents">Chưa có tài liệu nào</p>
          )}
        </div>

        {/* Terms */}
        <div className="review-section">
          <h3>Điều khoản</h3>
          <div className="review-item">
            <span className="review-value">
              ✓ Đã đồng ý với điều khoản và chính sách
            </span>
          </div>
        </div>
      </div>

      <div className="warning-box">
        <div className="warning-icon">⚠️</div>
        <div>
          <strong>Lưu ý quan trọng:</strong>
          <ul>
            <li>Sau khi gửi, bạn không thể chỉnh sửa thông tin</li>
            <li>Admin sẽ xem xét đơn đăng ký trong vòng 1-3 ngày làm việc</li>
            <li>Nếu cần bổ sung thông tin, bạn sẽ nhận được thông báo qua email</li>
            <li>Thông tin sai lệch có thể dẫn đến từ chối đơn đăng ký</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
