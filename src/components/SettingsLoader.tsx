/**
 * SettingsLoader component
 * Handles loading state for company settings and prevents showing the app until settings are loaded
 */

import React from 'react'
import { useSettings } from '@/contexts/SettingsContext'

interface SettingsLoaderProps {
  children: React.ReactNode
}

export const SettingsLoader: React.FC<SettingsLoaderProps> = ({ children }) => {
  const { loading, error, isInitialized } = useSettings()

  // Show loading spinner while settings are being fetched
  if (loading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading your idiodyncrasies...</p>
          <p className="text-gray-500 text-sm mt-2">Because you're so special...</p>
        </div>
      </div>
    )
  }

  // Show error state if settings failed to load
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg font-medium">Failed to load settings</p>
          <p className="text-gray-500 text-sm mt-2">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  // Render children once settings are loaded
  return <>{children}</>
} 