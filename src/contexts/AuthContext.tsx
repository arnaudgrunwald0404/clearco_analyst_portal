'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'


interface UserProfile {
  id: string
  email: string
  name: string
  role: 'SUPER_ADMIN' | 'VENDOR_ADMIN' | 'VENDOR_USER' | 'ANALYST'
  company: string | null
  profileImageUrl: string | null
  createdAt: string
  updatedAt: string
}

interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string; redirectTo?: string }>
  signInAnalyst: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signInWithGoogle: () => Promise<{ success: boolean; error?: string; redirect?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  
  console.log('🚀 [AuthContext] Provider initialized')

  // Internal logout used when we must force sign-out from within the context
  const forceLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    localStorage.removeItem('user')
    sessionStorage.clear()
    setUser(null)
    // Use full redirect to ensure state resets
    if (typeof window !== 'undefined') {
      // Determine appropriate login page based on current location
      const currentPath = window.location.pathname
      const isAnalystPortal = currentPath.includes('/analyst_portal/')
      const userRole = user?.role
      const redirectUrl = (userRole === 'ANALYST' || isAnalystPortal) ? '/analyst_portal/login' : '/vendor_portal/login'
      
      window.location.href = redirectUrl
    }
  }

  const isValidLocalUser = (candidate: any): candidate is UserProfile => {
    if (!candidate) return false
    if (typeof candidate !== 'object') return false
    const hasBasics = typeof candidate.email === 'string' && candidate.email.length > 3
      && typeof candidate.name === 'string' && candidate.name.length > 0
      && typeof candidate.id === 'string' && candidate.id.length > 0
      && (candidate.role === 'SUPER_ADMIN' || candidate.role === 'VENDOR_ADMIN' || candidate.role === 'VENDOR_USER' || candidate.role === 'ANALYST')
    return hasBasics
  }

  useEffect(() => {
    let loadingTimeout: ReturnType<typeof setTimeout> | null = null

    const loadUser = async () => {
      const ctxId = Math.random().toString(36).slice(2, 8)
      console.group(`[AuthContext ${ctxId}] Initial load`)
      try {
        console.log('[AuthContext] Calling supabase.auth.getSession()')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[AuthContext] getSession result:', { 
          hasSession: !!session, 
          hasUser: !!session?.user, 
          userEmail: session?.user?.email,
          error: error?.message 
        })

        if (error) {
          console.error('[AuthContext] Error getting session:', error)
          setLoading(false)
          console.groupEnd()
          return
        }

        if (session?.user) {
          console.log('[AuthContext] Session user present. Loading user profile...')
          await loadUserProfile(session.user)
        } else {
          console.log('[AuthContext] No Supabase session. Checking localStorage user...')
          // No Supabase session: support analyst login via validated localStorage user
          const storedUserRaw = localStorage.getItem('user')
          if (storedUserRaw) {
            try {
              const parsed = JSON.parse(storedUserRaw)
              console.log('[AuthContext] Found local user. Validating shape...')
              if (isValidLocalUser(parsed)) {
                console.log('[AuthContext] Local user valid. Setting user from localStorage (analyst guest).')
                setUser(parsed)
              } else {
                console.warn('[AuthContext] Invalid local user data found; clearing')
                localStorage.removeItem('user')
                setUser(null)
              }
            } catch (parseErr) {
              console.warn('[AuthContext] Failed to parse local user; clearing')
              localStorage.removeItem('user')
              setUser(null)
            }
          } else {
            console.log('[AuthContext] No local user stored. Setting user=null')
            setUser(null)
          }
        }
      } catch (error) {
        console.error('[AuthContext] Error loading user:', error)
        // Clear any stale data on error
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setLoading(false)
        console.groupEnd()
      }
    }

    // Add a soft timeout so the UI never spins forever. We DO NOT clear user
    // state here; we only end the loading spinner and rely on later events.
    loadingTimeout = setTimeout(() => {
      console.warn('[AuthContext] Auth load taking too long; ending loading state for UX. Session will continue initializing in background.')
      setLoading(false)
    }, 12000)

    loadUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 [AuthContext] Auth state changed:', event, 'session user:', !!session?.user, 'user email:', session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('[AuthContext] SIGNED_IN -> loading profile')
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          console.log('[AuthContext] SIGNED_OUT -> clearing user')
          setUser(null)
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[AuthContext] TOKEN_REFRESHED')
        } else if (event === 'USER_UPDATED') {
          console.log('[AuthContext] USER_UPDATED')
        }
      }
    )

    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
  }, [supabase])

  const loadUserProfile = async (authUser: User) => {
    const ctxId = Math.random().toString(36).slice(2, 8)
    console.group(`[AuthContext ${ctxId}] loadUserProfile ${authUser.id}`)
    try {
      // Get user profile via API endpoint to avoid RLS issues
      console.log('[AuthContext] Fetching user profile via API for user:', authUser.id, 'email:', authUser.email)
      
      const response = await fetch('/api/auth/profile', {
        method: 'GET',
        credentials: 'include', // Ensure cookies are sent
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      console.log('[AuthContext] Profile API response status:', response.status)
      
      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
        } catch (textError) {
          console.error('[AuthContext] Failed to read response text:', textError)
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        
        const failDetails = { 
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries()),
          errorText: errorText || 'No error message',
          responseBody: errorText
        }
        console.error('[AuthContext] Profile API failed:', failDetails)
        try {
          console.log('[AuthContext] Profile API fail JSON:', JSON.stringify(failDetails, null, 2))
        } catch {}
        
        throw new Error(errorText || `HTTP ${response.status}: Failed to fetch profile`)
      }
      
      const result = await response.json()
      
      console.log('[AuthContext] Profile API result:', { 
        status: response.status, 
        hasProfile: !!result.profile, 
        error: result.error,
        authUserId: authUser.id,
        authUserEmail: authUser.email
      })
      
      const profile = result.profile

      if (!profile) {
        console.warn('[AuthContext] Profile not found; constructing minimal profile if domain authorized')
        // Profile doesn't exist. Keep authorized domain users signed in with minimal profile.
        const email = authUser.email || ''
        const domain = email.split('@')[1]?.toLowerCase()
        console.log('[AuthContext] Domain:', domain)
        const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
        if (allowedDomains.includes(domain)) {
          const firstName = authUser.user_metadata?.first_name || email.split('@')[0] || 'User'
          const lastName = authUser.user_metadata?.last_name || ''
          const userData: UserProfile = {
            id: authUser.id,
            email,
            name: firstName + (lastName ? ` ${lastName}` : ''),
            role: 'VENDOR_ADMIN',
            company: domain ? domain.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') : 'Company',
            profileImageUrl: authUser.user_metadata?.avatar_url || null,
            createdAt: authUser.created_at,
            updatedAt: new Date().toISOString()
          }
          console.log('[AuthContext] Setting minimal admin profile from domain authorization')
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } else {
          console.warn('[AuthContext] Unauthorized domain without profile. Forcing logout.')
          await forceLogout()
        }
      } else if (profile) {
        // Set user with existing profile
        console.log('[AuthContext] Profile found. Role:', profile.role)
        const userData: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: profile.name || profile.first_name + ' ' + profile.last_name || authUser.email?.split('@')[0] || 'User',
          role: profile.role as 'SUPER_ADMIN' | 'VENDOR_ADMIN' | 'VENDOR_USER' | 'ANALYST',
          company: profile.company,
          profileImageUrl: authUser.user_metadata?.avatar_url || null,
          createdAt: authUser.created_at,
          updatedAt: (profile as any).updatedAt || (profile as any).updated_at
        }

        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else if (result.error) {
        // Non-"not found" profile errors should NOT force logout.
        // Instead, keep the user signed in with a minimal profile if allowed.
        console.warn('[AuthContext] Profile load error, falling back to minimal profile:', result.error)
        const email = authUser.email || ''
        const domain = email.split('@')[1]?.toLowerCase()
        const allowedDomains = (process.env.NEXT_PUBLIC_SUPABASE_ALLOWED_DOMAINS || '').split(',').map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
        if (allowedDomains.includes(domain)) {
          const firstName = authUser.user_metadata?.first_name || email.split('@')[0] || 'User'
          const lastName = authUser.user_metadata?.last_name || ''
          const userData: UserProfile = {
            id: authUser.id,
            email,
            name: firstName + (lastName ? ` ${lastName}` : ''),
            role: 'VENDOR_ADMIN',
            company: domain ? domain.split('.').map(part => part.charAt(0).toUpperCase() + part.slice(1)).join('') : 'Company',
            profileImageUrl: authUser.user_metadata?.avatar_url || null,
            createdAt: authUser.created_at,
            updatedAt: new Date().toISOString()
          }
          console.log('[AuthContext] Setting minimal admin profile due to profile error')
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        } else {
          // For unrecognized domains, do not force sign-out; just clear local state
          // and allow routes to redirect gracefully.
          console.warn('[AuthContext] Clearing local state for unrecognized domain after profile error')
          setUser(null)
          localStorage.removeItem('user')
        }
        return
      }
    } catch (error) {
      console.error('[AuthContext] Error loading user profile:', error)
      await forceLogout()
      return
    } finally {
      console.groupEnd()
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] signIn called for', email)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      console.log('[AuthContext] /api/auth/login status:', response.status)
      const result = await response.json()
      console.log('[AuthContext] /api/auth/login result:', { success: result.success, role: result.user?.role, redirectTo: result.redirectTo })

      if (result.success && result.user) {
        setUser(result.user)
        localStorage.setItem('user', JSON.stringify(result.user))
        return { 
          success: true, 
          redirectTo: result.redirectTo 
        }
      } else {
        return { 
          success: false, 
          error: result.error || 'Login failed' 
        }
      }
    } catch (error) {
      console.error('[AuthContext] Sign in error:', error)
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      }
    }
  }

  const signInAnalyst = async (email: string, _password: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/auth/callback`
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      console.error('Analyst sign in error:', error)
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Prefer the current origin to avoid port/domain mismatches during local dev
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')}/auth/callback`
        }
      })

      if (error) {
        return { 
          success: false, 
          error: error.message 
        }
      }

      return { success: true, redirect: data.url }
    } catch (error) {
      console.error('Google sign in error:', error)
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      }
    }
  }

  const signOut = async () => {
    try {
      console.log('[AuthContext] 🔄 Starting sign out process...')
      
      // Determine redirect URL based on user role or current location
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const isAnalystPortal = currentPath.includes('/analyst_portal/')
      const userRole = user?.role
      
      // Determine appropriate login page
      let redirectUrl = '/vendor_portal/login' // default
      if (userRole === 'ANALYST' || isAnalystPortal) {
        redirectUrl = '/analyst_portal/login'
      }
      
      console.log(`[AuthContext] Redirecting to: ${redirectUrl} (role: ${userRole}, isAnalystPortal: ${isAnalystPortal})`)
      
      // Start API call and Supabase signout in parallel
      const [apiResponse] = await Promise.all([
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }),
        supabase.auth.signOut()
      ])

      if (!apiResponse.ok) {
        console.warn('[AuthContext] Logout API call failed:', await apiResponse.text())
      }

      // Clear all storage
      localStorage.removeItem('user')
      sessionStorage.clear()
      
      // Clear user state and wait for it to be processed
      setUser(null)
      
      // Add a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('[AuthContext] ✅ Sign out completed')
      
      // Redirect to appropriate login page
      window.location.href = redirectUrl
    } catch (error) {
      console.error('[AuthContext] Sign out error:', error)
      // Emergency cleanup and redirect
      localStorage.removeItem('user')
      sessionStorage.clear()
      setUser(null)
      
      // Determine redirect URL for error case too
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
      const isAnalystPortal = currentPath.includes('/analyst_portal/')
      const userRole = user?.role
      const redirectUrl = (userRole === 'ANALYST' || isAnalystPortal) ? '/analyst_portal/login' : '/vendor_portal/login'
      
      window.location.href = redirectUrl
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        await loadUserProfile(authUser)
      } else {
        // No Supabase user: refresh from localStorage
        const storedUserRaw = localStorage.getItem('user')
        if (storedUserRaw) {
          try {
            const parsed = JSON.parse(storedUserRaw)
            if (isValidLocalUser(parsed)) {
              setUser(parsed)
              return
            }
          } catch {}
        }
        await signOut()
      }
    } catch (error) {
      console.error('Error refreshing user:', error)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signInAnalyst,
    signInWithGoogle,
    signOut,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
