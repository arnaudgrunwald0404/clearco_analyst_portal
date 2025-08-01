'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: ('ADMIN' | 'EDITOR' | 'ANALYST')[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['ADMIN', 'EDITOR'], 
  redirectTo = '/auth'
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // User not authenticated, redirect to login
        router.push(redirectTo)
        return
      }

      if (allowedRoles && !allowedRoles.includes(user.role)) {
        // User doesn't have required role
        const defaultRedirect = user.role === 'ANALYST' ? '/portal' : '/'
        router.push(defaultRedirect)
        return
      }
    }
  }, [user, loading, allowedRoles, router, redirectTo])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Show nothing while redirecting
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    return null
  }

  // Render protected content
  return <>{children}</>
}
