'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { PortalHeader } from '@/components/portal/PortalHeader'
import { getRandomBannerImagePath } from '@/lib/banner-utils'
import { useAuth } from '@/contexts/AuthContext'
import BriefingSummary from '@/components/briefings/BriefingSummary'

interface PortalLayoutProps {
  children: React.ReactNode
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [companySettings, setCompanySettings] = useState<any>(null)
  const router = useRouter()
  const { user } = useAuth()

  // Redirect if not authenticated or not an analyst
  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    
    // Only allow ANALYST users in the portal
    if (user.role !== 'ANALYST') {
      router.push('/')
      return
    }
  }, [user, router])

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/settings/general')
        const data = await response.json()
        setCompanySettings(data)
      } catch (error) {
        console.error('Error fetching company settings:', error)
      }
    }
    fetchCompanySettings()
  }, [])

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader companyName={companySettings?.companyName} />

      {/* Briefing Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <BriefingSummary />
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  )
}
