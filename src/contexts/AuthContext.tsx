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
        } else {
          // No session, try localStorage fallback
          const storedUser = localStorage.getItem('user')
          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser)
              setUser(userData)
              console.log('Loaded user from localStorage (no session)')
            } catch (parseError) {
              console.error('Error parsing stored user:', parseError)
            }
          }
        }
      } catch (error) {
        console.error('Error loading user:', error)
        // Try localStorage fallback on any error
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser)
            setUser(userData)
            console.log('Loaded user from localStorage (error fallback)')
          } catch (parseError) {
            console.error('Error parsing stored user:', parseError)
          }
        }
      } finally {
        setLoading(false)
      }
    }

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Auth loading timeout - forcing loading to false')
      setLoading(false)
      // Set a default user for development
      if (!user) {
        setUser({
          id: 'dev-user',
          email: 'dev@example.com',
          name: 'Development User',
          role: 'ADMIN',
          company: 'ClearCompany',
          profileImageUrl: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }, 5000) // 5 second timeout for faster development

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
        
        // Determine role based on email
        let role: 'ADMIN' | 'EDITOR' | 'ANALYST' = 'EDITOR'
        
        if (emailDomain === 'clearcompany.com') {
          // Check if it's a fake analyst email
          if (emailName === 'sarah.chen' || emailName === 'mike.johnson' || emailName === 'lisa.wang') {
            role = 'ANALYST'
          } else {
            role = 'ADMIN'
          }
        } else if (emailDomain === 'analystcompany.com') {
          // All @analystcompany.com users are ANALYST
          role = 'ANALYST'
        }
        
        const defaultProfile = {
          id: authUser.id,
          role: role,
          first_name: authUser.user_metadata?.first_name || 
                     authUser.email?.split('@')[0] || 'User',
          last_name: authUser.user_metadata?.last_name || '',
          company: authUser.user_metadata?.company || 
                  emailDomain || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Use service role client to bypass RLS
        const serviceClient = createServiceClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { error: createError } = await serviceClient
          .from('user_profiles')
          .insert(defaultProfile)

        if (createError) {
          console.error('Error creating user profile with service role:', createError)
          // Don't set user if profile creation fails
          return
        }

        // Set user with default profile
        const userData: UserProfile = {
          id: authUser.id,
          email: authUser.email || '',
          name: defaultProfile.first_name + ' ' + defaultProfile.last_name,
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
          name: (profile.first_name || '') + ' ' + (profile.last_name || ''),
          role: profile.role as 'ADMIN' | 'EDITOR' | 'ANALYST',
          company: profile.company,
          profileImageUrl: authUser.user_metadata?.avatar_url || null,
          createdAt: authUser.created_at,
          updatedAt: profile.updated_at
        }

        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } else if (profileError) {
        // Handle other profile errors
        console.error('Error loading user profile:', profileError)
        // Don't set user if profile loading fails
        return
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Don't set user if there's an error
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
      setUser(null)

      // Single redirect
      window.location.replace('/auth')
    } catch (error) {
      console.error('Sign out error:', error)
      // Emergency cleanup and redirect
      localStorage.removeItem('user')
      sessionStorage.clear()
      setUser(null)
      window.location.replace('/auth')
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
