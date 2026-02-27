import { supabase } from '../lib/supabase'

/**
 * Debug helper để kiểm tra authentication
 */

export const debugAuth = {
  // Check current session
  async checkSession() {
    console.group('🔍 Debug: Check Session')
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Session Error:', error)
        return { success: false, error }
      }

      if (session) {
        console.log('✅ Session exists')
        console.log('User ID:', session.user.id)
        console.log('Email:', session.user.email)
        console.log('Metadata:', session.user.user_metadata)
      } else {
        console.log('⚠️ No active session')
      }

      return { success: true, session }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, error }
    } finally {
      console.groupEnd()
    }
  },

  // Check profile
  async checkProfile(userId) {
    console.group('🔍 Debug: Check Profile')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Profile Error:', error)
        return { success: false, error }
      }

      if (data) {
        console.log('✅ Profile found')
        console.log('Role:', data.role)
        console.log('Name:', data.full_name)
        console.log('Email:', data.email)
      } else {
        console.log('⚠️ No profile found')
      }

      return { success: true, profile: data }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, error }
    } finally {
      console.groupEnd()
    }
  },

  // Test RLS policies
  async testRLS() {
    console.group('🔍 Debug: Test RLS Policies')
    try {
      // Test read own profile
      const { data: session } = await supabase.auth.getSession()
      
      if (!session?.session?.user) {
        console.log('⚠️ Not authenticated')
        return { success: false, error: 'Not authenticated' }
      }

      const userId = session.session.user.id

      // Test SELECT
      console.log('Testing SELECT policy...')
      const { data: selectData, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (selectError) {
        console.error('❌ SELECT failed:', selectError)
      } else {
        console.log('✅ SELECT success')
      }

      // Test UPDATE
      console.log('Testing UPDATE policy...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', userId)

      if (updateError) {
        console.error('❌ UPDATE failed:', updateError)
      } else {
        console.log('✅ UPDATE success')
      }

      return { success: true }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, error }
    } finally {
      console.groupEnd()
    }
  },

  // Check Supabase connection
  async checkConnection() {
    console.group('🔍 Debug: Check Supabase Connection')
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)

      if (error) {
        console.error('❌ Connection Error:', error)
        return { success: false, error }
      }

      console.log('✅ Supabase connected')
      return { success: true }
    } catch (error) {
      console.error('❌ Unexpected error:', error)
      return { success: false, error }
    } finally {
      console.groupEnd()
    }
  },

  // Full debug
  async fullDebug() {
    console.log('🚀 Starting Full Auth Debug...')
    
    await this.checkConnection()
    const sessionResult = await this.checkSession()
    
    if (sessionResult.session?.user) {
      await this.checkProfile(sessionResult.session.user.id)
      await this.testRLS()
    }

    console.log('✅ Debug complete')
  }
}

// Export for use in console
if (typeof window !== 'undefined') {
  window.debugAuth = debugAuth
}
