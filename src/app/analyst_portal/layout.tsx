'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function AnalystPortalRootLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, refreshUser } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hasLocalAnalyst, setHasLocalAnalyst] = useState<boolean>(false)

  // Detect a locally-stored analyst user to avoid premature redirects while context hydrates
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (!raw) { setHasLocalAnalyst(false); return }
      const parsed = JSON.parse(raw)
      setHasLocalAnalyst(!!parsed && parsed.role === 'ANALYST')
    } catch {
      setHasLocalAnalyst(false)
    }
  }, [pathname])

  useEffect(() => {
    if (loading) return

    const isLogin = pathname?.startsWith('/analyst_portal/login')

    // If user is logged in (or we have a local analyst) and hits the login page, go to hub
    if (isLogin && (user?.role === 'ANALYST' || hasLocalAnalyst)) {
      router.replace('/analyst_portal/analyst_hub')
      return
    }

    // Allow the login page itself to render unauthenticated, otherwise we loop
    if (isLogin) return

    // Guard protected analyst pages: if we neither have a context user nor a local analyst, redirect to login
    if (!user || user.role !== 'ANALYST') {
      if (!hasLocalAnalyst) {
        router.replace('/analyst_portal/login')
        return
      }
      // We have a local analyst but context not ready yet; try to refresh once without redirecting
      refreshUser?.()
    }
  }, [user, loading, router, pathname, hasLocalAnalyst, refreshUser])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  // On login page, render children; the effect above will redirect if the user is already signed in
  if (pathname?.startsWith('/analyst_portal/login')) {
    return <>{children}</>
  }

  // If context user missing but local analyst exists, render children to avoid bounce while hydrating
  if ((!user || user.role !== 'ANALYST') && hasLocalAnalyst) {
    return <>{children}</>
  }

  if (!user || user.role !== 'ANALYST') {
    // Avoid flashing protected content while redirecting
    return null
  }

  return <>{children}</>
}
