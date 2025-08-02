'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CompanySettings {
  id: string
  companyName: string
  protectedDomain: string
  logoUrl: string
  industryName: string
  createdAt: string
  updatedAt: string
}

interface SettingsContextType {
  settings: CompanySettings | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  isInitialized: boolean
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchSettings = async (force = false) => {
    // Cache for 5 minutes
    const cacheTime = 5 * 60 * 1000
    if (!force && settings && (Date.now() - lastFetch) < cacheTime) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings/general')
      if (response.ok) {
        const data = await response.json()
        // Extract only the settings data, excluding cache metadata
        const { cached, cacheAge, ...settingsData } = data
        setSettings(settingsData)
        setLastFetch(Date.now())
      } else {
        setError('Failed to load company settings')
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setError('Failed to load company settings')
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    fetchSettings()
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.warn('Settings loading timeout - forcing loading to false')
      setLoading(false)
      setIsInitialized(true)
      // Set default settings if none exist
      if (!settings) {
        setSettings({
          id: 'default-settings',
          companyName: 'ClearCompany',
          protectedDomain: 'clearcompany.com',
          logoUrl: '',
          industryName: 'HR Technology',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    }, 5000) // 5 second timeout for faster development
    
    return () => clearTimeout(timeoutId)
  }, [])

  const value = {
    settings,
    loading,
    error,
    refetch: () => fetchSettings(true),
    isInitialized
  }

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
} 