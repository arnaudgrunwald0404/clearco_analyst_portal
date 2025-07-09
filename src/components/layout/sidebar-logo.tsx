'use client'

import { useState, useEffect } from 'react'

export function SidebarLogo() {
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/general')
        if (response.ok) {
          const data = await response.json()
          setLogoUrl(data.logoUrl || '')
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      }
    }

    fetchSettings()
  }, [])

  if (!logoUrl) {
    return null
  }

  return (
    <div className="flex items-center justify-center h-48 p-6 bg-gray-50/90 border-b border-gray-200">
      <img
        src={logoUrl}
        alt="Company Logo"
        className="max-w-full max-h-full object-contain"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}
