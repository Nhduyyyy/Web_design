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
  try {
    // Validate file
    if (!file || !file.type.startsWith('image/')) {
      throw new Error('File phải là hình ảnh')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    // Path phải có dạng {userId}/{fileName} để policy "upload own avatar" (folder = auth.uid()) chấp nhận
    const filePath = `${userId}/${fileName}`

    console.log('Uploading avatar:', { userId, fileName, filePath, fileSize: file.size })

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { 
        upsert: true,
        cacheControl: '3600',
        contentType: file.type
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Check if bucket doesn't exist
      if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
        throw new Error('Bucket "avatars" chưa được tạo. Vui lòng tạo bucket trong Supabase Storage.')
      }
      
      // Check if permission denied
      if (uploadError.message?.includes('permission') || uploadError.message?.includes('policy')) {
        throw new Error('Không có quyền upload. Vui lòng kiểm tra Storage policies trong Supabase.')
      }
      
      throw new Error(`Lỗi upload: ${uploadError.message}`)
    }

    console.log('Upload successful:', uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath)

    console.log('Public URL:', publicUrl)

    // Update profile with the URL
    await updateProfile(userId, { avatar_url: publicUrl })

    return publicUrl
  } catch (error) {
    console.error('Avatar upload error:', error)
    throw error
  }
}

/**
 * Delete avatar
 */
export const deleteAvatar = async (userId, avatarUrl) => {
  try {
    if (!avatarUrl) {
      throw new Error('Không có avatar để xóa')
    }

    // Extract file path from URL
    // URL format: https://[project].supabase.co/storage/v1/object/public/avatars/[path]
    // path có thể là "userId/filename" hoặc "filename" (legacy)
    const urlParts = avatarUrl.split('/avatars/')
    if (urlParts.length < 2) {
      throw new Error('URL avatar không hợp lệ')
    }

    const filePath = urlParts[1].split('?')[0] // Remove query params if any
    console.log('Deleting avatar:', { userId, filePath })

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (deleteError) {
      console.error('Delete error:', deleteError)
      // Don't throw if file doesn't exist, just continue to update profile
      if (!deleteError.message?.includes('not found')) {
        throw new Error(`Lỗi xóa file: ${deleteError.message}`)
      }
    }

    console.log('Avatar deleted from storage')

    // Update profile to remove avatar_url
    await updateProfile(userId, { avatar_url: null })

    return true
  } catch (error) {
    console.error('Avatar delete error:', error)
    throw error
  }
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
