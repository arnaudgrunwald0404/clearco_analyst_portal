'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './AuthContext'

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

const createFallbackSettings = (preservedSettings?: Partial<CompanySettings>): CompanySettings => ({
  id: preservedSettings?.id || 'fallback',
  companyName: preservedSettings?.companyName || 'ClearCompany',
  protectedDomain: preservedSettings?.protectedDomain || 'clearcompany.com',
  logoUrl: preservedSettings?.logoUrl || '/clearco-logo.png', // Default to ClearCompany logo
  industryName: preservedSettings?.industryName || 'HR Technology',
  createdAt: preservedSettings?.createdAt || new Date().toISOString(),
  updatedAt: preservedSettings?.updatedAt || new Date().toISOString()
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
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
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch('/api/settings/general', {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      if (response.ok) {
        const data = await response.json()
        // Extract only the settings data, excluding cache metadata
        const { cached, cacheAge, ...rawSettings } = data
        
        // Convert snake_case API response to camelCase for frontend
        const settingsData: CompanySettings = {
          id: rawSettings.id,
          companyName: rawSettings.companyName || rawSettings.company_name,
          protectedDomain: rawSettings.protectedDomain || rawSettings.protected_domain,
          logoUrl: rawSettings.logoUrl || rawSettings.logo_url,
          industryName: rawSettings.industryName || rawSettings.industry_name,
          createdAt: rawSettings.createdAt || rawSettings.created_at,
          updatedAt: rawSettings.updatedAt || rawSettings.updated_at
        }
        
        setSettings(settingsData)
        setLastFetch(Date.now())
      } else if (response.status === 401) {
        // Authentication required - use fallback settings instead of redirecting
        console.warn('Settings API authentication failed, using fallback settings')
        setSettings(createFallbackSettings())
        // Don't set error for 401 - just use fallbacks silently
      } else {
        setError('Failed to load company settings')
        // Set fallback settings for other errors too
        setSettings(createFallbackSettings())
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setError('Failed to load company settings')
      
      // Set fallback settings so the app can still function
      setSettings(createFallbackSettings())
    } finally {
      setLoading(false)
      setIsInitialized(true)
    }
  }

  useEffect(() => {
    console.log('🔧 SettingsContext: Auth loading state changed:', { authLoading, loading, isInitialized })
    
    // Wait for auth to complete before attempting to fetch settings
    if (!authLoading) {
      console.log('🔧 SettingsContext: Auth completed, starting settings fetch...')
      
      // Add a small delay to ensure session is fully established
      const timer = setTimeout(() => {
        console.log('🔧 SettingsContext: Calling fetchSettings()')
        fetchSettings()
      }, 100) // Small delay to ensure session is ready
      
      // Add emergency timeout to prevent infinite loading
      const emergencyTimeout = setTimeout(() => {
        console.warn('⚠️ Settings loading timeout - using fallback settings')
        if (loading) {
          console.log('🔧 SettingsContext: Emergency timeout triggered, using fallbacks')
          // Preserve any existing settings when creating fallbacks
          setSettings(currentSettings => createFallbackSettings(currentSettings || undefined))
          setLoading(false)
          setIsInitialized(true)
        }
      }, 10000) // 10 second emergency timeout
      
      return () => {
        clearTimeout(timer)
        clearTimeout(emergencyTimeout)
      }
    }
  }, [authLoading])

  const value = {
    settings,
    loading: loading || authLoading,
    error,
    refetch: () => fetchSettings(true),
    isInitialized: isInitialized && !authLoading
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