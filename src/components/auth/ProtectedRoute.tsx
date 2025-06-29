'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'

type UserRole = 'ADMIN' | 'EDITOR'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['ADMIN', 'EDITOR'], 
  redirectTo 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated, redirect to login
      router.push('/auth')
        return
      }

      if (!profile) {
        // User exists but no profile found, redirect to login
        router.push('/auth')
        return
      }

      if (!allowedRoles.includes(profile.role)) {
        // User doesn't have required role
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          // Redirect to home for unauthorized users
          router.push('/')
        }
        return
      }
    }
  }, [user, profile, loading, allowedRoles, redirectTo, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile || !allowedRoles.includes(profile.role)) {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}
