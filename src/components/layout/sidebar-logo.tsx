'use client'

import { useState, useEffect } from 'react'

export function SidebarLogo() {
  const [logoUrl, setLogoUrl] = useState('')
  const [companyName, setCompanyName] = useState('')

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings/general')
        if (response.ok) {
          const data = await response.json()
          setLogoUrl(data.logoUrl || '')
          setCompanyName(data.companyName || 'ClearCompany')
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        setCompanyName('ClearCompany')
      }
    }

    fetchSettings()
  }, [])

  return (
    <div className="flex items-center justify-center h-36 p-4 bg-white border-b border-gray-200">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${companyName} Logo`}
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'
            }
          }}
        />
      ) : null}
      <div 
        className="flex items-center justify-center"
        style={{ display: logoUrl ? 'none' : 'flex' }}
      >
        <img
          src="/clearco-logo.png"
          alt="ClearCompany Logo"
          className="max-w-full max-h-full object-contain"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
            if (e.currentTarget.nextSibling) {
              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'
            }
          }}
        />
      </div>
      <div 
        className="flex items-center justify-center text-lg font-bold text-gray-800"
        style={{ display: logoUrl ? 'none' : 'flex' }}
      >
        {companyName}
      </div>
    </div>
  )
}
