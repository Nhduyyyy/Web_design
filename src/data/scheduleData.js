// Lịch diễn — khớp với danh sách vở diễn trong trang Vở diễn (TuongPerformance)
// Vở diễn: 1 Sơn Hậu, 2 Đào Tam Xuân, 3 Trần Bình Trọng, 4 San Hậu, 5 Lưu Kim Đính
// Fields: id, title, showId (trùng id vở diễn), description, startDatetime, endDatetime, venue, status, tags, ticketUrl

export const events = [
  {
    id: 'ev-001',
    title: 'Sơn Hậu (Tam nữ đồ vương)',
    showId: 1,
    description: 'Cuộc chiến giành ngai vàng — hoàng hậu, công chúa, cung nữ bảo vệ hoàng tử, phục hồi triều đình.',
    startDatetime: '2026-03-12T19:00:00+07:00',
    endDatetime: '2026-03-12T20:30:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hn-nk', name: 'Nhà hát Lớn Hà Nội', city: 'Hà Nội', address: '1 Tràng Tiền, Hoàn Kiếm' },
    status: 'scheduled',
    ticketUrl: 'https://www.nhahatdal.vn/dat-ve',
    tags: ['cổ điển', 'tam nữ đồ vương']
  },
  {
    id: 'ev-002',
    title: 'Đào Tam Xuân loạn trào',
    showId: 2,
    description: 'Nữ tướng bị hãm hại, mất chồng con — đem quân đòi công lý, loạn trào rồi quay về trung nghĩa.',
    startDatetime: '2026-03-13T18:00:00+07:00',
    endDatetime: '2026-03-13T19:15:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hcm-nt', name: 'Nhà hát Thành Phố', city: 'Hồ Chí Minh', address: '7 Công Trường Lam Sơn' },
    status: 'scheduled',
    ticketUrl: 'https://www.nhahatdal.vn/dat-ve',
    tags: ['truyền thống', 'nữ tướng']
  },
  {
    id: 'ev-003',
    title: 'Trần Bình Trọng',
    showId: 3,
    description: 'Tướng nhà Trần bị bắt, quân Nguyên dụ làm vua bù nhìn — "Ta thà làm quỷ nước Nam..." và hi sinh anh dũng.',
    startDatetime: '2026-03-15T19:00:00+07:00',
    endDatetime: '2026-03-15T20:00:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hn-nk', name: 'Nhà hát Lớn Hà Nội', city: 'Hà Nội', address: '1 Tràng Tiền, Hoàn Kiếm' },
    status: 'scheduled',
    ticketUrl: 'https://www.nhahatdal.vn/dat-ve',
    tags: ['lịch sử', 'Trần Bình Trọng']
  },
  {
    id: 'ev-004',
    title: 'San Hậu (Hồ Nguyệt Cô hóa cáo)',
    showId: 4,
    description: 'Hồ ly tinh tu luyện thành người, yêu tướng quân, bị lừa mất ngọc — mất phép, hóa lại thành cáo.',
    startDatetime: '2026-03-18T19:00:00+07:00',
    endDatetime: '2026-03-18T20:20:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-dn-bana', name: 'Công viên Bà Nà', city: 'Đà Nẵng', address: 'Bà Nà Hills' },
    status: 'scheduled',
    ticketUrl: 'https://www.nhahatdal.vn/dat-ve',
    tags: ['truyền thống', 'hồ nguyệt cô']
  },
  {
    id: 'ev-005',
    title: 'Lưu Kim Đính giải giá Thọ Châu',
    showId: 5,
    description: 'Nữ tướng giả trai ra trận, cứu vua bị vây ở Thọ Châu — phá vòng vây, thân phận tiết lộ, được phong thưởng.',
    startDatetime: '2026-03-20T19:00:00+07:00',
    endDatetime: '2026-03-20T20:25:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hcm-nt', name: 'Nhà hát Thành Phố', city: 'Hồ Chí Minh', address: '7 Công Trường Lam Sơn' },
    status: 'scheduled',
    ticketUrl: 'https://www.nhahatdal.vn/dat-ve',
    tags: ['cổ điển', 'nữ tướng']
  },
  {
    id: 'ev-006',
    title: 'Tuồng: Thử vai cộng đồng — Workshop',
    showId: null,
    description: 'Workshop tương tác: thử vai, học kỹ thuật diễn Tuồng cơ bản dành cho những người yêu thích nghệ thuật truyền thống.',
    startDatetime: '2026-03-22T10:00:00+07:00',
    endDatetime: '2026-03-22T13:00:00+07:00',
    timezone: 'Asia/Ho_Chi_Minh',
    venue: { id: 'v-hcm-studio', name: 'Studio Văn Hóa', city: 'Hồ Chí Minh', address: '45 Đường Văn Hóa' },
    status: 'scheduled',
    ticketUrl: 'https://example.com/tickets/ev-006',
    tags: ['workshop', 'thử vai']
  }
]

export function getCities(eventsList = events) {
  const s = new Set()
  eventsList.forEach(e => { if (e.venue && e.venue.city) s.add(e.venue.city) })
  return Array.from(s).sort()
}

import { validateEvents } from '../utils/scheduleValidator'

export function getValidatedEvents() {
  const { valid, invalid } = validateEvents(events)
  return { events: valid, invalid }
}
