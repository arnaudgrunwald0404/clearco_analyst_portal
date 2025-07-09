'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from './sidebar'
import Header from '@/components/ui/Header'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  // Pages that should not show the sidebar and don't require authentication
  const publicPages = ['/login', '/auth', '/auth/callback', '/auth/auth-code-error', '/auth/forgot-password', '/auth/reset-password', '/signup']
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))

  // Analyst portal pages have their own layout but still require authentication
  const isAnalystPortal = pathname.startsWith('/portal')

  // Redirect unauthenticated users to auth page (except for public pages)
  useEffect(() => {
    if (!loading && !isPublicPage) {
      if (!user) {
        console.log('No user found, redirecting to auth page')
        router.push('/auth')
        return
      }
      
      if (!profile) {
        console.log('No profile found, redirecting to auth page')
        router.push('/auth')
        return
      }
    }
  }, [user, profile, loading, isPublicPage, router])

  // Show loading spinner while checking authentication
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

  // Public pages (login, auth) - no sidebar, no auth required
  if (isPublicPage) {
    return <>{children}</>
  }

  // If user is not authenticated, don't render anything (will redirect in useEffect)
  if (!user || !profile) {
    return null
  }

  // Analyst portal pages - no sidebar (they have their own layout) but require auth
  if (isAnalystPortal) {
    return <>{children}</>
  }

  // Protected pages with sidebar
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header />
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
