'use client'

import { usePathname } from 'next/navigation'
import { Sidebar } from './sidebar'
import Header from '@/components/ui/Header';
import { SettingsLoader } from '@/components/SettingsLoader';

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()

  // Pages that should not show the sidebar
  const publicPages = ['/login', '/auth', '/auth/callback', '/auth/auth-code-error', '/auth/forgot-password', '/auth/reset-password', '/signup', '/analyst-login']
  const isPublicPage = publicPages.some(page => pathname.startsWith(page))
  
  // 404 and error pages should also be public (no sidebar, no settings loading)
  const isErrorPage = pathname === '/404' || !pathname || pathname.includes('/non-existent')

  // Analyst portal pages have their own layout
  const isAnalystPortal = pathname.startsWith('/portal')

  // Public pages (login, auth) and error pages - no sidebar, no settings loading
  if (isPublicPage || isErrorPage) {
    return <>{children}</>
  }

  // Analyst portal pages - no sidebar (they have their own layout), no settings loading
  if (isAnalystPortal) {
    return <>{children}</>
  }

  // All other pages - show sidebar with settings loading
  return (
    <SettingsLoader>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Header />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SettingsLoader>
  )
}
