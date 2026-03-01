import { supabase } from '../lib/supabase'

/**
 * Quick check role - paste this in console
 */
export const quickCheckRole = async () => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      console.log('❌ No user logged in')
      return
    }

    console.log('='.repeat(60))
    console.log('👤 USER INFO')
    console.log('='.repeat(60))
    console.log('Email:', user.email)
    console.log('ID:', user.id)
    console.log('User Metadata:', user.user_metadata)
    console.log('Metadata Role:', user.user_metadata?.role)
    
    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 PROFILE INFO')
    console.log('='.repeat(60))
    
    if (profileError) {
      console.log('❌ Profile Error:', profileError)
    } else {
      console.log('Profile:', profile)
      console.log('Profile Role:', profile?.role)
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('🎯 ROLE DETECTION')
    console.log('='.repeat(60))
    
    const finalRole = profile?.role || user.user_metadata?.role || 'user'
    console.log('Final Role:', finalRole)
    console.log('Is Admin?', finalRole === 'admin')
    console.log('Should redirect to:', finalRole === 'admin' ? '/admin' : '/app')
    
    console.log('\n' + '='.repeat(60))
    console.log('🔧 FIX COMMANDS')
    console.log('='.repeat(60))
    
    if (finalRole !== 'admin') {
      console.log('To set this user as admin, run this SQL in Supabase:')
      console.log(`
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
WHERE id = '${user.id}';

UPDATE profiles
SET role = 'admin'
WHERE id = '${user.id}';
      `)
    } else {
      console.log('✅ User is already admin!')
    }
    
    console.log('='.repeat(60))
    
    return {
      user,
      profile,
      finalRole,
      isAdmin: finalRole === 'admin'
    }
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Make it available globally
if (typeof window !== 'undefined') {
  window.quickCheckRole = quickCheckRole
  console.log('🔧 Quick check loaded: window.quickCheckRole()')
}
