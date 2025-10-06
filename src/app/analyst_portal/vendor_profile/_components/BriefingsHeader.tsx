'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function BriefingsHeader() {
  const { user } = useAuth()
  const [analystEmail, setAnalystEmail] = useState<string>('User')
  const [selectedVendorName, setSelectedVendorName] = useState<string>('Vendor')

  useEffect(() => {
    const determineAnalystEmail = () => {
      if (!user?.email) return

      // If user role is ANALYST, they're directly logged in as an analyst
      if (user.role === 'ANALYST') {
        setAnalystEmail(user.email)
        return
      }

      // For admin users, the user object in AuthContext represents the current context
      // When impersonating, the AuthContext should contain the analyst's data
      setAnalystEmail(user.email)
    }

    const fetchVendorName = async () => {
      try {
        const response = await fetch('/api/settings/general')
        if (response.ok) {
          try {
            const data = await response.json()
            setSelectedVendorName(data?.company_name || 'Vendor')
          } catch (parseError) {
            console.error('Error parsing vendor settings:', parseError)
            setSelectedVendorName('Vendor')
          }
        }
      } catch (error) {
        console.error('Error fetching vendor name:', error)
      }
    }

    determineAnalystEmail()
    fetchVendorName()
  }, [user?.email, user?.role])

  return (
    <h2 className="text-lg font-semibold text-gray-900">
      Your Briefings with {selectedVendorName}
    </h2>
  )
}
