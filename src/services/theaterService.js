import { supabase } from '../lib/supabase'

// ============================================
// THEATER SERVICE
// ============================================

/**
 * Create new theater (Theater Owner only)
 */
export const createTheater = async (theaterData) => {
  const { data, error } = await supabase
    .from('theaters')
    .insert(theaterData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all approved theaters
 */
export const getApprovedTheaters = async () => {
  const { data, error } = await supabase
    .from('theaters')
    .select('*')
    .eq('status', 'approved')
    .order('name')

  if (error) throw error
  return data
}

/**
 * Get theaters by owner (may return multiple rows)
 */
export const getTheatersByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from('theaters')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get single theater by owner (profile page)
 */
export const getTheaterByOwner = async (ownerId) => {
  const { data, error } = await supabase
    .from('theaters')
    .select('*')
    .eq('owner_id', ownerId)
    .single()

  if (error) throw error
  return data
}

/**
 * Get theater by ID
 */
export const getTheaterById = async (theaterId) => {
  const { data, error } = await supabase
    .from('theaters')
    .select('*')
    .eq('id', theaterId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update theater
 */
export const updateTheater = async (theaterId, updates) => {
  const { data, error } = await supabase
    .from('theaters')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', theaterId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Approve theater (Admin only)
 */
export const approveTheater = async (theaterId, adminId) => {
  const { data, error } = await supabase
    .from('theaters')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: adminId
    })
    .eq('id', theaterId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reject theater (Admin only)
 */
export const rejectTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('theaters')
    .update({ status: 'rejected' })
    .eq('id', theaterId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get pending theaters (Admin only)
 */
export const getPendingTheaters = async () => {
  const { data, error } = await supabase
    .from('theaters')
    .select('*, owner:profiles(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Upload theater logo
 */
export const uploadTheaterLogo = async (theaterId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${theaterId}-logo.${fileExt}`
  const filePath = `${theaterId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('theater-assets')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('theater-assets')
    .getPublicUrl(filePath)

  await updateTheater(theaterId, { logo_url: publicUrl })

  return publicUrl
}

/**
 * Upload theater cover image
 */
export const uploadTheaterCover = async (theaterId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${theaterId}-cover.${fileExt}`
  const filePath = `${theaterId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('theater-assets')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('theater-assets')
    .getPublicUrl(filePath)

  await updateTheater(theaterId, { cover_image_url: publicUrl })

  return publicUrl
}

// ============================================
// VENUE SERVICE
// ============================================

/**
 * Create venue
 */
export const createVenue = async (venueData) => {
  const { data, error } = await supabase
    .from('venues')
    .insert(venueData)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get venues by theater
 */
export const getVenuesByTheater = async (theaterId) => {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('theater_id', theaterId)
    .order('name')

  if (error) throw error
  return data
}

/**
 * Get venue by ID
 */
export const getVenueById = async (venueId) => {
  const { data, error } = await supabase
    .from('venues')
    .select('*')
    .eq('id', venueId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update venue
 */
export const updateVenue = async (venueId, updates) => {
  const { data, error } = await supabase
    .from('venues')
    .update(updates)
    .eq('id', venueId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete venue
 */
export const deleteVenue = async (venueId) => {
  const { error } = await supabase
    .from('venues')
    .delete()
    .eq('id', venueId)

  if (error) throw error
}
