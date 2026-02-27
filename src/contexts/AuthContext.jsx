import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { onAuthStateChange } from '../services/authService'
import { ensureProfile } from '../utils/ensureProfile'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let loadingTimeout = null
    let isLoadingProfile = false

    const initAuth = async () => {
      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        
        if (session?.user && !isLoadingProfile) {
          isLoadingProfile = true
          
          // Set a timeout to prevent infinite loading
          loadingTimeout = setTimeout(() => {
            if (mounted && loading) {
              console.warn('⚠️ Auth init timeout - continuing anyway')
              setLoading(false)
            }
          }, 3000)
          
          // Load profile in background
          loadProfile(session.user).finally(() => {
            if (mounted) {
              setLoading(false)
              if (loadingTimeout) clearTimeout(loadingTimeout)
              isLoadingProfile = false
            }
          })
        } else {
          setLoading(false)
        }
      } catch (err) {
        console.error('Error initializing auth:', err)
        if (mounted) setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('🔐 Auth state changed:', event)
      
      setUser(session?.user ?? null)
      
      if (event === 'SIGNED_OUT') {
        // Clear profile immediately on sign out
        setProfile(null)
        setLoading(false)
        isLoadingProfile = false
      } else if (event === 'SIGNED_IN' && session?.user && !isLoadingProfile) {
        // On sign in, load profile but don't block
        isLoadingProfile = true
        setLoading(false) // Allow navigation immediately
        loadProfile(session.user).finally(() => {
          isLoadingProfile = false
        })
      } else if (event === 'INITIAL_SESSION') {
        // Skip - already handled in initAuth
        console.log('⏭️ Skipping INITIAL_SESSION - already loaded')
      } else if (session?.user && !isLoadingProfile && !profile) {
        // Only load if we don't have a profile yet
        isLoadingProfile = true
        loadProfile(session.user).finally(() => {
          isLoadingProfile = false
        })
      } else if (!session?.user) {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      if (loadingTimeout) clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [])

  const loadProfile = async (user) => {
    if (!user) return
    
    try {
      console.log('📝 Loading profile for user:', user.email)
      
      // Try direct query first with shorter timeout
      const { data, error } = await Promise.race([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        )
      ])
      
      if (data) {
        console.log('✅ Profile loaded:', data)
        setProfile(data)
        return
      }
      
      // If error is not "not found", log it
      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error loading profile:', error)
      }
      
      // Profile not found, create minimal one
      console.log('⚠️ Profile not found, using minimal profile')
      const minimalProfile = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        role: user.user_metadata?.role || 'user',
        phone: user.user_metadata?.phone || '',
        avatar_url: user.user_metadata?.avatar_url || ''
      }
      
      setProfile(minimalProfile)
      
      // Try to create profile in background (don't wait)
      supabase
        .from('profiles')
        .insert(minimalProfile)
        .select()
        .single()
        .then(({ data: created, error: createErr }) => {
          if (created) {
            console.log('✅ Profile created in background:', created)
            setProfile(created)
          } else if (createErr) {
            console.warn('⚠️ Could not create profile:', createErr.message)
          }
        })
        .catch(err => console.warn('⚠️ Background profile creation failed:', err.message))
      
    } catch (error) {
      console.error('❌ Error in loadProfile:', error.message)
      // Always set a minimal profile to allow user to continue
      setProfile({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
        role: 'user'
      })
    }
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin: profile?.role === 'admin',
    isTheater: profile?.role === 'theater',
    isUser: profile?.role === 'user',
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
