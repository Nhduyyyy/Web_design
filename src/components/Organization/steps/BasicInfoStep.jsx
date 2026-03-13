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

  // Basic Info (previously Step 2, now the only step)
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
