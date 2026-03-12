import { useState, useEffect } from 'react'

const initialErrors = {
  name: '',
  address: '',
  city: '',
  email: '',
  website: '',
  capacity: '',
  phone: '',
}

const validate = (values) => {
  const errors = { ...initialErrors }

  if (!values.name || values.name.trim().length < 2 || values.name.trim().length > 200) {
    errors.name = 'Tên nhà hát phải từ 2–200 ký tự.'
  }

  if (!values.address || values.address.trim().length < 5 || values.address.trim().length > 500) {
    errors.address = 'Địa chỉ phải từ 5–500 ký tự.'
  }

  if (!values.city || values.city.trim().length < 2 || values.city.trim().length > 100) {
    errors.city = 'Thành phố phải từ 2–100 ký tự.'
  }

  if (values.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(values.email)) {
      errors.email = 'Email không hợp lệ.'
    }
  }

  if (values.website) {
    if (!values.website.startsWith('http://') && !values.website.startsWith('https://')) {
      errors.website = 'Website phải bắt đầu bằng http:// hoặc https://.'
    }
  }

  if (values.capacity !== '' && values.capacity !== null && values.capacity !== undefined) {
    const num = Number(values.capacity)
    if (!Number.isInteger(num) || num < 0) {
      errors.capacity = 'Sức chứa phải là số nguyên không âm.'
    }
  }

  if (values.phone) {
    const phoneDigits = values.phone.replace(/\D/g, '')
    if (phoneDigits.length < 8 || phoneDigits.length > 15) {
      errors.phone = 'Số điện thoại phải từ 8–15 chữ số.'
    }
  }

  return errors
}

const hasErrors = (errors) => Object.values(errors).some(Boolean)

const TheaterProfileEditModal = ({ open, theater, saving, onClose, onSave }) => {
  const [values, setValues] = useState({
    name: '',
    city: '',
    address: '',
    description: '',
    phone: '',
    email: '',
    website: '',
    capacity: '',
    business_license: '',
    tax_code: '',
  })
  const [errors, setErrors] = useState(initialErrors)

  useEffect(() => {
    if (open && theater) {
      setValues({
        name: theater.name || '',
        city: theater.city || '',
        address: theater.address || '',
        description: theater.description || '',
        phone: theater.phone || '',
        email: theater.email || '',
        website: theater.website || '',
        capacity: theater.capacity ?? '',
        business_license: theater.business_license || '',
        tax_code: theater.tax_code || '',
      })
      setErrors(initialErrors)
    }
  }, [open, theater])

  if (!open) return null

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validate(values)
    setErrors(validationErrors)
    if (hasErrors(validationErrors)) return

    await onSave({
      name: values.name.trim(),
      city: values.city.trim(),
      address: values.address.trim(),
      description: values.description.trim(),
      phone: values.phone.trim() || null,
      email: values.email.trim() || null,
      website: values.website.trim() || null,
      capacity: values.capacity === '' ? null : Number(values.capacity),
      business_license: values.business_license.trim() || null,
      tax_code: values.tax_code.trim() || null,
    })
  }

  const renderInput = (props) => {
    const { label, name, type = 'text', textarea = false, required = false, rows = 3 } = props
    const error = errors[name]
    const commonProps = {
      name,
      id: name,
      value: values[name],
      onChange: handleChange,
      className: `w-full rounded-lg border px-3 py-2 text-sm bg-background-dark text-slate-100 border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/60 ${
        error ? 'border-red-500 focus:ring-red-500/60' : ''
      }`,
    }

    return (
      <div className="space-y-1">
        <label htmlFor={name} className="text-xs font-semibold text-slate-300">
          {label} {required && <span className="text-red-400">*</span>}
        </label>
        {textarea ? (
          <textarea {...commonProps} rows={rows} />
        ) : (
          <input {...commonProps} type={type} />
        )}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-surface-dark border border-border-gold rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-gold">
          <h2 className="text-lg font-semibold text-slate-100">Chỉnh sửa hồ sơ nhà hát</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form
          id="theater-profile-edit-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-4 space-y-6"
        >
          {/* Section 1: Thông tin cơ bản */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Thông tin cơ bản</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {renderInput({ label: 'Tên nhà hát', name: 'name', required: true })}
              {renderInput({ label: 'Thành phố', name: 'city', required: true })}
              <div className="md:col-span-2">
                {renderInput({
                  label: 'Địa chỉ',
                  name: 'address',
                  textarea: true,
                  rows: 2,
                  required: true,
                })}
              </div>
              <div className="md:col-span-2">
                {renderInput({
                  label: 'Mô tả',
                  name: 'description',
                  textarea: true,
                  rows: 3,
                })}
                <p className="mt-1 text-xs text-slate-500">Tối đa 500 ký tự.</p>
              </div>
            </div>
          </section>

          {/* Section 2: Liên hệ */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Thông tin liên hệ</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {renderInput({ label: 'Số điện thoại', name: 'phone', type: 'tel' })}
              {renderInput({ label: 'Email liên hệ', name: 'email', type: 'email' })}
              {renderInput({ label: 'Website', name: 'website', type: 'url' })}
            </div>
          </section>

          {/* Section 3: Thông số */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Thông số</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {renderInput({
                label: 'Tổng sức chứa (ghế)',
                name: 'capacity',
                type: 'number',
              })}
            </div>
          </section>

          {/* Section 4: Pháp lý */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">Thông tin pháp lý</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {renderInput({ label: 'Số giấy phép kinh doanh', name: 'business_license' })}
              {renderInput({ label: 'Mã số thuế', name: 'tax_code' })}
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-border-gold flex items-center justify-end gap-3 bg-background-dark/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-200 text-sm hover:bg-background-dark transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            form="theater-profile-edit-form"
            className="px-5 py-2 rounded-lg bg-primary text-background-dark text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default TheaterProfileEditModal

