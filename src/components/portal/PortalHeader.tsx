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
      <div className="absolute inset-0 bg-opacity-40"></div>
      
            {/* Header content */}
      <div className="relative z-10 h-full flex items-center justify-between pr-6">
        {/* Cupcake logo on the left - touching screen edge */}
        <img 
          src="/cupcake_logo.png" 
          alt="Cupcake Logo" 
          className="h-36 w-auto object-contain"
        />
        
        {/* Center content */}
        <div className="text-gray text-center flex-1">
          <h1 className="text-2xl font-bold text-center">
          Welcome to your Analyst portal by {settings?.companyName || companyName}
          </h1>
          <p className="text-lg opacity-90">
            Cupcake is HR Tech's Industry Relationship Management Portal
          </p>
        </div>
        
        {/* Logout button on the right */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-2 px-4 py-2 bg-white text-black rounded-lg transition-all duration-200 backdrop-blur-sm border border-black"
          aria-label="Sign out"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </header>
  )
}