export const validateEventForm = (data) => {
  const errors = {}

  if (!data.type) errors.type = 'Vui lòng chọn loại sự kiện'
  if (!data.title) errors.title = 'Tiêu đề là bắt buộc'
  if (!data.event_date) errors.event_date = 'Ngày diễn ra là bắt buộc'
  if (!data.max_participants || data.max_participants < 1) {
    errors.max_participants = 'Số người tham dự phải lớn hơn 0'
  }
  if (data.price === undefined || data.price < 0) {
    errors.price = 'Giá vé không hợp lệ'
  }
  if (data.event_date && new Date(data.event_date) < new Date()) {
    errors.event_date = 'Ngày sự kiện phải là trong tương lai'
  }

  return errors
}

export const EVENT_TYPE_LABELS = {
  workshop: '🎨 Workshop',
  tour: '🗺️ Tour Tham Quan',
  meet_artist: '🎭 Gặp Gỡ Nghệ Sĩ',
}

export const EVENT_STATUS_CONFIG = {
  draft: { label: 'Bản nháp', color: 'gray' },
  scheduled: { label: 'Đã lên lịch', color: 'green' },
  ongoing: { label: 'Đang diễn ra', color: 'green' },
  cancelled: { label: 'Đã hủy', color: 'red' },
  completed: { label: 'Đã kết thúc', color: 'purple' },
}

export const formatPrice = (price) =>
  price === 0 ? 'Miễn phí' : `${price.toLocaleString('vi-VN')}đ`

export const getParticipantProgress = (current = 0, max = 0) => {
  if (!max || max <= 0) {
    return {
      percent: 0,
      isFull: false,
      remaining: 0,
    }
  }

  const clampedCurrent = Math.max(0, current)
  const percent = Math.round((clampedCurrent / max) * 100)

  return {
    percent,
    isFull: clampedCurrent >= max,
    remaining: Math.max(0, max - clampedCurrent),
  }
}

