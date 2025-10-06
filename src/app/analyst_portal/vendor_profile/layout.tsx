'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { PortalHeader } from '@/components/portal/PortalHeader'
import PortalShell from '@/components/portal/PortalShell'
import MergedSidebar from '@/components/portal/MergedSidebar'
import VendorNotes from '@/components/portal/VendorNotes'
import VendorSwitcherDrawer from '@/components/portal/VendorSwitcherDrawer'

interface PortalLayoutProps {
  children: React.ReactNode
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const [vendorSettings, setVendorSettings] = useState<any>(null)
  const [vendorDrawerOpen, setVendorDrawerOpen] = useState(false)
  const [selectedVendorName, setSelectedVendorName] = useState<string | null>(null)
  const router = useRouter()
  const { user, loading } = useAuth()

  // Redirect if not authenticated or not an analyst (wait for auth to finish loading)
  useEffect(() => {
    if (loading) return
    if (!user) {
      router.push('/analyst_portal/login')
      return
    }
    if (user.role !== 'ANALYST') {
      router.push('/')
      return
    }
  }, [user, loading, router])

  // Fetch vendor settings after auth is ready
  useEffect(() => {
    if (loading || !user) return
    const fetchVendorSettings = async () => {
      try {
        const response = await fetch('/api/settings/general')
        if (response.ok) {
          try {
            const data = await response.json()
            setVendorSettings(data)
            const name = data?.company_name || null
            // Initialize selected vendor from localStorage or settings
            const stored = typeof window !== 'undefined' ? localStorage.getItem('selectedVendorName') : null
            setSelectedVendorName(stored || name)
            if (!stored && name && typeof window !== 'undefined') {
              localStorage.setItem('selectedVendorName', name)
            }
          } catch (parseError) {
            console.error('Error parsing vendor settings:', parseError)
          }
        }
      } catch (error) {
        console.error('Error fetching vendor settings:', error)
      }
    }
    fetchVendorSettings()
  }, [loading, user])

  // Show loading while checking authentication
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader selectedVendorName={selectedVendorName || vendorSettings?.company_name} />

      {/* Drawer for switching vendor */}
      <VendorSwitcherDrawer
        open={vendorDrawerOpen}
        onClose={() => setVendorDrawerOpen(false)}
        vendors={vendorSettings?.company_name ? [vendorSettings.company_name] : []}
        selected={selectedVendorName}
        onSelect={(name) => {
          setSelectedVendorName(name)
          try { localStorage.setItem('selectedVendorName', name) } catch {}
          try {
            const slug = encodeURIComponent(name)
            // Persist selection in a cookie for server and client fetches
            document.cookie = `vendor_slug=${slug}; path=/; max-age=${60 * 60 * 24 * 30}`
            // Refresh so SSR picks up the cookie where needed
            if (typeof window !== 'undefined') window.location.reload()
          } catch {}
          setVendorDrawerOpen(false)
        }}
      />

      {/* Render a persistent 3-column shell for all /portal pages */}
      <PortalShell
        sidebar={
          <MergedSidebar
            selectedVendorName={selectedVendorName || vendorSettings?.company_name}
            onSwitchVendor={() => setVendorDrawerOpen(true)}
          />
        }
rightSidebar={
          <div className="space-y-4">
            {/* Replaced analyst profile with vendor-specific private notes */}
            {/* Analysts can now find their profile and publications on /analyst_portal/analyst_hub */}
            <VendorNotes />
          </div>
        }
      >
        {children}
      </PortalShell>
    </div>
  )
}
