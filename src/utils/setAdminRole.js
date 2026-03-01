import { supabase } from '../lib/supabase'

/**
 * Utility để set admin role cho user hiện tại
 * Chỉ dùng cho development/testing
 */
export const setCurrentUserAsAdmin = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.error('❌ No user logged in')
      return { success: false, error: 'No user logged in' }
    }

    console.log('👤 Current user:', user.email)

    // Update profile role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user.id)
      .select()
      .single()

    if (profileError) {
      console.error('❌ Error updating profile:', profileError)
      return { success: false, error: profileError.message }
    }

    console.log('✅ Profile updated:', profile)

    // Note: Cannot update user_metadata from client side
    // Need to do it via Supabase Dashboard or SQL
    console.log('⚠️ Note: user_metadata.role needs to be updated via Supabase Dashboard')
    console.log('SQL to run in Supabase SQL Editor:')
    console.log(`UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb WHERE id = '${user.id}';`)

    return { 
      success: true, 
      profile,
      message: 'Profile role updated to admin. Please update user_metadata via SQL or Dashboard.'
    }
  } catch (error) {
    console.error('❌ Error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Check current user role
 */
export const checkCurrentUserRole = async () => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No user logged in')
      return null
    }

    // Get role from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, email, full_name')
      .eq('id', user.id)
      .single()

    const metadataRole = user.user_metadata?.role
    const profileRole = profile?.role

    console.log('📊 User Role Info:')
    console.log('  Email:', user.email)
    console.log('  Profile Role:', profileRole)
    console.log('  Metadata Role:', metadataRole)
    console.log('  Full Profile:', profile)

    return {
      email: user.email,
      profileRole,
      metadataRole,
      profile
    }
  } catch (error) {
    console.error('❌ Error:', error)
    return null
  }
}

/**
 * Generate SQL to set admin role
 */
export const generateAdminSQL = (email) => {
  return `
-- Set admin role for user: ${email}

-- Update user metadata
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE email = '${email}';

-- Update profile
UPDATE profiles
SET role = 'admin'
WHERE email = '${email}';

-- Verify
SELECT 
  email, 
  raw_user_meta_data->>'role' as metadata_role,
  (SELECT role FROM profiles WHERE id = auth.users.id) as profile_role
FROM auth.users
WHERE email = '${email}';
`
}

// Export to window for easy console access
if (typeof window !== 'undefined') {
  window.setAdminRole = setCurrentUserAsAdmin
  window.checkUserRole = checkCurrentUserRole
  window.generateAdminSQL = generateAdminSQL
  
  console.log('🔧 Admin utilities loaded:')
  console.log('  - window.setAdminRole() - Set current user as admin (profile only)')
  console.log('  - window.checkUserRole() - Check current user role')
  console.log('  - window.generateAdminSQL(email) - Generate SQL to set admin role')
}
