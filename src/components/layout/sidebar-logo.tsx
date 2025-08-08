'use client'

import { useSettings } from '@/contexts/SettingsContext'
import { useAuth } from '@/contexts/AuthContext'

export function SidebarLogo() {
  const { settings, isInitialized } = useSettings()
  const { user } = useAuth()

  // Don't render logo until settings are initialized
  if (!isInitialized || !settings) {
    return (
      <div className="flex items-center justify-center h-36 p-4 bg-white border-b border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Use actual settings with improved logo handling
  const logoUrl = settings.logoUrl
  const companyName = settings.companyName
  
  // Define a default logo URL for ClearCompany when none is provided
  const defaultLogoUrl = '/clearco-logo.png'
  const shouldUseDefaultLogo = !logoUrl && companyName?.toLowerCase().includes('clearcompany')
  const effectiveLogoUrl = logoUrl || (shouldUseDefaultLogo ? defaultLogoUrl : null)

  return (
    <div className="flex items-center justify-center h-36 p-4 bg-white border-b border-gray-200">
      {/* Show logo if user is authenticated and we have a logo URL (custom or default) */}
      {user && effectiveLogoUrl ? (
        <img
          src={effectiveLogoUrl}
          alt={`${companyName} Logo`}
          className="max-w-full max-h-full object-contain"
          style={{ minHeight: '60px' }}
          onError={(e) => {
            console.error('Logo failed to load:', effectiveLogoUrl)
            // Hide the failed image
            e.currentTarget.style.display = 'none'
            // Show the company name fallback
            const fallbackDiv = e.currentTarget.nextSibling as HTMLElement
            if (fallbackDiv) {
              fallbackDiv.style.display = 'flex'
            }
          }}
          onLoad={() => {
            console.log('Logo loaded successfully:', effectiveLogoUrl)
          }}
        />
      ) : null}
      
      {/* Company name fallback - always present but hidden when logo loads successfully */}
      <div 
        className="flex items-center justify-center text-lg font-bold text-gray-800"
        style={{ display: user && effectiveLogoUrl ? 'none' : 'flex' }}
      >
        {companyName || 'Portal'}
      </div>

    </div>
  )
}
