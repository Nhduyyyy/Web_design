import { supabase } from '../lib/supabase'

// ============================================
// PLAY SERVICE
// ============================================

export const createPlay = async (playData) => {
  const { data, error } = await supabase
    .from('plays')
    .insert(playData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getPlaysByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('theater_id', theaterId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getActivePlaysByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('theater_id', theaterId)
    .eq('is_active', true)
    .order('title')

  if (error) throw error
  return data
}

export const getPlayById = async (playId) => {
  const { data, error } = await supabase
    .from('plays')
    .select('*')
    .eq('id', playId)
    .single()

  if (error) throw error
  return data
}

export const updatePlay = async (playId, updates) => {
  const { data, error } = await supabase
    .from('plays')
    .update(updates)
    .eq('id', playId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePlay = async (playId) => {
  const { error } = await supabase
    .from('plays')
    .delete()
    .eq('id', playId)

  if (error) throw error
}

// ============================================
// PERFORMANCE SERVICE
// ============================================

export const createPerformance = async (performanceData) => {
  const { data, error } = await supabase
    .from('performances')
    .insert(performanceData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getPerformancesByHall = async (hallId, startDate, endDate) => {
  let query = supabase
    .from('performances')
    .select(`
      *,
      play:plays(*),
      hall:halls(*)
    `)
    .eq('hall_id', hallId)

  if (startDate) {
    query = query.gte('performance_date', startDate)
  }
  if (endDate) {
    query = query.lte('performance_date', endDate)
  }

  const { data, error } = await query
    .order('performance_date')
    .order('start_time')

  if (error) throw error
  return data
}

export const getPerformancesByTheater = async (theaterId, startDate, endDate) => {
  let query = supabase
    .from('performances')
    .select(`
      *,
      play:plays(*),
      hall:halls(*)
    `)
    .eq('theater_id', theaterId)

  if (startDate) {
    query = query.gte('performance_date', startDate)
  }
  if (endDate) {
    query = query.lte('performance_date', endDate)
  }

  const { data, error } = await query
    .order('performance_date')
    .order('start_time')

  if (error) throw error
  return data
}

export const getPerformanceById = async (performanceId) => {
  const { data, error } = await supabase
    .from('performances')
    .select(`
      *,
      play:plays(*),
      hall:halls(*)
    `)
    .eq('id', performanceId)
    .single()

  if (error) throw error
  return data
}

export const updatePerformance = async (performanceId, updates) => {
  const { data, error } = await supabase
    .from('performances')
    .update(updates)
    .eq('id', performanceId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deletePerformance = async (performanceId) => {
  const { error } = await supabase
    .from('performances')
    .delete()
    .eq('id', performanceId)

  if (error) throw error
}

export const getTodayPerformances = async (theaterId) => {
  const today = new Date().toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('performances')
    .select(`
      *,
      play:plays(*),
      hall:halls(*)
    `)
    .eq('theater_id', theaterId)
    .eq('performance_date', today)
    .order('start_time')

  if (error) throw error
  return data
}

// ============================================
// TICKET SERVICE
// ============================================

export const getTicketsByPerformance = async (performanceId) => {
  const { data, error } = await supabase
    .from('tickets')
    .select(`
      *,
      seat:seats(*),
      user:profiles(*)
    `)
    .eq('performance_id', performanceId)
    .order('seat.row_number')
    .order('seat.seat_number')

  if (error) throw error
  return data
}

export const bookTicket = async (ticketData) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      user_id: ticketData.user_id,
      status: 'reserved',
      payment_method: ticketData.payment_method
    })
    .eq('id', ticketData.ticket_id)
    .eq('status', 'available')
    .select()
    .single()

  if (error) throw error
  return data
}

export const checkInTicket = async (ticketId) => {
  const { data, error } = await supabase
    .from('tickets')
    .update({
      status: 'used',
      checked_in_at: new Date().toISOString()
    })
    .eq('id', ticketId)
    .select()
    .single()

  if (error) throw error
  return data
}
