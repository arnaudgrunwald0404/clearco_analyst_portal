'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AnalystHeader from '@/components/analyst/AnalystHeader'
import AnalystSidebar from '@/components/analyst/AnalystSidebar'

interface SettingsLayoutProps {
  children: React.ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || user.role !== 'ANALYST')) {
      router.push('/analyst_portal/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  if (!user || user.role !== 'ANALYST') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalystHeader />
      <div className="flex">
        <AnalystSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
