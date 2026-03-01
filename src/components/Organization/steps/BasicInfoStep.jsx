export default function BasicInfoStep({ formData, updateFormData, currentStep }) {
  const fillTestData = () => {
    const testData = {
      legal_name: 'Nhà hát Tuồng Test',
      display_name: 'Tuồng Test Theater',
      description: 'Đây là nhà hát test để kiểm tra hệ thống đăng ký và quản lý.',
      email: formData.email, // Keep current email
      phone: '0901234567',
      address: '123 Đường Test, Phường 1, Quận 1',
      city: 'Hồ Chí Minh',
      website: 'https://test-theater.vn',
      fanpage: 'https://facebook.com/test-theater'
    }
    
    updateFormData(testData)
  }

  if (currentStep === 1) {
    return (
      <div className="form-step">
        <h2>Chọn loại hình tổ chức</h2>
        <p className="step-description">
          Vui lòng chọn loại hình phù hợp với tổ chức của bạn
        </p>

        <div className="organization-types">
          <label className={`type-card ${formData.type === 'individual' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="type"
              value="individual"
              checked={formData.type === 'individual'}
              onChange={(e) => updateFormData({ type: e.target.value })}
            />
            <div className="type-icon">👤</div>
            <h3>Cá nhân</h3>
            <p>Tổ chức workshop, lớp học nhỏ</p>
            <ul className="type-features">
              <li>✓ Không cần giấy phép kinh doanh</li>
              <li>✓ Tối đa 5 sự kiện/tháng</li>
              <li>✓ Giá vé tối đa 500,000đ</li>
            </ul>
          </label>

          <label className={`type-card ${formData.type === 'enterprise' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="type"
              value="enterprise"
              checked={formData.type === 'enterprise'}
              onChange={(e) => updateFormData({ type: e.target.value })}
            />
            <div className="type-icon">🏢</div>
            <h3>Doanh nghiệp</h3>
            <p>Công ty tổ chức sự kiện</p>
            <ul className="type-features">
              <li>✓ Cần giấy phép kinh doanh</li>
              <li>✓ Tối đa 20 sự kiện/tháng</li>
              <li>✓ Giá vé tối đa 2,000,000đ</li>
            </ul>
          </label>

          <label className={`type-card ${formData.type === 'theater' ? 'selected' : ''}`}>
            <input
              type="radio"
              name="type"
              value="theater"
              checked={formData.type === 'theater'}
              onChange={(e) => updateFormData({ type: e.target.value })}
            />
            <div className="type-icon">🎭</div>
            <h3>Nhà hát</h3>
            <p>Nhà hát chính thức, đơn vị nghệ thuật</p>
            <ul className="type-features">
              <li>✓ Cần giấy phép đầy đủ</li>
              <li>✓ Không giới hạn sự kiện</li>
              <li>✓ Không giới hạn giá vé</li>
              <li>✓ Hỗ trợ livestream</li>
            </ul>
          </label>
        </div>
      </div>
    )
  }

  // Step 2: Basic Info
  return (
    <div className="form-step">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2>Thông tin cơ bản</h2>
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
        Cung cấp thông tin liên hệ và giới thiệu về tổ chức
      </p>

      <div className="form-grid">
        <div className="form-group full-width">
          <label htmlFor="legal_name">
            Tên tổ chức <span className="required">*</span>
          </label>
          <input
            type="text"
            id="legal_name"
            value={formData.legal_name}
            onChange={(e) => updateFormData({ legal_name: e.target.value })}
            placeholder="Nhà hát Tuồng Việt Nam"
            required
          />
          <small>Tên chính thức của tổ chức (theo giấy phép)</small>
        </div>

        <div className="form-group full-width">
          <label htmlFor="display_name">Tên hiển thị</label>
          <input
            type="text"
            id="display_name"
            value={formData.display_name}
            onChange={(e) => updateFormData({ display_name: e.target.value })}
            placeholder="Nhà hát Tuồng VN"
          />
          <small>Tên ngắn gọn để hiển thị trên website</small>
        </div>

        <div className="form-group full-width">
          <label htmlFor="description">Mô tả</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Giới thiệu về tổ chức của bạn..."
            rows={4}
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">
            Email <span className="required">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="contact@theater.vn"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">
            Số điện thoại <span className="required">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => updateFormData({ phone: e.target.value })}
            placeholder="0901234567"
            required
          />
        </div>

        <div className="form-group full-width">
          <label htmlFor="address">Địa chỉ</label>
          <input
            type="text"
            id="address"
            value={formData.address}
            onChange={(e) => updateFormData({ address: e.target.value })}
            placeholder="123 Đường ABC, Quận 1"
          />
        </div>

        <div className="form-group">
          <label htmlFor="city">Thành phố</label>
          <select
            id="city"
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
          >
            <option value="">-- Chọn thành phố --</option>
            <option value="Hồ Chí Minh">Hồ Chí Minh</option>
            <option value="Hà Nội">Hà Nội</option>
            <option value="Đà Nẵng">Đà Nẵng</option>
            <option value="Cần Thơ">Cần Thơ</option>
            <option value="Huế">Huế</option>
            <option value="Nha Trang">Nha Trang</option>
            <option value="Vũng Tàu">Vũng Tàu</option>
            <option value="Khác">Khác</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="website">Website</label>
          <input
            type="url"
            id="website"
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            placeholder="https://theater.vn"
          />
        </div>

        <div className="form-group">
          <label htmlFor="fanpage">Facebook Fanpage</label>
          <input
            type="url"
            id="fanpage"
            value={formData.fanpage}
            onChange={(e) => updateFormData({ fanpage: e.target.value })}
            placeholder="https://facebook.com/theater"
          />
        </div>
      </div>
    </div>
  )
}
