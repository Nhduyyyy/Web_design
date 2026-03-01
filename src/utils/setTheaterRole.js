import { supabase } from '../lib/supabase'

/**
 * Development utility to set a user's role to 'theater'
 * Usage in browser console:
 * 
 * import { setTheaterRole } from './utils/setTheaterRole'
 * await setTheaterRole('user@example.com')
 */

export const setTheaterRole = async (email) => {
  try {
    console.log('🎭 Setting theater role for:', email)

    // Get user by email
    const { data: profiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching profile:', fetchError)
      return
    }

    if (!profiles) {
      console.error('❌ Profile not found for email:', email)
      return
    }

    // Update role to theater
    const { data, error } = await supabase
      .from('profiles')
      .update({ role: 'theater' })
      .eq('email', email)
      .select()

    if (error) {
      console.error('❌ Error updating role:', error)
      return
    }

    console.log('✅ Successfully set theater role for:', email)
    console.log('Profile:', data)
    
    return data
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Make it available globally in development
if (import.meta.env.DEV) {
  window.setTheaterRole = setTheaterRole
  console.log('🎭 Theater role utility loaded. Use: setTheaterRole("user@example.com")')
}

export default setTheaterRole
