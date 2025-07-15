'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getRandomBannerImagePath } from '@/lib/banner-utils'

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
  const [impersonatedAnalyst, setImpersonatedAnalyst] = useState<any>(null)
  const router = useRouter()

  // Load impersonated analyst from sessionStorage and set persistent banner per session
  useEffect(() => {
    const stored = sessionStorage.getItem('impersonatedAnalyst')
    if (stored) {
      try {
        setImpersonatedAnalyst(JSON.parse(stored))
      } catch (error) {
        console.error('Error parsing impersonated analyst:', error)
      }
    }
    
    // Get or set a banner image for this session (persist per session)
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

  // Use impersonated analyst data or fallback to default
  const analystUser = impersonatedAnalyst || {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@clearcompany.com',
    company: companySettings?.companyName || 'ClearCompany',
    title: 'Vice President Analyst'
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
          <h1 className="text-2xl font-bold mb-1">Welcome back, {analystUser.firstName}!</h1>
          <p className="text-lg opacity-90">{analystUser.title} at {analystUser.company}</p>
        </div>
        

      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}
