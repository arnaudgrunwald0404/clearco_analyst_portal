'use client'

import { useState, useEffect } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { getRandomBannerImagePath } from '@/lib/utils/banner-utils'

interface PortalHeaderProps {
  companyName?: string
}

export function PortalHeader({ companyName = 'ClearCompany' }: PortalHeaderProps) {
  const { user, signOut } = useAuth()
  const { settings } = useSettings()
  const [bannerImage, setBannerImage] = useState<string>('')
  const [bannerError, setBannerError] = useState(false)

  // Initialize banner image
  useEffect(() => {
    // Get or set a banner image for this session (persist per session)
    let sessionBanner = sessionStorage.getItem('portalBannerImage')
    if (!sessionBanner) {
      sessionBanner = getRandomBannerImagePath()
      sessionStorage.setItem('portalBannerImage', sessionBanner)
      console.log('Generated new portal banner image:', sessionBanner)
    } else {
      console.log('Using existing portal banner image:', sessionBanner)
    }
    setBannerImage(sessionBanner)
  }, [])

  // Test if banner image loads successfully
  useEffect(() => {
    if (bannerImage) {
      const img = new Image()
      img.onload = () => {
        setBannerError(false)
        console.log('Portal banner image loaded successfully:', bannerImage)
      }
      img.onerror = () => {
        setBannerError(true)
        console.error('Portal banner image failed to load:', bannerImage)
      }
      img.src = bannerImage
    }
  }, [bannerImage])

  // Create banner style with image or gradient fallback
  const bannerStyle = bannerImage && !bannerError
    ? { 
        backgroundImage: `url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : { 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }

  const handleLogout = async () => {
    await signOut()
  }

  return (
    <header 
      className="w-full h-36 relative"
      style={bannerStyle}
      role="banner"
      aria-label="Portal header"
    >
      {/* Dark overlay for text legibility */}
      <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      
      {/* Header content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        {/* Top row with logout button */}
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>

        {/* Bottom row with welcome message */}
        <div className="text-white">
          <h1 className="text-2xl font-bold mb-1">
            Welcome back, {user?.name || 'Analyst'}!
          </h1>
          <p className="text-lg opacity-90">
            Analyst Portal • {settings?.companyName || companyName}
          </p>
        </div>
      </div>
    </header>
  )
}