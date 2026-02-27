import { supabase } from '../lib/supabase'

/**
 * Ensure user has a profile
 * If not, create one
 */
export const ensureProfile = async (user) => {
  if (!user) return null

  try {
    console.log('🔍 Checking profile for user:', user.email)

    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Profile check timeout')), 5000)
    )

    // Check if profile exists with timeout
    const checkPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: existingProfile, error: checkError } = await Promise.race([
      checkPromise,
      timeoutPromise
    ])

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found, which is OK
      console.error('❌ Error checking profile:', checkError)
      throw checkError
    }

    if (existingProfile) {
      console.log('✅ Profile exists:', existingProfile)
      return existingProfile
    }

    // Profile doesn't exist, create it
    console.log('⚠️ Profile not found, creating...')

    const newProfile = {
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || '',
      role: user.user_metadata?.role || 'user',
      avatar_url: user.user_metadata?.avatar_url || ''
    }

    const createPromise = supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single()

    const { data: createdProfile, error: createError } = await Promise.race([
      createPromise,
      timeoutPromise
    ])

    if (createError) {
      console.error('❌ Error creating profile:', createError)
      throw createError
    }

    console.log('✅ Profile created:', createdProfile)
    return createdProfile

  } catch (error) {
    console.error('❌ ensureProfile error:', error)
    return null
  }
}

/**
 * Check and fix missing profiles for all users
 * (Admin only - for debugging)
 */
export const fixMissingProfiles = async () => {
  console.log('🔧 Checking for users without profiles...')

  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('❌ Not authenticated')
      return
    }

    // Ensure current user has profile
    await ensureProfile(user)

    console.log('✅ Profile check complete')
  } catch (error) {
    console.error('❌ fixMissingProfiles error:', error)
  }
}

// Export for use in console
if (typeof window !== 'undefined') {
  window.ensureProfile = ensureProfile
  window.fixMissingProfiles = fixMissingProfiles
}
