import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Helper to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

// Helper to get user profile with role
export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  
  if (error) throw error
  return data
}

// Helper to check if user is admin
export const isAdmin = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return false
    
    const profile = await getUserProfile(user.id)
    return profile.role === 'admin'
  } catch {
    return false
  }
}

// Helper to check if user is theater owner
export const isTheaterOwner = async () => {
  try {
    const user = await getCurrentUser()
    if (!user) return false
    
    const profile = await getUserProfile(user.id)
    return profile.role === 'theater'
  } catch {
    return false
  }
}
