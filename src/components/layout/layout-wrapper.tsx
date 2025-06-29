'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Loader2 } from 'lucide-react'

interface LayoutWrapperProps {
  children: React.ReactNode
}

interface User {
  email: string
  name: string
  role: 'ADMIN' | 'EDITOR'
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Pages that don't require authentication
  const publicPages = ['/login', '/auth', '/portal']
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))

  // Analyst portal pages have their own layout
  const isAnalystPortal = pathname.startsWith('/portal')

  useEffect(() => {
    // Check for user in localStorage
    const checkAuth = () => {
      try {
        const userData = localStorage.getItem('user')
        if (userData) {
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
        }
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('user')
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  // Redirect to login if not authenticated and not on a public page
  useEffect(() => {
    if (!loading && !user && !isPublicPage) {
        router.push('/auth')
    }
  }, [loading, user, isPublicPage, router])

  // Show loading screen during auth check
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

  // Public pages (login, analyst portal) - no sidebar
  if (isPublicPage) {
    return <>{children}</>
  }

  // Protected admin pages - show sidebar
  if (user && (user.role === 'ADMIN' || user.role === 'EDITOR')) {
    return (
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    )
  }

  // Default fallback
  return <>{children}</>
}
