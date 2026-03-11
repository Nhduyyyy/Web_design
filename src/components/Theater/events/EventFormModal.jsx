import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabase'
import { validateEventForm } from '../../../utils/eventHelpers'

const EMPTY_FORM = {
  type: '',
  title: '',
  description: '',
  thumbnail_url: '',
  event_date: '',
  duration: '',
  venue_id: '',
  max_participants: '',
  price: '',
  instructor: '',
  guide: '',
  artists: [],
  requirements: [],
  includes: [],
  tags: [],
  status: 'draft',
}

const parseArrayInput = (value) =>
  value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

const serializeArrayInput = (arr) => (Array.isArray(arr) ? arr.join(', ') : '')

const EventFormModal = ({ theaterId, event, onSubmit, onClose }) => {
  const isEdit = !!event
  const [form, setForm] = useState(EMPTY_FORM)
  const [venues, setVenues] = useState([])
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!theaterId) return
    supabase
      .from('venues')
      .select('id, name')
      .eq('theater_id', theaterId)
      .then(({ data }) => setVenues(data || []))
  }, [theaterId])

  useEffect(() => {
    if (event) {
      setForm({
        type: event.type || '',
        title: event.title || '',
        description: event.description || '',
        thumbnail_url: event.thumbnail_url || '',
        event_date: event.event_date
          ? event.event_date.slice(0, 16)
          : '',
        duration: event.duration || '',
        venue_id: event.venue_id || '',
        max_participants: event.max_participants || '',
        price: event.price || '',
        instructor: event.instructor || '',
        guide: event.guide || '',
        artists: event.artists || [],
        requirements: event.requirements || [],
        includes: event.includes || [],
        tags: event.tags || [],
        status: event.status || 'draft',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [event])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      duration: form.duration ? Number(form.duration) : null,
      max_participants: form.max_participants
        ? Number(form.max_participants)
        : null,
      price: form.price !== '' ? Number(form.price) : 0,
      event_date: form.event_date
        ? new Date(form.event_date).toISOString()
        : null,
    }

    const validationErrors = validateEventForm(payload)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(payload)
      setErrors({})
    } catch (err) {
      console.error('Error submitting event form:', err)
      setErrors({ general: err.message || 'Không thể lưu sự kiện' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-xl border border-border-gold bg-surface-dark p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-100">
              {isEdit ? 'Chỉnh sửa sự kiện' : 'Tạo sự kiện mới'}
            </h2>
            <p className="text-xs text-slate-400">
              Điền đầy đủ thông tin để người xem hiểu rõ về sự kiện của bạn.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-background-dark hover:text-slate-100"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {errors.general && (
          <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Thông tin cơ bản */}
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Thông tin cơ bản
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Loại sự kiện *
                </label>
                <select
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={form.type}
                  onChange={(e) => handleChange('type', e.target.value)}
                >
                  <option value="">Chọn loại</option>
                  <option value="workshop">Workshop</option>
                  <option value="tour">Tour tham quan</option>
                  <option value="meet_artist">Gặp gỡ nghệ sĩ</option>
                </select>
                {errors.type && (
                  <p className="mt-1 text-xs text-red-400">{errors.type}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Ảnh bìa (URL)
                </label>
                <input
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={form.thumbnail_url}
                  onChange={(e) =>
                    handleChange('thumbnail_url', e.target.value)
                  }
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Tiêu đề *
              </label>
              <input
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.title}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="Tên sự kiện"
              />
              {errors.title && (
                <p className="mt-1 text-xs text-red-400">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Mô tả
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.description}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Giới thiệu tổng quan về sự kiện..."
              />
            </div>
          </section>

          {/* Thời gian & Địa điểm */}
          <section className="space-y-3 border-t border-border-gold/40 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Thời gian &amp; Địa điểm
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Ngày &amp; giờ *
                </label>
                <input
                  type="datetime-local"
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={form.event_date}
                  onChange={(e) => handleChange('event_date', e.target.value)}
                />
                {errors.event_date && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.event_date}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Thời lượng (phút)
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={form.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Địa điểm
              </label>
              <select
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.venue_id}
                onChange={(e) => handleChange('venue_id', e.target.value)}
              >
                <option value="">Chọn địa điểm</option>
                {venues.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </section>

          {/* Người tham gia & Giá */}
          <section className="space-y-3 border-t border-border-gold/40 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Người tham gia &amp; Giá
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Số người tối đa *
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={form.max_participants}
                  onChange={(e) =>
                    handleChange('max_participants', e.target.value)
                  }
                />
                {errors.max_participants && (
                  <p className="mt-1 text-xs text-red-400">
                    {errors.max_participants}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Giá vé (VNĐ) *
                </label>
                <input
                  type="number"
                  min="0"
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={form.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                />
                {errors.price && (
                  <p className="mt-1 text-xs text-red-400">{errors.price}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Giảng viên / Hướng dẫn
                </label>
                <input
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={form.instructor}
                  onChange={(e) => handleChange('instructor', e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Nội dung chi tiết */}
          <section className="space-y-3 border-t border-border-gold/40 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Nội dung chi tiết
            </h3>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">
                Hướng dẫn chi tiết
              </label>
              <textarea
                className="min-h-[80px] w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.guide}
                onChange={(e) => handleChange('guide', e.target.value)}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Nghệ sĩ tham gia (cách nhau bởi dấu phẩy)
                </label>
                <input
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={serializeArrayInput(form.artists)}
                  onChange={(e) =>
                    handleChange('artists', parseArrayInput(e.target.value))
                  }
                  placeholder="Nghệ sĩ A, Nghệ sĩ B, ..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Yêu cầu tham gia
                </label>
                <input
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={serializeArrayInput(form.requirements)}
                  onChange={(e) =>
                    handleChange(
                      'requirements',
                      parseArrayInput(e.target.value)
                    )
                  }
                  placeholder="Mang giấy tờ tùy thân, ..."
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Bao gồm trong vé
                </label>
                <input
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={serializeArrayInput(form.includes)}
                  onChange={(e) =>
                    handleChange('includes', parseArrayInput(e.target.value))
                  }
                  placeholder="Vé vào cửa, đồ uống, ..."
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-300">
                  Tags
                </label>
                <input
                  className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                  value={serializeArrayInput(form.tags)}
                  onChange={(e) =>
                    handleChange('tags', parseArrayInput(e.target.value))
                  }
                  placeholder="trải nghiệm, thiếu nhi, ..."
                />
              </div>
            </div>
          </section>

          {/* Trạng thái */}
          <section className="space-y-3 border-t border-border-gold/40 pt-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Trạng thái
            </h3>
            <div className="flex flex-wrap items-center gap-4">
              <select
                className="rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Đăng ngay</option>
              </select>
              <p className="text-xs text-slate-500">
                Bạn luôn có thể chỉnh sửa và đổi trạng thái sau này.
              </p>
            </div>
          </section>

          <div className="mt-4 flex justify-end gap-2 border-t border-border-gold/40 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-gold px-4 py-2 text-sm font-medium text-slate-200 hover:bg-background-dark"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:bg-primary/90 disabled:opacity-70"
            >
              {submitting
                ? 'Đang lưu...'
                : isEdit
                ? 'Cập nhật sự kiện'
                : 'Tạo sự kiện'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EventFormModal

