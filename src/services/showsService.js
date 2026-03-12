import { supabase } from '../lib/supabase'

// ============================================
// SHOWS SERVICE
// ============================================

export const getShows = async (filters) => {
  let query = supabase
    .from('shows')
    .select('*')
    .order('created_at', { ascending: false })

  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  if (typeof filters?.minDuration === 'number') {
    query = query.gte('duration', filters.minDuration)
  }

  if (typeof filters?.maxDuration === 'number') {
    query = query.lte('duration', filters.maxDuration)
  }

  if (filters?.venue_id) {
    query = query.eq('venue_id', filters.venue_id)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export const getShowById = async (id) => {
  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const createShow = async (payload) => {
  const { data, error } = await supabase
    .from('shows')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateShow = async (id, payload) => {
  const { data, error } = await supabase
    .from('shows')
    .update(payload)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteShow = async (id) => {
  const { error } = await supabase
    .from('shows')
    .delete()
    .eq('id', id)

  if (error) throw error
}

