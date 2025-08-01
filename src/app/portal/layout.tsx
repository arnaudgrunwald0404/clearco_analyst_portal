'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, LogOut } from 'lucide-react'
import { getRandomBannerImagePath } from '@/lib/banner-utils'
import { useAuth } from '@/contexts/AuthContext'
import BriefingSummary from '@/components/briefings/BriefingSummary'

interface PortalLayoutProps {
  children: React.ReactNode
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [bannerImage, setBannerImage] = useState<string>('')
  const [bannerError, setBannerError] = useState<boolean>(false)
  const [companySettings, setCompanySettings] = useState<any>(null)
  const router = useRouter()
  const { user, signOut } = useAuth()

  // Redirect if not authenticated or not an analyst
  useEffect(() => {
    if (!user) {
      router.push('/auth')
      return
    }
    
    // Only allow ANALYST users in the portal
    if (user.role !== 'ANALYST') {
      router.push('/')
      return
    }
  }, [user, router])

  const handleLogout = async () => {
    console.log('🚪 PORTAL LOGOUT: Signing out from analyst portal...')
    
    try {
      // Clear session storage
      sessionStorage.removeItem('portalBannerImage')
      
      // Call the real signOut function from AuthContext
      await signOut()
      console.log('✅ Portal logout successful - redirected to login page')
    } catch (error) {
      console.error('❌ Portal logout error:', error)
      // Even if there's an error, we should still redirect to login
      window.location.href = '/auth'
    }
  }

  // Load banner image for this session (persist per session)
  useEffect(() => {
    let sessionBanner = sessionStorage.getItem('portalBannerImage')
    if (!sessionBanner) {
      sessionBanner = getRandomBannerImagePath()
      sessionStorage.setItem('portalBannerImage', sessionBanner)
      console.log('Generated new banner image:', sessionBanner)
    } else {
      console.log('Using existing banner image:', sessionBanner)
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

  // Fetch company settings
  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const response = await fetch('/api/settings/general')
        const data = await response.json()
        setCompanySettings(data)
      } catch (error) {
        console.error('Error fetching company settings:', error)
      }
    }
    fetchCompanySettings()
  }, [])

  // Show loading while checking authentication
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner - Always show with fallback */}
      <div 
        className="w-full h-36 relative"
        style={bannerStyle}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute bottom-4 left-6 text-white">
          <h1 className="text-2xl font-bold mb-1">Welcome back, {user.name}!</h1>
          <p className="text-lg opacity-90">Analyst Portal • {companySettings?.companyName || 'ClearCompany'}</p>
        </div>
        
        {/* Logout Button */}
        <div className="absolute top-4 right-6">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200 backdrop-blur-sm border border-white border-opacity-30"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Briefing Summary */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <BriefingSummary />
        </div>

        {/* Main Content */}
        {children}
      </div>
    </div>
  )
}
