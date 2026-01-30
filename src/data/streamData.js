// Live stream and replay data

export const liveStreams = [
  {
    id: 'live-001',
    title: 'Tuồng: Quan Công - Chiến Trường (Live)',
    description: 'Xem trực tiếp buổi diễn Quan Công với cảnh chiến trường đầy kịch tính',
    eventId: 'ev-001',
    streamUrl: 'https://example.com/stream/live-001',
    thumbnail: 'https://via.placeholder.com/640x360?text=Live+Stream',
    status: 'live', // live, upcoming, ended
    startTime: '2026-03-12T19:00:00+07:00',
    endTime: '2026-03-12T21:00:00+07:00',
    viewers: 1250,
    isFree: true,
    partner: 'Nhà hát Lớn Hà Nội'
  },
  {
    id: 'live-002',
    title: 'Tuồng: Thị Kính - Gia Đình (Live)',
    description: 'Buổi diễn trực tiếp Thị Kính với nhiều cảnh cảm động',
    eventId: 'ev-002',
    streamUrl: 'https://example.com/stream/live-002',
    thumbnail: 'https://via.placeholder.com/640x360?text=Live+Stream+2',
    status: 'upcoming',
    startTime: '2026-03-13T18:00:00+07:00',
    endTime: '2026-03-13T20:00:00+07:00',
    viewers: 0,
    isFree: false,
    price: 100000, // 100k VND
    partner: 'Nhà hát Thành Phố'
  }
]

export const replays = [
  {
    id: 'replay-001',
    title: 'Tuồng: Sơn Hậu (Tam nữ đồ vương) - Replay',
    description: 'Cuộc chiến giành ngai vàng với ba người phụ nữ trung nghĩa',
    eventId: 'ev-001',
    streamUrl: 'https://example.com/replay/replay-001',
    thumbnail: 'https://via.placeholder.com/640x360?text=Replay+1',
    originalDate: '2026-02-15T19:00:00+07:00',
    duration: 5400, // seconds (90 minutes)
    accessType: 'free', // free, paid, ad-supported
    price: 0,
    views: 3450,
    partner: 'Nhà hát Lớn Hà Nội'
  },
  {
    id: 'replay-002',
    title: 'Tuồng: Đào Tam Xuân loạn trào - Replay',
    description: 'Nữ tướng bị hãm hại, đem quân đòi công lý',
    eventId: 'ev-002',
    streamUrl: 'https://example.com/replay/replay-002',
    thumbnail: 'https://via.placeholder.com/640x360?text=Replay+2',
    originalDate: '2026-02-20T18:00:00+07:00',
    duration: 4500, // seconds (75 minutes)
    accessType: 'paid',
    price: 150000, // 150k VND
    views: 2100,
    partner: 'Nhà hát Thành Phố'
  },
  {
    id: 'replay-003',
    title: 'Tuồng: Trần Bình Trọng - Replay',
    description: 'Tướng nhà Trần hi sinh anh dũng với câu nói nổi tiếng',
    eventId: 'ev-003',
    streamUrl: 'https://example.com/replay/replay-003',
    thumbnail: 'https://via.placeholder.com/640x360?text=Replay+3',
    originalDate: '2026-02-25T19:00:00+07:00',
    duration: 3600, // seconds (60 minutes)
    accessType: 'ad-supported', // Xem với quảng cáo
    price: 0,
    adCount: 3, // Số lượng quảng cáo trong video
    views: 5200,
    partner: 'Công viên Bà Nà'
  },
  {
    id: 'replay-004',
    title: 'Tuồng: San Hậu (Hồ Nguyệt Cô hóa cáo) - Replay',
    description: 'Hồ ly tinh tu luyện thành người, bi kịch tình yêu',
    eventId: 'ev-004',
    streamUrl: 'https://example.com/replay/replay-004',
    thumbnail: 'https://via.placeholder.com/640x360?text=Replay+4',
    originalDate: '2026-03-01T19:00:00+07:00',
    duration: 4800, // seconds (80 minutes)
    accessType: 'paid',
    price: 200000, // 200k VND
    views: 1800,
    partner: 'Rạp Cải Lương Truyền Thống'
  },
  {
    id: 'replay-005',
    title: 'Tuồng: Lưu Kim Đính giải giá Thọ Châu - Replay',
    description: 'Nữ tướng giả trai ra trận, cứu vua bị vây',
    eventId: 'ev-005',
    streamUrl: 'https://example.com/replay/replay-005',
    thumbnail: 'https://via.placeholder.com/640x360?text=Replay+5',
    originalDate: '2026-03-05T19:00:00+07:00',
    duration: 5100, // seconds (85 minutes)
    accessType: 'free',
    price: 0,
    views: 8900,
    partner: 'Studio Văn Hóa'
  }
]

// Helper functions
export function getLiveStreams() {
  return liveStreams.filter(stream => stream.status === 'live' || stream.status === 'upcoming')
}

export function getReplaysByType(type = 'all') {
  if (type === 'all') return replays
  return replays.filter(replay => replay.accessType === type)
}

export function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')} giờ`
  }
  return `${minutes} phút`
}
