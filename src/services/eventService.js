import { supabase } from '../lib/supabase'

// ============================================
// EVENT SERVICE
// ============================================

/**
 * Create event
 */
export const createEvent = async (eventData) => {
  const { data, error } = await supabase
    .from('events')
    .insert(eventData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all events
 */
export const getEvents = async (filters = {}) => {
  let query = supabase
    .from('events')
    .select(`
      *,
      theater:theaters(*),
      venue:venues(*)
    `)
    .eq('status', 'scheduled')
    .order('event_date', { ascending: true })

  // Apply filters
  if (filters.type) {
    query = query.eq('type', filters.type)
  }

  if (filters.theaterId) {
    query = query.eq('theater_id', filters.theaterId)
  }

  if (filters.city) {
    query = query.eq('venue.city', filters.city)
  }

  if (filters.startDate) {
    query = query.gte('event_date', filters.startDate)
  }

  if (filters.endDate) {
    query = query.lte('event_date', filters.endDate)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

/**
 * Get events by type
 */
export const getEventsByType = async (type) => {
  return getEvents({ type })
}

/**
 * Get workshops
 */
export const getWorkshops = async () => {
  return getEventsByType('workshop')
}

/**
 * Get tours
 */
export const getTours = async () => {
  return getEventsByType('tour')
}

/**
 * Get meet artist events
 */
export const getMeetArtistEvents = async () => {
  return getEventsByType('meet_artist')
}

/**
 * Get event by ID
 */
export const getEventById = async (eventId) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      theater:theaters(*),
      venue:venues(*)
    `)
    .eq('id', eventId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get events by theater
 */
export const getEventsByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      venue:venues(*)
    `)
    .eq('theater_id', theaterId)
    .order('event_date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Update event
 */
export const updateEvent = async (eventId, updates) => {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete event
 */
export const deleteEvent = async (eventId) => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}

/**
 * Cancel event
 */
export const cancelEvent = async (eventId) => {
  return updateEvent(eventId, { status: 'cancelled' })
}

/**
 * Get available events (not full)
 */
export const getAvailableEvents = async () => {
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      theater:theaters(*),
      venue:venues(*)
    `)
    .eq('status', 'scheduled')
    .filter('current_participants', 'lt', 'max_participants')
    .order('event_date', { ascending: true })

  if (error) throw error
  return data
}

// ============================================
// EVENT REGISTRATION SERVICE
// ============================================

/**
 * Generate registration code
 */
export const generateRegistrationCode = () => {
  return `REG${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`
}

/**
 * Create event registration
 */
export const createEventRegistration = async (registrationData) => {
  const registrationCode = generateRegistrationCode()

  const { data, error } = await supabase
    .from('event_registrations')
    .insert({
      ...registrationData,
      registration_code: registrationCode,
      status: 'pending'
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get registration by ID
 */
export const getRegistrationById = async (registrationId) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event:events(
        *,
        theater:theaters(*),
        venue:venues(*)
      )
    `)
    .eq('id', registrationId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get registration by code
 */
export const getRegistrationByCode = async (registrationCode) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event:events(
        *,
        theater:theaters(*),
        venue:venues(*)
      )
    `)
    .eq('registration_code', registrationCode)
    .single()

  if (error) throw error
  return data
}

/**
 * Get registrations by user
 */
export const getRegistrationsByUser = async (userId) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event:events(
        *,
        theater:theaters(*),
        venue:venues(*)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get registrations by event
 */
export const getRegistrationsByEvent = async (eventId) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Confirm registration
 */
export const confirmRegistration = async (registrationId) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString()
    })
    .eq('id', registrationId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Cancel registration
 */
export const cancelRegistration = async (registrationId) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString()
    })
    .eq('id', registrationId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Complete event registration flow
 */
export const completeEventRegistrationFlow = async ({
  userId,
  eventId,
  participantInfo,
  paymentMethod
}) => {
  try {
    // 1. Get event details
    const event = await getEventById(eventId)

    // Check if event is full
    if (event.current_participants >= event.max_participants) {
      throw new Error('Event is full')
    }

    // 2. Create registration
    const registration = await createEventRegistration({
      event_id: eventId,
      user_id: userId,
      participant_name: participantInfo.name,
      participant_email: participantInfo.email,
      participant_phone: participantInfo.phone,
      amount: event.price,
      payment_status: 'pending'
    })

    // 3. Process payment (simulate)
    await new Promise(resolve => setTimeout(resolve, 2000))
    const paymentSuccess = Math.random() > 0.1 // 90% success rate

    if (paymentSuccess) {
      // Update registration
      await supabase
        .from('event_registrations')
        .update({ payment_status: 'completed' })
        .eq('id', registration.id)

      // Confirm registration (this will trigger participant count update)
      await confirmRegistration(registration.id)

      return {
        success: true,
        registration
      }
    } else {
      throw new Error('Payment failed')
    }
  } catch (error) {
    console.error('Event registration flow error:', error)
    throw error
  }
}

/**
 * Get event statistics for theater
 */
export const getEventStats = async (theaterId, startDate, endDate) => {
  const { data, error } = await supabase
    .from('event_registrations')
    .select(`
      *,
      event:events!inner(theater_id)
    `)
    .eq('event.theater_id', theaterId)
    .gte('created_at', startDate)
    .lte('created_at', endDate)

  if (error) throw error

  // Calculate stats
  const stats = {
    total: data.length,
    confirmed: data.filter(r => r.status === 'confirmed').length,
    cancelled: data.filter(r => r.status === 'cancelled').length,
    pending: data.filter(r => r.status === 'pending').length,
    revenue: data
      .filter(r => r.status === 'confirmed')
      .reduce((sum, r) => sum + r.amount, 0)
  }

  return stats
}
