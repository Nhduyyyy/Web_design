import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import './ShopItemModal.css'

function ShopItemModal({ item, categories, onClose, onSave }) {
  const [formData, setFormData] = useState({
    category_id: '',
    name: '',
    slug: '',
    description: '',
    price: 0,
    image_url: '',
    badge: '',
    badge_color: 'primary',
    item_type: 'mask',
    is_limited: false,
    stock_quantity: null,
    max_purchase_per_user: null,
    is_active: true,
    display_order: 0
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (item) {
      setFormData({
        category_id: item.category_id || '',
        name: item.name || '',
        slug: item.slug || '',
        description: item.description || '',
        price: item.price || 0,
        image_url: item.image_url || '',
        badge: item.badge || '',
        badge_color: item.badge_color || 'primary',
        item_type: item.item_type || 'mask',
        is_limited: item.is_limited || false,
        stock_quantity: item.stock_quantity,
        max_purchase_per_user: item.max_purchase_per_user,
        is_active: item.is_active !== undefined ? item.is_active : true,
        display_order: item.display_order || 0
      })
    }
  }, [item])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Auto-generate slug from name
    if (name === 'name') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image_url: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    }

    if (!formData.category_id) {
      newErrors.category_id = 'Category is required'
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be positive'
    }

    if (!formData.item_type) {
      newErrors.item_type = 'Item type is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) {
      return
    }

    setLoading(true)

    try {
      // Prepare data
      const dataToSave = {
        ...formData,
        price: parseInt(formData.price),
        stock_quantity: formData.stock_quantity ? parseInt(formData.stock_quantity) : null,
        max_purchase_per_user: formData.max_purchase_per_user ? parseInt(formData.max_purchase_per_user) : null,
        display_order: parseInt(formData.display_order)
      }

      let result

      if (item) {
        // Update existing item
        result = await supabase
          .from('shop_items')
          .update(dataToSave)
          .eq('id', item.id)
          .select()
      } else {
        // Create new item
        result = await supabase
          .from('shop_items')
          .insert([dataToSave])
          .select()
      }

      if (result.error) throw result.error

      alert(item ? 'Item updated successfully!' : 'Item created successfully!')
      onSave(result.data[0])
      onClose()
    } catch (error) {
      console.error('Error saving item:', error)
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="shop-modal-overlay" onClick={onClose}>
      <div className="shop-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="shop-modal-header">
          <h2>
            <span className="material-symbols-outlined">
              {item ? 'edit' : 'add_circle'}
            </span>
            {item ? 'Chỉnh sửa vật phẩm' : 'Thêm vật phẩm'}
          </h2>
          <button className="shop-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="shop-modal-form">
          {/* Basic Information Section */}
          <div className="shop-form-section">
            <div className="shop-form-section-header">
              <span className="material-symbols-outlined">description</span>
              Thông tin cơ bản
            </div>

            <div className="shop-form-grid">
              {/* Name */}
              <div className="shop-form-group">
                <label>
                  Tên Vật Phẩm (Item Name) <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ví dụ: Tượng Quan Âm Bồ Tát Phú Vàng"
                  className={errors.name ? 'error' : ''}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              {/* Slug and Category Row */}
              <div className="shop-form-row">
                <div className="shop-form-group">
                  <label>
                    Đường dẫn (Slug) <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="tuong-quan-am-bo-tat-vang"
                    className={errors.slug ? 'error' : ''}
                  />
                  {errors.slug && <span className="error-message">{errors.slug}</span>}
                </div>

                <div className="shop-form-group">
                  <label>
                    Phân loại (Category) <span className="required">*</span>
                  </label>
                  <select
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    className={errors.category_id ? 'error' : ''}
                  >
                    <option value="">Đồ Thờ Cúng</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  {errors.category_id && <span className="error-message">{errors.category_id}</span>}
                </div>
              </div>

              {/* Price and Stock Row */}
              <div className="shop-form-row">
                <div className="shop-form-group">
                  <label>
                    Giá niêm yết (Price) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="đ 0.00"
                    min="0"
                    className={errors.price ? 'error' : ''}
                  />
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </div>

                <div className="shop-form-group">
                  <label>Số lượng tồn (Stock)</label>
                  <input
                    type="number"
                    name="stock_quantity"
                    value={formData.stock_quantity || ''}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                  <small>Để trống = không giới hạn</small>
                </div>
              </div>

              {/* Item Type and Display Order Row */}
              <div className="shop-form-row">
                <div className="shop-form-group">
                  <label>
                    Loại vật phẩm (Item Type) <span className="required">*</span>
                  </label>
                  <select
                    name="item_type"
                    value={formData.item_type}
                    onChange={handleChange}
                  >
                    <option value="mask">Mặt nạ (Mask)</option>
                    <option value="emote">Biểu cảm (Emote)</option>
                    <option value="theme">Chủ đề (Theme)</option>
                    <option value="booster">Tăng cường (Booster)</option>
                    <option value="voucher">Phiếu quà (Voucher)</option>
                  </select>
                </div>

                <div className="shop-form-group">
                  <label>Thứ tự hiển thị (Display Order)</label>
                  <input
                    type="number"
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                  />
                  <small>Số nhỏ hiển thị trước</small>
                </div>
              </div>

              {/* Badge and Badge Color Row */}
              <div className="shop-form-row">
                <div className="shop-form-group">
                  <label>Nhãn đặc biệt (Badge)</label>
                  <input
                    type="text"
                    name="badge"
                    value={formData.badge}
                    onChange={handleChange}
                    placeholder="Ví dụ: Limited, Rare, Epic"
                  />
                  <small>Để trống nếu không có</small>
                </div>

                <div className="shop-form-group">
                  <label>Màu nhãn (Badge Color)</label>
                  <select
                    name="badge_color"
                    value={formData.badge_color}
                    onChange={handleChange}
                  >
                    <option value="primary">Đỏ (Primary)</option>
                    <option value="yellow">Vàng (Yellow)</option>
                    <option value="blue">Xanh dương (Blue)</option>
                    <option value="green">Xanh lá (Green)</option>
                  </select>
                </div>
              </div>

              {/* Max Purchase Per User */}
              <div className="shop-form-group">
                <label>Giới hạn mua tối đa/người (Max Purchase)</label>
                <input
                  type="number"
                  name="max_purchase_per_user"
                  value={formData.max_purchase_per_user || ''}
                  onChange={handleChange}
                  placeholder="Để trống = không giới hạn"
                  min="1"
                />
                <small>Số lượng tối đa mỗi người có thể mua</small>
              </div>

              {/* Checkboxes */}
              <div className="shop-form-checkboxes">
                <label className="shop-checkbox-label">
                  <input
                    type="checkbox"
                    name="is_limited"
                    checked={formData.is_limited}
                    onChange={handleChange}
                  />
                  <span>Phiên bản giới hạn (Limited Edition)</span>
                </label>

                <label className="shop-checkbox-label">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span>Kích hoạt (Hiển thị trong shop)</span>
                </label>
              </div>

              {/* Description */}
              <div className="shop-form-group">
                <label>Mô tả vật phẩm (Description)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="4"
                  placeholder="Mô tả chi tiết về xuất xứ, chất liệu và ý nghĩa..."
                />
              </div>
            </div>
          </div>

          {/* Image & Attachments Section */}
          <div className="shop-form-section">
            <div className="shop-form-section-header">
              <span className="material-symbols-outlined">image</span>
              Hình ảnh & Pháp bảo
            </div>

            <div className="shop-image-upload" onClick={handleUploadClick}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
              />
              <div className="shop-image-upload-icon">
                <span className="material-symbols-outlined">cloud_upload</span>
              </div>
              <div className="shop-image-upload-text">
                Kéo thả hoặc chọn tệp để tải ảnh vật phẩm
              </div>
              <div className="shop-image-upload-hint">
                Định dạng hỗ trợ: JPEG, PNG, WEBP (Tối đa 5MB)
              </div>
              <button type="button" className="shop-upload-button" onClick={(e) => {
                e.stopPropagation()
                handleUploadClick()
              }}>
                Tải lên
              </button>
            </div>

            {formData.image_url && (
              <div className="shop-image-preview">
                <img src={formData.image_url} alt="Preview" />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="shop-modal-actions">
            <button
              type="button"
              className="shop-btn shop-btn-cancel"
              onClick={onClose}
              disabled={loading}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="shop-btn shop-btn-save"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="material-symbols-outlined spinning">progress_activity</span>
                  Đang lưu...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined">bookmark</span>
                  {item ? 'Cập nhật vật phẩm' : 'Thêm vật phẩm'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShopItemModal
