'use client'

import React from 'react'
import { useSettings } from '@/contexts/SettingsContext'
import { Loader2 } from 'lucide-react'

interface SettingsLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function SettingsLoader({ children, fallback }: SettingsLoaderProps) {
  const { loading, error } = useSettings()

  if (loading) {
    return fallback || (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-white mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Loading Company Settings</h2>
          <p className="text-gray-300">Preparing your personalized experience...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-white mb-2">Failed to Load Settings</h2>
            <p className="text-gray-300 mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
} 