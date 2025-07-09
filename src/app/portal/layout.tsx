'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getRandomBannerImagePath } from '@/lib/banner-utils'
import { useAuth } from '@/contexts/AuthContext'
import {
  FileText,
  MessageSquare,
  Newspaper,
  User,
  LogOut,
  Bell,
  Home,
  Calendar,
  ExternalLink,
  Settings,
  UserCheck,
  Loader2
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/portal', icon: Home },
  { name: 'Your Publications', href: '/portal/content', icon: FileText },
  { name: 'Your Briefings (8)', href: '/portal/briefings', icon: Calendar },
  { name: 'Peer Testimonials', href: '/portal/testimonials', icon: MessageSquare },
]

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, loading, signOut } = useAuth()
  const [impersonatedAnalyst, setImpersonatedAnalyst] = useState<any>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [bannerImage, setBannerImage] = useState<string>('')
  const [companySettings, setCompanySettings] = useState<any>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.user-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

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
    }
    setBannerImage(sessionBanner)
  }, [])

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

  // Check authentication
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect if not authenticated
  if (!user || !profile) {
    return null
  }

  // Use impersonated analyst data or fallback to default
  const analystUser = impersonatedAnalyst || {
    firstName: 'Sarah',
    lastName: 'Chen',
    email: 'sarah.chen@clearcompany.com',
    company: companySettings?.companyName || 'ClearCompany',
    title: 'Vice President Analyst'
  }

  // Check if user is a ClearCompany employee (admin viewing portal)
  const isClearCompanyUser = analystUser.email?.endsWith('@clearcompany.com')
  const isImpersonating = !!impersonatedAnalyst

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Impersonation Banner - Moved to top */}
      {isImpersonating && (
        <div className="bg-black text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center py-3">
              <div className="flex-1">
                <p className="text-sm font-medium text-white">
                  <span className="mr-2">🎭</span>
                  You are viewing the analyst portal as <strong>{analystUser.firstName} {analystUser.lastName}</strong>
                  {analystUser.company && (
                    <span className="text-gray-300"> from {analystUser.company}</span>
                  )}
                </p>
                <p className="text-xs text-gray-300 mt-1">
                  This view reflects the permissions, content, and experience that {analystUser.firstName} would see.
                </p>
              </div>
              <button
                onClick={() => {
                  sessionStorage.removeItem('impersonatedAnalyst')
                  window.location.href = '/'
                }}
                className="px-3 py-1 text-xs font-medium text-black bg-white hover:bg-gray-100 rounded-md transition-colors"
              >
                Exit Impersonation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Combined Banner with Header and Navigation Overlay */}
      {bannerImage && (
        <div className="relative w-full h-48 bg-cover bg-center bg-no-repeat" 
             style={{ backgroundImage: `url(${bannerImage})` }}>
          
          {/* Gradient overlay for better readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
          
          {/* Header content overlay */}
          <div className="relative z-10 h-full flex flex-col">
            {/* Centered header content - moved up by half tab height (16px) to center above tabs */}
            <div className="flex-1 flex items-center justify-center" style={{ marginBottom: '16px' }}>
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                <div className="flex justify-between items-center">
                  {/* Title */}
                  <div className="flex items-center">
                    <h1 className="text-3xl font-bold text-white" style={{ fontFamily: 'Atkinson Hyperlegible, system-ui, -apple-system, sans-serif' }}>
                      {companySettings?.companyName || 'ClearCompany'} Industry Analyst Portal
                    </h1>
                  </div>

                  {/* User menu */}
                  <div className="flex items-center space-x-4">
                    <button className="p-2 text-white/80 hover:text-white">
                      <Bell className="w-5 h-5" />
                    </button>
                    
                    {/* ClearCompany Admin Link */}
                    {isClearCompanyUser && (
                      <Link
                        href="/"
                        className="flex items-center px-3 py-2 text-sm font-medium text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        title="Back to Admin Dashboard"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Admin</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    )}
                    
                    <div className="relative user-dropdown">
                      <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-3 hover:bg-white/10 rounded-lg p-2 transition-colors border border-white/30 backdrop-blur-sm"
                      >
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-600">
                              {analystUser.firstName.charAt(0)}{analystUser.lastName.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="hidden md:block text-left">
                          <p className="text-sm font-medium text-white">
                            {analystUser.firstName} {analystUser.lastName}
                          </p>
                          <p className="text-xs text-white/80">{analystUser.company}</p>
                        </div>
                      </button>

                      {/* Dropdown Menu */}
                      {isDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                          <div className="py-1">
                            <button
                              onClick={() => {
                            setIsDropdownOpen(false)
                            signOut()
                              }}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                              <LogOut className="w-4 h-4 mr-3" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom section - Navigation tabs aligned with content boundary */}
            <div className="absolute bottom-0 left-0 right-0">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex space-x-1">
                  {navigation.map((item) => {
                    const isActive = pathname === item.href
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={cn(
                          'flex items-center px-3 py-2 text-sm transition-all duration-200 border-t border-l border-r',
                          isActive
                            ? 'bg-white text-gray-800 font-bold shadow-lg border-gray-200 rounded-t-lg opacity-100'
                            : 'bg-white text-gray-600 font-semibold hover:text-gray-800 hover:opacity-100 border-gray-300 rounded-t-lg opacity-80'
                        )}
                      >
                        <item.icon className="w-4 h-4 mr-2" />
                        {item.name}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-7">
        {children}
      </main>
    </div>
  )
}
