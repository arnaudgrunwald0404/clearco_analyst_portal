'use client'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles = ['ADMIN', 'EDITOR'], 
  redirectTo 
}: ProtectedRouteProps) {
  // Disabled authentication - always allow access
  return <>{children}</>
}
