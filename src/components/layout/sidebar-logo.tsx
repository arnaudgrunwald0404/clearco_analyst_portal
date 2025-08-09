'use client'

import { useState, useEffect } from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'

export function SidebarLogo() {
  const { settings, isInitialized } = useSettings()
  const [logoError, setLogoError] = useState(false)

  // Reset logo error state when settings change
  useEffect(() => {
    setLogoError(false)
  }, [settings?.logoUrl])

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-36 p-4 bg-white border-b border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const companyName = settings?.companyName || 'Portal'
  // Use logoUrl from settings if it's a non-empty string, otherwise it's null
  const logoUrl = settings?.logoUrl && settings.logoUrl.trim() ? settings.logoUrl.trim() : null

  const showLogo = logoUrl && !logoError

  return (
    <div className="flex items-center justify-center h-36 p-4 bg-white border-b border-gray-200">
      {showLogo ? (
        <img
          src={logoUrl}
          alt={`${companyName} Logo`}
          className="max-w-full max-h-full object-contain"
          style={{ minHeight: '60px' }}
          onError={() => {
            console.error('Logo failed to load:', logoUrl)
            setLogoError(true)
          }}
        />
      ) : (
        <div className="text-lg font-bold text-gray-800 text-center">
          {companyName}
        </div>
      )}
    </div>
  )
}
