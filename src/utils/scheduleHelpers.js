import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

export const STATUS_OPTIONS = ['draft', 'published', 'cancelled', 'completed']

export function formatDateTime(dt) {
  if (!dt) return ''
  try {
    return format(new Date(dt), 'dd/MM/yyyy HH:mm', { locale: vi })
  } catch {
    return ''
  }
}

export function validateSchedulePayload(form) {
  const errors = {}

  if (!form.show_id) errors.show_id = 'Vui lòng chọn vở diễn'
  if (!form.venue_id) errors.venue_id = 'Vui lòng chọn địa điểm'
  if (!form.title || !form.title.trim()) errors.title = 'Tiêu đề không được để trống'
  if (form.title && form.title.length > 255) {
    errors.title = 'Tiêu đề tối đa 255 ký tự'
  }

  if (!form.start_datetime) errors.start_datetime = 'Chọn thời gian bắt đầu'
  if (!form.end_datetime) errors.end_datetime = 'Chọn thời gian kết thúc'

  if (form.start_datetime && form.end_datetime && form.end_datetime <= form.start_datetime) {
    errors.end_datetime = 'Thời gian kết thúc phải sau bắt đầu'
  }

  if (form.ticket_url && !/^https?:\/\//i.test(form.ticket_url)) {
    errors.ticket_url = 'URL phải bắt đầu bằng http:// hoặc https://'
  }

  if (form.pricing?.tiers?.length) {
    form.pricing.tiers.forEach((tier, idx) => {
      if (!tier.name || !tier.name.trim()) {
        errors[`pricing_${idx}_name`] = 'Tên loại vé không được để trống'
      }
      if (tier.price == null || tier.price < 0) {
        errors[`pricing_${idx}_price`] = 'Giá vé phải ≥ 0'
      }
    })
  }

  return errors
}

