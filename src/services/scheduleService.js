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
      show:shows(*),
      venue:venues(*)
    `)
    .in('status', ['scheduled', 'ongoing'])
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
      show:shows(*),
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
      show:shows(*),
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
// SEAT SERVICE
// ============================================

/**
 * Generate seats for schedule
 */
export const generateSeats = async (scheduleId, rows = 10, seatsPerRow = 12) => {
  const { data, error } = await supabase.rpc('generate_seats_for_schedule', {
    p_schedule_id: scheduleId,
    p_rows: rows,
    p_seats_per_row: seatsPerRow
  })

  if (error) throw error
  return data
}

/**
 * Get seats for schedule
 */
export const getSeatsBySchedule = async (scheduleId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('row_label')
    .order('seat_number')

  if (error) throw error
  return data
}

/**
 * Get available seats
 */
export const getAvailableSeats = async (scheduleId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('schedule_id', scheduleId)
    .eq('status', 'available')
    .order('row_label')
    .order('seat_number')

  if (error) throw error
  return data
}

/**
 * Reserve seats (temporary hold)
 */
export const reserveSeats = async (seatIds, userId, minutes = 10) => {
  const reservedUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('seats')
    .update({
      status: 'reserved',
      reserved_by: userId,
      reserved_until: reservedUntil
    })
    .in('id', seatIds)
    .eq('status', 'available')
    .select()

  if (error) throw error
  return data
}

/**
 * Release reserved seats
 */
export const releaseSeats = async (seatIds) => {
  const { data, error } = await supabase
    .from('seats')
    .update({
      status: 'available',
      reserved_by: null,
      reserved_until: null
    })
    .in('id', seatIds)
    .select()

  if (error) throw error
  return data
}

/**
 * Mark seats as occupied
 */
export const occupySeats = async (seatIds) => {
  const { data, error } = await supabase
    .from('seats')
    .update({
      status: 'occupied',
      reserved_by: null,
      reserved_until: null
    })
    .in('id', seatIds)
    .select()

  if (error) throw error
  return data
}

/**
 * Cleanup expired reservations
 */
export const cleanupExpiredReservations = async () => {
  const { data, error } = await supabase
    .from('seats')
    .update({
      status: 'available',
      reserved_by: null,
      reserved_until: null
    })
    .eq('status', 'reserved')
    .lt('reserved_until', new Date().toISOString())
    .select()

  if (error) throw error
  return data
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
