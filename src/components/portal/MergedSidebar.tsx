'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Calendar, MessageSquarePlus, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MergedSidebarProps {
  selectedVendorName?: string
  onSwitchVendor?: () => void
}

export default function MergedSidebar({ selectedVendorName, onSwitchVendor }: MergedSidebarProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [vendorSettings, setVendorSettings] = useState<any>(null)
  const [portal, setPortal] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Load vendor settings and portal data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load vendor settings
        const settingsResponse = await fetch('/api/settings/general', { cache: 'no-store' })
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json()
          setVendorSettings(settingsData)
        }

        // Load portal data
        const portalResponse = await fetch('/api/portal-content', { cache: 'no-store' })
        if (portalResponse.ok) {
          const portalData = await portalResponse.json()
          setPortal(portalData)
        }
      } catch (error) {
        console.error('Error loading sidebar data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleSwitchVendor = () => {
    if (onSwitchVendor) {
      onSwitchVendor()
    }
  }

  const handleViewLastBriefing = () => {
    // Navigate to last briefing or briefings list
    router.push('/briefings')
  }

  const displayVendorName = selectedVendorName || vendorSettings?.company_name || 'ClearCompany'

  // Get contact info
  let contactName: string | null = null
  let contactTitle: string | null = null
  let contactEmail: string | null = null

  if (portal?.contactName && portal?.contactTitle) {
    contactName = portal.contactName
    contactTitle = portal.contactTitle
    contactEmail = portal.contactEmail || null
  } else if (portal?.quoteAuthor) {
    const parts = portal.quoteAuthor.split(',')
    contactName = parts[0]?.trim() || contactName
    contactTitle = parts.slice(1).join(',').trim() || contactTitle
  }

  const contactImageUrl = portal?.contactImageUrl || portal?.authorImageUrl || null

  const initials = useMemo(() => {
    if (!contactName) return ''
    return contactName
      .split(' ')
      .map((s) => s?.[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [contactName])

  if (loading) {
    return (
      <div className="bg-white text-gray-900 rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white text-gray-900 rounded-lg border border-gray-200 shadow-sm">
      {/* Switch Vendor Button */}
      <div className="border-b border-gray-200 pb-4 flex justify-center pt-4">
        <button
          onClick={handleSwitchVendor}
          className="px-10 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
        >
          Switch Vendor
        </button>
      </div>

      {/* Vendor Profile Section */}
      <div className="px-6 py-4">
        <div className="text-sm text-gray-700 mb-4">
          You are viewing <span className="font-semibold">{displayVendorName}</span>'s vendor profile.
        </div>
        
        {/* Company Logo */}
        <div className="flex justify-center mb-4">
          {vendorSettings?.logoUrl ? (
            <img
              src={vendorSettings.logoUrl}
              alt={`${displayVendorName} logo`}
              className="h-12 w-auto max-w-full object-contain"
            />
          ) : (
            <div className="flex items-center justify-center h-12 w-24 bg-blue-100 rounded-lg">
              <span className="text-blue-600 font-semibold text-lg">
                {displayVendorName.split(' ').map(word => word[0]).join('').slice(0, 2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions Section - No Label */}
      <div className="border-t border-gray-200 pt-4 pb-4">
        <div className="flex flex-col gap-2 px-6">
          <Button variant="ghost" className="justify-start gap-2" onClick={handleViewLastBriefing}>
            <Calendar className="w-4 h-4" />
            View Last Briefing
          </Button>
          <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/scheduling-agent')}>
            <MessageSquarePlus className="w-4 h-4" />
            Request a Briefing
          </Button>
          <Button variant="ghost" className="justify-start gap-2" onClick={() => router.push('/analyst_portal/vendor_profile/resources')}>
            <FolderOpen className="w-4 h-4" />
            Recent Materials
          </Button>
        </div>
      </div>
    </div>
  )
}
