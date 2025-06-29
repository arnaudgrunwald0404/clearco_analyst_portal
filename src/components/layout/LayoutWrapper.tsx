'use client'

import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Sidebar } from './sidebar'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const { user, profile, loading } = useAuth()

  // Pages that should not show the sidebar
  const publicPages = ['/login', '/auth', '/auth/callback', '/auth/auth-code-error', '/auth/forgot-password', '/auth/reset-password']
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))

  // Analyst portal pages have their own layout
  const isAnalystPortal = pathname.startsWith('/portal')

  // Public pages (login, auth) - no sidebar
  if (isPublicPage) {
    return <>{children}</>
  }

  // Analyst portal pages - no sidebar (they have their own layout)
  if (isAnalystPortal) {
    return <>{children}</>
  }

  // Always show sidebar for all other pages (temporarily bypass auth checks)
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
