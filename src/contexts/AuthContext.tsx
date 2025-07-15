'use client'

import { createContext, useContext, ReactNode, useState } from 'react'

// Mock user data - you can change role to 'ANALYST' if needed
const mockUser = {
  id: 'admin-uuid-123',
  email: 'admin@example.com',
  user_metadata: {
    first_name: 'Admin',
    last_name: 'User'
  }
}

const mockAdminProfile = {
  id: 'admin-uuid-123',
  role: 'ADMIN' as const,
  first_name: 'Admin',
  last_name: 'User',
  company: 'ClearCompany',
  email: 'admin@example.com'
}

const mockAnalystProfile = {
  id: 'analyst-uuid-456',
  role: 'ANALYST' as const,
  first_name: 'Sarah',
  last_name: 'Chen',
  company: 'ClearCompany',
  email: 'sarah.chen@clearcompany.com'
}

type User = typeof mockUser
type UserProfile = {
  id: string
  role: 'ADMIN' | 'EDITOR' | 'ANALYST'
  first_name: string
  last_name: string
  company: string
  email: string
}
type UserRole = 'ADMIN' | 'EDITOR' | 'ANALYST'

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  toggleRole: () => void
  currentRole: 'ADMIN' | 'ANALYST'
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentRole, setCurrentRole] = useState<'ADMIN' | 'ANALYST'>('ADMIN')
  
  const toggleRole = () => {
    setCurrentRole(currentRole === 'ADMIN' ? 'ANALYST' : 'ADMIN')
  }
  
  const profile = currentRole === 'ADMIN' ? mockAdminProfile : mockAnalystProfile
  
  // Always return mock data - no authentication needed
  const value = {
    user: mockUser,
    profile,
    loading: false,
    signOut: async () => {
      // Mock sign out - just log
      console.log('Mock sign out called')
    },
    refreshProfile: async () => {
      // Mock refresh - just log
      console.log('Mock profile refresh called')
    },
    toggleRole,
    currentRole
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
