import { supabase } from '../lib/supabase'

// ============================================
// SCHEDULE SERVICE
// ============================================

/**
 * Create schedule
 */
export const createSchedule = async (scheduleData) => {
  const { data, error } = await supabase
    .from('schedules')
    .insert(scheduleData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all schedules (public)
 */
export const getSchedules = async (filters = {}) => {
  let query = supabase
    .from('schedules')
    .select(`
      *,
      theater:theaters(*),
      venue:venues(*)
    `)
    // Chỉ hiển thị các lịch công khai cho phía public
    .in('status', ['scheduled', 'ongoing', 'completed'])
    .order('start_datetime', { ascending: true })

  // Apply filters
  if (filters.city) {
    query = query.eq('venue.city', filters.city)
  }

  if (filters.theaterId) {
    query = query.eq('theater_id', filters.theaterId)
  }

  if (filters.showId) {
    query = query.eq('show_id', filters.showId)
  }

  if (filters.startDate) {
    query = query.gte('start_datetime', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('start_datetime', filters.endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get schedule by ID
 */
export const getScheduleById = async (scheduleId) => {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      theater:theaters(*),
      venue:venues(*)
    `)
    .eq('id', scheduleId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get schedules by theater
 */
export const getSchedulesByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('schedules')
    .select(`
      *,
      venue:venues(*)
    `)
    .eq('theater_id', theaterId)
    .order('start_datetime', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Update schedule
 */
export const updateSchedule = async (scheduleId, updates) => {
  const { data, error } = await supabase
    .from('schedules')
    .update(updates)
    .eq('id', scheduleId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete schedule
 */
export const deleteSchedule = async (scheduleId) => {
  const { error } = await supabase
    .from('schedules')
    .delete()
    .eq('id', scheduleId)

  if (error) throw error
}

/**
 * Cancel schedule
 */
export const cancelSchedule = async (scheduleId) => {
  return updateSchedule(scheduleId, { status: 'cancelled' })
}

// ============================================
// SEAT SERVICE (theater seats are per hall, not per schedule)
// ============================================
// Bảng `seats` có: id, hall_id, row_number, seat_number, seat_type, status, ...
// Ghế thuộc hall; trạng thái đã đặt theo từng lịch diễn lấy từ bảng bookings (schedule_id + seat_ids).
// Lấy danh sách ghế theo hall: dùng getSeatsByHall(hallId) từ hallService.
// Lấy ghế đã đặt cho một schedule: dùng getBookedSeatIdsForSchedule(scheduleId) từ bookingService.

/**
 * Reserve seats – no-op: bảng seats không có reserved_by/reserved_until.
 * Việc "giữ ghế" thực hiện bằng tạo booking pending khi user chuyển sang bước tóm tắt.
 */
export const reserveSeats = async (_seatIds, _userId, _minutes = 10) => {
  return []
}

/**
 * Release reserved seats – no-op: giải phóng ghế thực tế qua cancel booking.
 */
export const releaseSeats = async (_seatIds) => {
  return []
}

/**
 * Mark seats as occupied – no-op: trạng thái đã đặt theo booking (confirmed), không cập nhật bảng seats.
 */
export const occupySeats = async (_seatIds) => {
  return []
}

/**
 * Cleanup expired reservations – có thể gọi cancel các booking pending hết hạn (xử lý ở backend/cron).
 */
export const cleanupExpiredReservations = async () => {
  return []
}

// ============================================
// SHOW SERVICE
// ============================================

/**
 * Get all shows
 */
export const getShows = async () => {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .order('title')

  if (error) throw error
  return data
}

/**
 * Get show by ID
 */
export const getShowById = async (showId) => {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('id', showId)
    .single()

  if (error) throw error
  return data
}

/**
 * Create show (Admin only)
 */
export const createShow = async (showData) => {
  const { data, error } = await supabase
    .from('shows')
    .insert(showData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update show (Admin only)
 */
export const updateShow = async (showId, updates) => {
  const { data, error } = await supabase
    .from('shows')
    .update(updates)
    .eq('id', showId)
    .select()
    .single()

  if (error) throw error
  return data
}
