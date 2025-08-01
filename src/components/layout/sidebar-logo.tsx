'use client'

import { useSettings } from '@/contexts/SettingsContext'

export function SidebarLogo() {
  const { settings, isInitialized } = useSettings()

  // Don't render logo until settings are initialized
  if (!isInitialized || !settings) {
    return (
      <div className="flex items-center justify-center h-36 p-4 bg-white border-b border-gray-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Use actual settings - no fallbacks
  const logoUrl = settings.logoUrl
  const companyName = settings.companyName

  return (
    <div className="flex items-center justify-center h-36 p-4 bg-white border-b border-gray-200">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${companyName} Logo`}
          className="max-w-full max-h-24 object-contain"
          style={{ minHeight: '60px' }}
          onError={(e) => {
            console.error('Custom logo failed to load:', logoUrl)
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'
            }
          }}
          onLoad={() => {
            console.log('Custom logo loaded successfully:', logoUrl)
          }}
        />
      ) : (
        <img
          src="/clearco-logo.png"
          alt="ClearCompany Logo"
          className="max-w-full max-h-24 object-contain"
          style={{ minHeight: '60px' }}
          onError={(e) => {
            console.error('Default logo failed to load')
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'
            }
          }}
          onLoad={() => {
            console.log('Default logo loaded successfully')
          }}
        />
      )}
      <div 
        className="flex items-center justify-center text-lg font-bold text-gray-800"
        style={{ display: 'none' }}
      >
        {companyName}
      </div>
    </div>
  )
}
