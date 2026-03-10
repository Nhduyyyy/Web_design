import { useEffect, useState } from 'react'
import PricingEditor from './PricingEditor'
import { STATUS_OPTIONS, validateSchedulePayload } from '../../../utils/scheduleHelpers'
import { getShows } from '../../../services/scheduleService'
import { getVenuesByTheater } from '../../../services/theaterService'

export default function ScheduleFormModal({ theaterId, schedule, onSubmit, onClose }) {
  const isEdit = !!schedule

  const [form, setForm] = useState({
    show_id: schedule?.show_id || '',
    venue_id: schedule?.venue_id || '',
    title: schedule?.title || '',
    description: schedule?.description || '',
    start_datetime: schedule?.start_datetime?.slice(0, 16) || '',
    end_datetime: schedule?.end_datetime?.slice(0, 16) || '',
    timezone: schedule?.timezone || 'Asia/Ho_Chi_Minh(UTC+7)',
    status: schedule?.status || 'draft',
    ticket_url: schedule?.ticket_url || '',
    enable_booking: schedule?.enable_booking ?? false,
    pricing: schedule?.pricing || { tiers: [] },
  })

  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [shows, setShows] = useState([])
  const [venues, setVenues] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    let active = true
    const loadOptions = async () => {
      try {
        setLoadingOptions(true)
        const [showsData, venuesData] = await Promise.all([
          getShows().catch(() => []),
          theaterId ? getVenuesByTheater(theaterId).catch(() => []) : Promise.resolve([]),
        ])
        if (!active) return
        setShows(showsData || [])
        setVenues(venuesData || [])
      } finally {
        if (active) setLoadingOptions(false)
      }
    }
    loadOptions()
    return () => {
      active = false
    }
  }, [theaterId])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateSchedulePayload(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setSubmitting(true)
    const payload = {
      ...form,
      start_datetime: new Date(form.start_datetime).toISOString(),
      end_datetime: new Date(form.end_datetime).toISOString(),
    }
    const result = await onSubmit(payload)
    if (result?.error) {
      setErrors({ general: result.error.message })
    } else {
      setErrors({})
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border-gold bg-surface-dark p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">
            {isEdit ? 'Chỉnh sửa lịch diễn' : 'Tạo lịch diễn mới'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Tiêu đề *
            </label>
            <input
              className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            {errors.title && <p className="mt-1 text-xs text-red-400">{errors.title}</p>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Vở diễn *
              </label>
              <select
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.show_id}
                onChange={(e) => handleChange('show_id', e.target.value)}
                disabled={loadingOptions}
              >
                <option value="">Chọn vở diễn</option>
                {shows.map((show) => (
                  <option key={show.id} value={show.id}>
                    {show.title}
                  </option>
                ))}
              </select>
              {errors.show_id && (
                <p className="mt-1 text-xs text-red-400">{errors.show_id}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Địa điểm *
              </label>
              <select
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.venue_id}
                onChange={(e) => handleChange('venue_id', e.target.value)}
                disabled={loadingOptions || !theaterId}
              >
                <option value="">Chọn địa điểm</option>
                {venues.map((venue) => (
                  <option key={venue.id} value={venue.id}>
                    {venue.name}
                  </option>
                ))}
              </select>
              {errors.venue_id && (
                <p className="mt-1 text-xs text-red-400">{errors.venue_id}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Bắt đầu *
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.start_datetime}
                onChange={(e) => handleChange('start_datetime', e.target.value)}
              />
              {errors.start_datetime && (
                <p className="mt-1 text-xs text-red-400">{errors.start_datetime}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Kết thúc *
              </label>
              <input
                type="datetime-local"
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.end_datetime}
                onChange={(e) => handleChange('end_datetime', e.target.value)}
              />
              {errors.end_datetime && (
                <p className="mt-1 text-xs text-red-400">{errors.end_datetime}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Trạng thái
              </label>
              <select
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Múi giờ
              </label>
              <input
                className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
                value={form.timezone}
                onChange={(e) => handleChange('timezone', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              Mô tả
            </label>
            <textarea
              className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
              rows={3}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              id="enable_booking"
              type="checkbox"
              className="h-4 w-4 rounded border-border-gold bg-background-dark text-primary"
              checked={form.enable_booking}
              onChange={(e) => handleChange('enable_booking', e.target.checked)}
            />
            <label htmlFor="enable_booking" className="text-sm text-slate-200">
              Bật đặt vé online
            </label>
          </div>

          {/* <div>
            <label className="mb-1 block text-sm font-medium text-slate-200">
              URL mua vé ngoài
            </label>
            <input
              className="w-full rounded-md border border-border-gold bg-background-dark px-3 py-2 text-sm text-slate-100"
              placeholder="https://..."
              value={form.ticket_url}
              onChange={(e) => handleChange('ticket_url', e.target.value)}
            />
            {errors.ticket_url && (
              <p className="mt-1 text-xs text-red-400">{errors.ticket_url}</p>
            )}
          </div> */}

          <PricingEditor
            pricing={form.pricing}
            onChange={(pricing) => handleChange('pricing', pricing)}
          />

          {errors.general && (
            <p className="mt-2 text-sm text-red-400">{errors.general}</p>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-border-gold px-4 py-2 text-sm font-medium text-slate-200 hover:bg-background-dark"
            >
              Huỷ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-background-dark hover:bg-primary/90 disabled:opacity-70"
            >
              {submitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

