// Minimal event dataset for the "Lịch diễn" MVP
// Fields: id, title, showId (references character/performance), description,
// startDatetime/endDatetime (ISO), timezone, venue, status, tags, ticketUrl

export const events = [
  {
    id: 'ev-001',
    title: 'Tuồng: Quan Công - Chiến Trường',
    showId: 1,
    description: 'Màn tái hiện Quan Công trong cảnh chiến trường. Có võ thuật và múa.',
    startDatetime: '2026-03-12T19:00:00+07:00',
    endDatetime: '2026-03-12T21:00:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hn-nk', name: 'Nhà hát Lớn Hà Nội', city: 'Hà Nội', address: '1 Tràng Tiền, Hoàn Kiếm' },
    status: 'scheduled',
    ticketUrl: null,
    tags: ['tam-quoc', 'quandong']
  },
  {
    id: 'ev-002',
    title: 'Tuồng: Thị Kính - Gia Đình',
    showId: 2,
    description: 'Câu chuyện Thị Kính với nhiều cảnh cảm động và âm nhạc truyền thống.',
    startDatetime: '2026-03-13T18:00:00+07:00',
    endDatetime: '2026-03-13T20:00:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hcm-nt', name: 'Nhà hát Thành Phố', city: 'Hồ Chí Minh', address: '7 Công Trường Lam Sơn' },
    status: 'scheduled',
    ticketUrl: null,
    tags: ['nu', 'gia-dinh']
  },
  {
    id: 'ev-003',
    title: 'Tuồng: Tam Quốc - Doanh Trại (Festival)',
    showId: 3,
    description: 'Biểu diễn chủ đề Tam Quốc trong khuôn khổ festival văn hóa.',
    startDatetime: '2026-04-02T17:30:00+07:00',
    endDatetime: '2026-04-02T19:30:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-dn-fest', name: 'Công viên Bà Nà', city: 'Đà Nẵng', address: 'Bà Nà Hills' },
    status: 'scheduled',
    ticketUrl: 'https://example.com/tickets/ev-003',
    tags: ['festival', 'tam-quoc']
  },
  {
    id: 'ev-004',
    title: 'Tuồng: Quan Công — Buổi biểu diễn đặc biệt (Hủy)',
    showId: 1,
    description: 'Buổi bổ sung nhưng đã bị hủy.',
    startDatetime: '2026-03-20T19:00:00+07:00',
    endDatetime: '2026-03-20T21:00:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hn-ct', name: 'Rạp Cải Lương Truyền Thống', city: 'Hà Nội', address: 'Số 8, Phố X' },
    status: 'canceled',
    ticketUrl: null,
    tags: ['special']
  },
  {
    id: 'ev-005',
    title: 'Tuồng: Thử vai cộng đồng — Workshop',
    showId: null,
    description: 'Workshop tương tác: thử vai, học kỹ thuật diễn Tuồng.',
    startDatetime: '2026-03-18T10:00:00+07:00',
    endDatetime: '2026-03-18T13:00:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hcm-studio', name: 'Studio Văn Hóa', city: 'Hồ Chí Minh', address: '45 Đường Văn Hóa' },
    status: 'scheduled',
    ticketUrl: 'https://example.com/tickets/ev-005',
    tags: ['workshop', 'tryrole']
  }
]

export function getCities(eventsList = events) {
  const s = new Set()
  eventsList.forEach(e => { if (e.venue && e.venue.city) s.add(e.venue.city) })
  return Array.from(s).sort()
}

// Canonical accessor that validates events at load time. Returns { events, invalid }
import { validateEvents } from '../utils/scheduleValidator'

export function getValidatedEvents() {
  const { valid, invalid } = validateEvents(events)
  return { events: valid, invalid }
}

