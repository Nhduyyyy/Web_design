import { supabase } from '../lib/supabase'

// ============================================
// FLOOR SERVICE
// ============================================

export const createFloor = async (floorData) => {
  const { data, error } = await supabase
    .from('floors')
    .insert(floorData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getFloorsByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('theater_id', theaterId)
    .order('floor_number')

  if (error) throw error
  return data
}

export const getFloorsByVenue = async (venueId) => {
  const { data, error } = await supabase
    .from('floors')
    .select('*')
    .eq('venue_id', venueId)
    .order('floor_number')

  if (error) throw error
  return data
}

export const updateFloor = async (floorId, updates) => {
  const { data, error } = await supabase
    .from('floors')
    .update(updates)
    .eq('id', floorId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteFloor = async (floorId) => {
  const { error } = await supabase
    .from('floors')
    .delete()
    .eq('id', floorId)

  if (error) throw error
}

// ============================================
// HALL SERVICE
// ============================================

export const createHall = async (hallData) => {
  const { data, error } = await supabase
    .from('halls')
    .insert(hallData)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getHallsByFloor = async (floorId) => {
  const { data, error } = await supabase
    .from('halls')
    .select('*')
    .eq('floor_id', floorId)
    .order('name')

  if (error) throw error
  return data
}

export const getHallsByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('halls')
    .select(`
      *,
      floor:floors(*)
    `)
    .eq('theater_id', theaterId)
    .order('name')

  if (error) throw error
  return data
}

export const getHallsByVenue = async (venueId) => {
  const { data, error } = await supabase
    .from('halls')
    .select(`
      *,
      floor:floors(*)
    `)
    .eq('venue_id', venueId)
    .order('name')

  if (error) throw error
  return data
}

export const getHallById = async (hallId) => {
  const { data, error } = await supabase
    .from('halls')
    .select(`
      *,
      floor:floors(*)
    `)
    .eq('id', hallId)
    .single()

  if (error) throw error
  return data
}

export const updateHall = async (hallId, updates) => {
  const { data, error } = await supabase
    .from('halls')
    .update(updates)
    .eq('id', hallId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteHall = async (hallId) => {
  const { error } = await supabase
    .from('halls')
    .delete()
    .eq('id', hallId)

  if (error) throw error
}

// ============================================
// SEAT SERVICE
// ============================================

export const createSeats = async (seatsData) => {
  const { data, error } = await supabase
    .from('seats')
    .insert(seatsData)
    .select()

  if (error) throw error
  return data
}

export const getSeatsByHall = async (hallId) => {
  const { data, error } = await supabase
    .from('seats')
    .select('*')
    .eq('hall_id', hallId)
    .order('row_number')
    .order('seat_number')

  if (error) throw error
  return data
}

export const updateSeat = async (seatId, updates) => {
  const { data, error } = await supabase
    .from('seats')
    .update(updates)
    .eq('id', seatId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteSeat = async (seatId) => {
  const { error } = await supabase
    .from('seats')
    .delete()
    .eq('id', seatId)

  if (error) throw error
}

// Generate seats automatically
export const generateSeats = async (hallId, totalRows, seatsPerRow, seatType = 'standard') => {
  const seats = []
  
  for (let row = 1; row <= totalRows; row++) {
    for (let seat = 1; seat <= seatsPerRow; seat++) {
      seats.push({
        hall_id: hallId,
        row_number: row,
        seat_number: seat,
        seat_type: seatType,
        is_active: true
      })
    }
  }

  return createSeats(seats)
}
