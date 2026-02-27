/**
 * Development helpers
 * Only available in development mode
 */

import { supabase } from '../lib/supabase'

/**
 * Generate unique test email
 * Uses Gmail's + trick to create unique emails that go to same inbox
 */
export const generateTestEmail = (baseEmail) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(7)
  
  if (baseEmail.includes('@')) {
    const [username, domain] = baseEmail.split('@')
    return `${username}+test${timestamp}${random}@${domain}`
  }
  
  return `test${timestamp}${random}@example.com`
}

/**
 * Quick signup for testing
 * Generates unique email automatically
 */
export const quickSignup = async (baseEmail = 'test@example.com') => {
  const email = generateTestEmail(baseEmail)
  const password = 'test123456'
  
  console.log('🚀 Quick signup with:', email)
  
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: 'Test User',
          phone: '0123456789',
          role: 'user'
        }
      }
    })
    
    if (error) throw error
    
    console.log('✅ Signup successful:', data)
    return { email, password, data }
  } catch (error) {
    console.error('❌ Signup failed:', error)
    throw error
  }
}

/**
 * Delete all test users
 * Requires admin access
 */
export const cleanupTestUsers = async () => {
  console.log('🧹 Cleaning up test users...')
  console.warn('⚠️ This requires admin access via Supabase Dashboard')
  console.log('Go to: Authentication → Users → Delete test users manually')
}

/**
 * Check rate limit status
 */
export const checkRateLimit = async () => {
  console.log('🔍 Checking rate limit...')
  
  try {
    // Try a dummy signup to check rate limit
    const testEmail = `ratelimit-test-${Date.now()}@example.com`
    const { error } = await supabase.auth.signUp({
      email: testEmail,
      password: 'test123456'
    })
    
    if (error?.message?.includes('rate limit')) {
      console.log('❌ Rate limit is active')
      console.log('Wait 5-10 minutes or increase rate limit in Supabase Dashboard')
      return { limited: true, message: error.message }
    }
    
    console.log('✅ No rate limit detected')
    
    // Clean up test user
    // Note: Can't delete from client, need to do manually
    
    return { limited: false }
  } catch (error) {
    console.error('Error checking rate limit:', error)
    return { limited: false, error }
  }
}

/**
 * Development tips
 */
export const devTips = () => {
  console.log(`
📚 Development Tips:

1. Rate Limit:
   - Use generateTestEmail() to create unique emails
   - Or increase rate limit in Supabase Dashboard
   - Or wait 5-10 minutes between signups

2. Testing:
   - Use quickSignup() for fast testing
   - Email: test+anything@example.com goes to test@example.com
   - Password: test123456

3. Cleanup:
   - Delete test users in Supabase Dashboard
   - Authentication → Users → Delete

4. Debugging:
   - window.debugAuth.fullDebug() - Full auth debug
   - window.testSupabase() - Test Supabase connection
   - window.ensureProfile() - Ensure profile exists

5. Rate Limit Settings:
   - Supabase Dashboard → Authentication → Rate Limits
   - Increase to 100 for development
   - Keep low (10) for production
  `)
}

// Export for console use
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  window.devHelpers = {
    generateTestEmail,
    quickSignup,
    cleanupTestUsers,
    checkRateLimit,
    devTips
  }
  
  console.log('💡 Dev helpers loaded! Try: window.devHelpers.devTips()')
}

export default {
  generateTestEmail,
  quickSignup,
  cleanupTestUsers,
  checkRateLimit,
  devTips
}
