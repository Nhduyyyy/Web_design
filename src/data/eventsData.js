// Events data: Workshops, Tours, Meet Artists — thumbnail từ public/weights + public/characters (tránh trùng)

const THUMBNAIL_IMAGES = [
  '/weights/1d8b9717-9762-4cf0-8319-2d2d94adcb9e.jpg',
  '/weights/image.jpg',
  '/characters/nv đào.png',
  '/characters/nv kép.png',
  '/characters/nv lão.png',
  '/characters/nv mụ.png',
  '/characters/nv nịnh.png',
  '/characters/nv tướng.png',
  '/characters/nv yêu đạo.png'
]

export const events = [
  {
    id: 'evt-001',
    type: 'workshop',
    title: 'Workshop Vẽ Mặt Nạ Tuồng',
    description: 'Học cách vẽ mặt nạ Tuồng truyền thống với nghệ sĩ chuyên nghiệp. Bạn sẽ được hướng dẫn từng bước để tạo ra chiếc mặt nạ của riêng mình.',
    thumbnail: THUMBNAIL_IMAGES[2],
    date: '2026-03-20T10:00:00+07:00',
    duration: 180, // minutes
    venue: {
      name: 'Studio Văn Hóa',
      address: '45 Đường Văn Hóa, Hồ Chí Minh',
      city: 'Hồ Chí Minh'
    },
    instructor: 'Nghệ sĩ Nguyễn Văn A',
    maxParticipants: 20,
    currentParticipants: 12,
    price: 500000, // 500k VND
    category: 'workshop',
    tags: ['vẽ mặt nạ', 'thủ công', 'nghệ thuật'],
    requirements: ['Không yêu cầu kinh nghiệm', 'Vật liệu đã được chuẩn bị sẵn'],
    includes: ['Mặt nạ trắng', 'Màu vẽ chuyên dụng', 'Tài liệu hướng dẫn', 'Chứng nhận tham gia']
  },
  {
    id: 'evt-002',
    type: 'workshop',
    title: 'Workshop Hóa Trang Cơ Bản Tuồng',
    description: 'Khám phá nghệ thuật hóa trang Tuồng. Học các kỹ thuật cơ bản để tạo ra các nhân vật Tuồng cổ điển.',
    thumbnail: THUMBNAIL_IMAGES[3],
    date: '2026-03-22T14:00:00+07:00',
    duration: 120, // minutes
    venue: {
      name: 'Nhà hát Lớn Hà Nội',
      address: '1 Tràng Tiền, Hoàn Kiếm',
      city: 'Hà Nội'
    },
    instructor: 'Nghệ sĩ Trần Thị B',
    maxParticipants: 15,
    currentParticipants: 8,
    price: 400000, // 400k VND
    category: 'workshop',
    tags: ['hóa trang', 'makeup', 'nghệ thuật'],
    requirements: ['Không yêu cầu kinh nghiệm', 'Mang theo gương nhỏ'],
    includes: ['Bộ dụng cụ hóa trang', 'Màu sơn chuyên dụng', 'Tài liệu', 'Chứng nhận']
  },
  {
    id: 'evt-003',
    type: 'tour',
    title: 'Tour Backstage - Khám Phá Hậu Trường',
    description: 'Tham quan hậu trường nhà hát, xem cách chuẩn bị cho một buổi diễn Tuồng. Gặp gỡ đội ngũ kỹ thuật và nghệ sĩ.',
    thumbnail: THUMBNAIL_IMAGES[4],
    date: '2026-03-18T09:00:00+07:00',
    duration: 90, // minutes
    venue: {
      name: 'Nhà hát Lớn Hà Nội',
      address: '1 Tràng Tiền, Hoàn Kiếm',
      city: 'Hà Nội'
    },
    guide: 'Nghệ sĩ Lê Văn C',
    maxParticipants: 25,
    currentParticipants: 18,
    price: 300000, // 300k VND
    category: 'tour',
    tags: ['backstage', 'thăm quan', 'hậu trường'],
    requirements: ['Đi giày đế bằng', 'Không chụp ảnh trong khu vực cấm'],
    includes: ['Hướng dẫn viên chuyên nghiệp', 'Tham quan phòng trang phục', 'Gặp gỡ nghệ sĩ', 'Quà lưu niệm']
  },
  {
    id: 'evt-004',
    type: 'tour',
    title: 'Tour Backstage - Đà Nẵng',
    description: 'Khám phá hậu trường tại Đà Nẵng, tìm hiểu về quy trình sản xuất và chuẩn bị cho các vở diễn.',
    thumbnail: THUMBNAIL_IMAGES[5],
    date: '2026-03-25T10:00:00+07:00',
    duration: 90,
    venue: {
      name: 'Công viên Bà Nà',
      address: 'Bà Nà Hills',
      city: 'Đà Nẵng'
    },
    guide: 'Nghệ sĩ Phạm Thị D',
    maxParticipants: 30,
    currentParticipants: 15,
    price: 250000, // 250k VND
    category: 'tour',
    tags: ['backstage', 'thăm quan', 'đà nẵng'],
    requirements: ['Đi giày đế bằng'],
    includes: ['Hướng dẫn viên', 'Tham quan studio', 'Quà lưu niệm']
  },
  {
    id: 'evt-005',
    type: 'meet-artist',
    title: 'Gặp Gỡ Nghệ Sĩ - Buổi Trò Chuyện Đặc Biệt',
    description: 'Gặp gỡ và trò chuyện với các nghệ sĩ Tuồng nổi tiếng. Tìm hiểu về cuộc sống và sự nghiệp của họ.',
    thumbnail: THUMBNAIL_IMAGES[6],
    date: '2026-03-21T19:00:00+07:00',
    duration: 120,
    venue: {
      name: 'Nhà hát Thành Phố',
      address: '7 Công Trường Lam Sơn',
      city: 'Hồ Chí Minh'
    },
    artists: ['Nghệ sĩ Nguyễn Văn A', 'Nghệ sĩ Trần Thị B', 'Nghệ sĩ Lê Văn C'],
    maxParticipants: 50,
    currentParticipants: 35,
    price: 200000, // 200k VND
    category: 'meet-artist',
    tags: ['gặp gỡ', 'trò chuyện', 'nghệ sĩ'],
    requirements: ['Đăng ký trước', 'Không quá 2 câu hỏi/người'],
    includes: ['Buổi trò chuyện', 'Chụp ảnh với nghệ sĩ', 'Ký tặng', 'Đồ uống nhẹ']
  },
  {
    id: 'evt-006',
    type: 'meet-artist',
    title: 'Gặp Gỡ Nghệ Sĩ - Masterclass',
    description: 'Lớp học đặc biệt với nghệ sĩ master. Học các kỹ thuật nâng cao và chia sẻ kinh nghiệm.',
    thumbnail: THUMBNAIL_IMAGES[7],
    date: '2026-03-24T15:00:00+07:00',
    duration: 150,
    venue: {
      name: 'Studio Văn Hóa',
      address: '45 Đường Văn Hóa',
      city: 'Hồ Chí Minh'
    },
    artists: ['Nghệ sĩ Master Nguyễn Văn A'],
    maxParticipants: 12,
    currentParticipants: 10,
    price: 800000, // 800k VND
    category: 'meet-artist',
    tags: ['masterclass', 'nâng cao', 'chuyên sâu'],
    requirements: ['Có kinh nghiệm cơ bản về Tuồng', 'Đăng ký sớm'],
    includes: ['Lớp học chuyên sâu', 'Tài liệu độc quyền', 'Chứng nhận masterclass', 'Bữa trưa']
  },
  {
    id: 'evt-007',
    type: 'workshop',
    title: 'Workshop Vẽ Mặt Nạ - Trẻ Em',
    description: 'Workshop đặc biệt dành cho trẻ em từ 8-15 tuổi. Học vẽ mặt nạ Tuồng trong môi trường vui vẻ và an toàn.',
    thumbnail: THUMBNAIL_IMAGES[8],
    date: '2026-03-19T09:00:00+07:00',
    duration: 120,
    venue: {
      name: 'Nhà hát Thành Phố',
      address: '7 Công Trường Lam Sơn',
      city: 'Hồ Chí Minh'
    },
    instructor: 'Nghệ sĩ Trần Thị B',
    maxParticipants: 30,
    currentParticipants: 22,
    price: 200000, // 200k VND
    category: 'workshop',
    tags: ['trẻ em', 'vẽ mặt nạ', 'giáo dục'],
    requirements: ['Trẻ em từ 8-15 tuổi', 'Có phụ huynh đi kèm'],
    includes: ['Mặt nạ trắng', 'Màu vẽ an toàn', 'Chứng nhận tham gia', 'Quà tặng']
  }
]

// Helper functions
export function getEventsByType(type = 'all') {
  if (type === 'all') return events
  return events.filter(event => event.type === type)
}

export function getUpcomingEvents() {
  const now = new Date()
  return events.filter(event => new Date(event.date) > now)
}

export function getAvailableEvents() {
  return events.filter(event => event.currentParticipants < event.maxParticipants)
}

export function formatEventDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** Định dạng cho card: "09:00 Thứ Tư, 18 tháng 3, 2026" */
export function formatEventDateForCard(dateString) {
  const d = new Date(dateString)
  const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  const weekday = d.toLocaleDateString('vi-VN', { weekday: 'long' })
  const day = d.getDate()
  const month = d.getMonth() + 1
  const year = d.getFullYear()
  return `${time} ${weekday}, ${day} tháng ${month}, ${year}`
}

export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours} giờ ${mins > 0 ? mins + ' phút' : ''}`
  }
  return `${mins} phút`
}

export const EVENT_TYPES = {
  workshop: { label: 'Workshop', icon: '🎨', color: '#4ECDC4' },
  tour: { label: 'Tour Backstage', icon: '🚪', color: '#FF6B6B' },
  'meet-artist': { label: 'Gặp Nghệ Sĩ', icon: '👋', color: '#FFD700' }
}
