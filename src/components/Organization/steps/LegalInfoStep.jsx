export default function LegalInfoStep({ formData, updateFormData }) {
  const isIndividual = formData.type === 'individual'

  const fillTestData = () => {
    const testData = {
      tax_code: isIndividual ? '' : '0123456789',
      business_license_number: isIndividual ? '' : '0123456789-001',
      legal_representative_name: 'Nguyễn Văn Test',
      legal_representative_id: '001234567890',
      bank_name: 'Vietcombank',
      bank_account_number: '1234567890',
      bank_account_name: 'NGUYEN VAN TEST',
      bank_branch: 'Chi nhánh Quận 1, TP.HCM'
    }
    
    updateFormData(testData)
  }

  return (
    <div className="form-step">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2>Thông tin pháp lý</h2>
        <button
          type="button"
          onClick={fillTestData}
          className="btn-test-fill"
          title="Auto-fill with test data"
        >
          🧪 Fill Test Data
        </button>
      </div>
      <p className="step-description">
        {isIndividual
          ? 'Cung cấp thông tin cá nhân và tài khoản ngân hàng'
          : 'Cung cấp thông tin pháp lý và tài khoản ngân hàng của doanh nghiệp'}
      </p>

      <div className="form-grid">
        {!isIndividual && (
          <>
            <div className="form-group">
              <label htmlFor="tax_code">
                Mã số thuế <span className="required">*</span>
              </label>
              <input
                type="text"
                id="tax_code"
                value={formData.tax_code}
                onChange={(e) => updateFormData({ tax_code: e.target.value })}
                placeholder="0123456789"
                required={!isIndividual}
              />
            </div>

            <div className="form-group">
              <label htmlFor="business_license_number">
                Số giấy phép kinh doanh
              </label>
              <input
                type="text"
                id="business_license_number"
                value={formData.business_license_number}
                onChange={(e) => updateFormData({ business_license_number: e.target.value })}
                placeholder="0123456789"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label htmlFor="legal_representative_name">
            {isIndividual ? 'Họ và tên' : 'Người đại diện pháp luật'}{' '}
            <span className="required">*</span>
          </label>
          <input
            type="text"
            id="legal_representative_name"
            value={formData.legal_representative_name}
            onChange={(e) => updateFormData({ legal_representative_name: e.target.value })}
            placeholder="Nguyễn Văn A"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="legal_representative_id">
            Số CCCD/CMND <span className="required">*</span>
          </label>
          <input
            type="text"
            id="legal_representative_id"
            value={formData.legal_representative_id}
            onChange={(e) => updateFormData({ legal_representative_id: e.target.value })}
            placeholder="001234567890"
            required
          />
        </div>

        <div className="form-section-title full-width">
          <h3>Thông tin tài khoản ngân hàng</h3>
          <p>Để nhận thanh toán từ bán vé và sự kiện</p>
        </div>

        <div className="form-group">
          <label htmlFor="bank_name">
            Ngân hàng <span className="required">*</span>
          </label>
          <select
            id="bank_name"
            value={formData.bank_name}
            onChange={(e) => updateFormData({ bank_name: e.target.value })}
            required
          >
            <option value="">-- Chọn ngân hàng --</option>
            <option value="Vietcombank">Vietcombank</option>
            <option value="VietinBank">VietinBank</option>
            <option value="BIDV">BIDV</option>
            <option value="Agribank">Agribank</option>
            <option value="Techcombank">Techcombank</option>
            <option value="MB Bank">MB Bank</option>
            <option value="ACB">ACB</option>
            <option value="VPBank">VPBank</option>
            <option value="TPBank">TPBank</option>
            <option value="Sacombank">Sacombank</option>
            <option value="HDBank">HDBank</option>
            <option value="SHB">SHB</option>
            <option value="VIB">VIB</option>
            <option value="OCB">OCB</option>
            <option value="MSB">MSB</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="bank_account_number">
            Số tài khoản <span className="required">*</span>
          </label>
          <input
            type="text"
            id="bank_account_number"
            value={formData.bank_account_number}
            onChange={(e) => updateFormData({ bank_account_number: e.target.value })}
            placeholder="1234567890"
            required
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="bank_account_name">
            Tên tài khoản <span className="required">*</span>
          </label>
          <input
            type="text"
            id="bank_account_name"
            value={formData.bank_account_name}
            onChange={(e) => updateFormData({ bank_account_name: e.target.value })}
            placeholder="NGUYEN VAN A"
            required
          />
          <small>Tên chủ tài khoản (viết hoa, không dấu)</small>
        </div>

        <div className="form-group full-width">
          <label htmlFor="bank_branch">Chi nhánh</label>
          <input
            type="text"
            id="bank_branch"
            value={formData.bank_branch}
            onChange={(e) => updateFormData({ bank_branch: e.target.value })}
            placeholder="Chi nhánh Quận 1, TP.HCM"
          />
        </div>
      </div>

      <div className="info-box">
        <div className="info-icon">ℹ️</div>
        <div>
          <strong>Lưu ý:</strong> Thông tin tài khoản ngân hàng sẽ được xác minh bằng
          cách chuyển một khoản tiền nhỏ (1,000đ - 10,000đ) để kiểm tra. Vui lòng đảm
          bảo thông tin chính xác.
        </div>
      </div>

      <div className="warning-box" style={{ marginTop: '16px' }}>
        <div className="warning-icon">🧪</div>
        <div>
          <strong>Test Mode:</strong>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#999' }}>
            Click nút "Fill Test Data" ở trên để tự động điền dữ liệu mẫu và test nhanh hệ thống.
          </p>
        </div>
      </div>
    </div>
  )
}
