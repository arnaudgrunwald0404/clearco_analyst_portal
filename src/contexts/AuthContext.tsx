'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

type UserRole = 'ADMIN' | 'EDITOR' | 'ANALYST'

interface UserProfile {
  id: string
  role: UserRole
  first_name: string | null
  last_name: string | null
  company: string | null
  email: string
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Auth loading timeout - forcing loading to false')
        setLoading(false)
      }
    }, 10000) // 10 second timeout

    return () => clearTimeout(timeout)
  }, [loading])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, role, first_name, last_name, company')
        .eq('id', userId)
        .single()

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating new profile for user:', userId)
        const newProfile = {
          id: userId,
          role: 'EDITOR' as UserRole,
          first_name: user?.user_metadata?.first_name || user?.email?.split('@')[0] || '',
          last_name: user?.user_metadata?.last_name || '',
          company: user?.user_metadata?.company || user?.email?.split('@')[1]?.split('.')[0] || '',
          email: user?.email || ''
        }

        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            id: userId,
            role: newProfile.role,
            first_name: newProfile.first_name,
            last_name: newProfile.last_name,
            company: newProfile.company
          })

        if (createError) {
          console.error('Error creating user profile:', createError)
        } else {
          console.log('Successfully created user profile')
        }

        return newProfile
      } else if (error) {
        console.error('Error fetching profile:', error)
        console.error('Error details:', error.message, error.details, error.hint)
        // Return a default profile to prevent infinite loading
        return {
          id: userId,
          role: 'EDITOR' as UserRole,
          first_name: null,
          last_name: null,
          company: null,
          email: user?.email || ''
        } as UserProfile
      }

      console.log('Profile fetched successfully:', data)
      return {
        ...data,
        email: user?.email || ''
      } as UserProfile
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      // Return a default profile to prevent infinite loading
      return {
        id: userId,
        role: 'EDITOR' as UserRole,
        first_name: null,
        last_name: null,
        company: null,
        email: user?.email || ''
      } as UserProfile
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id)
      setProfile(profileData)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          setLoading(false)
          return
        }
        
        if (session?.user) {
          console.log('Found session for user:', session.user.id)
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          console.log('No session found')
        }
        
        setLoading(false)
      } catch (error) {
        console.error('Error getting initial session:', error)
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user)
          const profileData = await fetchProfile(session.user.id)
          setProfile(profileData)
        } else {
          setUser(null)
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile
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
