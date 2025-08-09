'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR' | 'ANALYST'
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

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) {
          console.error('Error getting session:', error)
          setLoading(false)
          return
        }

        if (session?.user) {
          await loadUserProfile(session.user)
          // If for any reason profile loading didn't set the user, fall back to auth session
          if (!user) {
            const authUser = session.user
            const minimalUser: UserProfile = {
              id: authUser.id,
              email: authUser.email || '',
              name: (authUser.user_metadata?.name 
                || [authUser.user_metadata?.first_name, authUser.user_metadata?.last_name].filter(Boolean).join(' ') 
                || authUser.email?.split('@')[0] 
                || 'User'),
              role: 'EDITOR',
              company: authUser.user_metadata?.company || null,
              profileImageUrl: authUser.user_metadata?.avatar_url || null,
              createdAt: authUser.created_at,
              updatedAt: new Date().toISOString()
            }
            setUser(minimalUser)
            localStorage.setItem('user', JSON.stringify(minimalUser))
          }
        } else {
          // No valid session - clear any stale localStorage data and redirect to login
          console.log('No valid session found - clearing stale data')
          localStorage.removeItem('user')
          setUser(null)
        }
      } catch (error) {
        console.error('Error loading user:', error)
        // Clear any stale data on error
        localStorage.removeItem('user')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false and clearing stale data')
      localStorage.removeItem('user')
      setUser(null)
      setLoading(false)
    }, 5000)

    loadUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, !!session)
        
        if (event === 'SIGNED_IN' && session?.user) {
          await loadUserProfile(session.user)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase])

  const loadUserProfile = async (authUser: User) => {
    try {
      // Get user profile for role information
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create one with role based on email domain
        const email = authUser.email || ''
        const emailDomain = email.split('@')[1]?.toLowerCase()
        const emailName = email.split('@')[0]?.toLowerCase()
        
        // Apply domain validation - block unauthorized users
        if (email.toLowerCase() === 'dev@example.com') {
          throw new Error('This email is not authorized for access')
        }

        // Use service role client to bypass RLS for database checks
        const serviceClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Check if email is from authorized domain OR is a registered analyst
        const isAuthorizedDomain = emailDomain === 'clearcompany.com'
        
        let isRegisteredAnalyst = false
        if (!isAuthorizedDomain) {
          // Check if email exists in analysts table
          const { data: analyst, error: analystError } = await serviceClient
            .from('analysts')
            .select('id, email')
            .eq('email', email.toLowerCase())
            .single()
          
          isRegisteredAnalyst = !analystError && !!analyst
        }

        if (!isAuthorizedDomain && !isRegisteredAnalyst) {
          throw new Error('Access restricted to ClearCompany employees and registered analysts only')
        }

        // Determine role based on validated authorization
        let role: 'ADMIN' | 'EDITOR' | 'ANALYST' = 'EDITOR'
        
        if (isAuthorizedDomain) {
          // All @clearcompany.com users are admins
          role = 'ADMIN'
        } else if (isRegisteredAnalyst) {
          // Registered analysts get ANALYST role
          role = 'ANALYST'
        }
        
        const firstName = authUser.user_metadata?.first_name || authUser.email?.split('@')[0] || 'User'
        const lastName = authUser.user_metadata?.last_name || ''
        const fullName = firstName + (lastName ? ' ' + lastName : '')
        
        const defaultProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: fullName,
          role: role,
          company: authUser.user_metadata?.company || 
                  (isAuthorizedDomain ? 'ClearCompany' : 'Analyst') || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        const { error: createError } = await serviceClient
          .from('user_profiles')
          .insert(defaultProfile)

        if (createError) {
          console.error('Error creating user profile with service role:', createError)
          // Fall back to minimal user
          const userData: UserProfile = {
            id: authUser.id,
            email: authUser.email || '',
            name: defaultProfile.name,
            role: defaultProfile.role as 'ADMIN' | 'EDITOR' | 'ANALYST',
            company: defaultProfile.company,
            profileImageUrl: authUser.user_metadata?.avatar_url || null,
            createdAt: authUser.created_at,
            updatedAt: new Date().toISOString()
          }
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
          return
        }

        // Set user with default profile
        const userData: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: defaultProfile.name,
          role: defaultProfile.role as 'ADMIN' | 'EDITOR' | 'ANALYST',
          company: defaultProfile.company,
          profileImageUrl: authUser.user_metadata?.avatar_url || null,
          createdAt: authUser.created_at,
          updatedAt: new Date().toISOString()
        }

        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else if (profile) {
        // Set user with existing profile
        const userData: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: profile.name || profile.first_name + ' ' + profile.last_name || authUser.email?.split('@')[0] || 'User',
          role: profile.role as 'ADMIN' | 'EDITOR' | 'ANALYST',
          company: profile.company,
          profileImageUrl: authUser.user_metadata?.avatar_url || null,
          createdAt: authUser.created_at,
          updatedAt: profile.updatedAt || profile.updated_at
        }

        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else if (profileError) {
        // Handle other profile errors
        console.error('Error loading user profile:', profileError)
        // Fall back to minimal user
        const userData: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: 'EDITOR',
          company: authUser.user_metadata?.company || null,
          profileImageUrl: authUser.user_metadata?.avatar_url || null,
          createdAt: authUser.created_at,
          updatedAt: new Date().toISOString()
        }
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        return
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Fall back to minimal user
      const userData: UserProfile = {
        id: authUser.id,
        email: authUser.email || '',
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
        role: 'EDITOR',
        company: authUser.user_metadata?.company || null,
        profileImageUrl: authUser.user_metadata?.avatar_url || null,
        createdAt: authUser.created_at,
        updatedAt: new Date().toISOString()
      }
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
      return
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

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
      console.error('Sign in error:', error)
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      }
    }
  }

  const signInAnalyst = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/analyst', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const result = await response.json()

      if (result.success && result.user) {
        // Store user data in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(result.user))
        setUser(result.user)
        return { success: true }
      } else {
        return { 
          success: false, 
          error: result.error || 'Analyst login failed' 
        }
      }
    } catch (error) {
      console.error('Analyst sign in error:', error)
      return { 
        success: false, 
        error: 'An unexpected error occurred' 
      }
    }
  }

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/auth/callback`
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
      console.log('🔄 Starting sign out process...')
      
      // Start API call and Supabase signout in parallel
      const [apiResponse] = await Promise.all([
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }),
        supabase.auth.signOut()
      ])

      if (!apiResponse.ok) {
        console.warn('Logout API call failed:', await apiResponse.text())
      }

      // Clear all storage
      localStorage.removeItem('user')
      sessionStorage.clear()
      
      // Clear user state and wait for it to be processed
      setUser(null)
      
      // Add a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100))
      
      console.log('✅ Sign out completed, redirecting to /auth')
      
      // Use window.location.href instead of replace for more reliable redirect
      window.location.href = '/auth'
    } catch (error) {
      console.error('Sign out error:', error)
      // Emergency cleanup and redirect
      localStorage.removeItem('user')
      sessionStorage.clear()
      setUser(null)
      window.location.href = '/auth'
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        await loadUserProfile(authUser)
      } else {
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
