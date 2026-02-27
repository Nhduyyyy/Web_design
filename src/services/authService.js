import { supabase } from '../lib/supabase'

// ============================================
// AUTHENTICATION SERVICE
// ============================================

/**
 * Sign up new user
 */
export const signUp = async ({ email, password, fullName, phone, role = 'user' }) => {
  try {
    // Step 1: Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          phone,
          role
        }
      }
    })

    if (authError) throw authError

    // Step 2: Wait a bit for auth to complete
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Step 3: Create profile entry (if not exists)
    if (authData.user) {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: authData.user.id,
            email,
            full_name: fullName,
            phone,
            role
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
          // Don't throw error here, profile might be created by trigger
        }
      }
    }

    return authData
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

/**
 * Sign in user
 */
export const signIn = async ({ email, password }) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    // Handle specific error cases
    if (error.message.includes('Email not confirmed')) {
      throw new Error('Email chưa được xác nhận. Vui lòng kiểm tra email hoặc liên hệ admin để xác nhận.')
    } else if (error.message.includes('Invalid login credentials')) {
      throw new Error('Email hoặc mật khẩu không đúng.')
    } else {
      throw error
    }
  }

  return data
}

/**
 * Sign out user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/**
 * Get current session
 */
export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) throw error
  return session
}

/**
 * Get current user
 */
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) throw error
  return user
}

/**
 * Update user profile
 */
export const updateProfile = async (userId, updates) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Reset password
 */
export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`
  })

  if (error) throw error
  return data
}

/**
 * Update password
 */
export const updatePassword = async (newPassword) => {
  const { data, error } = await supabase.auth.updateUser({
    password: newPassword
  })

  if (error) throw error
  return data
}

/**
 * Upload avatar
 */
export const uploadAvatar = async (userId, file) => {
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw uploadError

  // Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  // Update profile
  await updateProfile(userId, { avatar_url: publicUrl })

  return publicUrl
}

/**
 * Listen to auth state changes
 */
export const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback)
}

/**
 * Manually confirm email (Admin only - requires service role key)
 * This is for development/testing purposes
 */
export const confirmEmailManually = async (userId) => {
  // This requires service role key, not available in client
  // Use Supabase Dashboard instead
  console.warn('Use Supabase Dashboard to confirm email manually')
  console.log('Steps:')
  console.log('1. Go to Authentication → Users')
  console.log('2. Find user and click on it')
  console.log('3. Set "Email Confirmed" to true')
  console.log('4. Save')
}

/**
 * Resend confirmation email
 */
export const resendConfirmationEmail = async (email) => {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email
  })

  if (error) throw error
  return data
}
