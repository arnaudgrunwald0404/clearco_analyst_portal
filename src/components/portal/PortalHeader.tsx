'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { getRandomBannerImagePath } from '@/lib/utils/banner-utils'

interface PortalHeaderProps {
  selectedVendorName?: string
}

export function PortalHeader({ selectedVendorName }: PortalHeaderProps) {
  const { user, signOut } = useAuth()
  const { settings } = useSettings()
  const router = useRouter()
  const [bannerImage, setBannerImage] = useState<string>('')
  const [bannerError, setBannerError] = useState(false)
  const [analystName, setAnalystName] = useState<string>('')
  const [analystImage, setAnalystImage] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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

  // Resolve analyst display name + avatar for identity pill
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        if (!user?.email) return
        const resp = await fetch(`/api/analysts/by-email/${encodeURIComponent(user.email)}`)
        
        // Handle 404 gracefully - user might not be an analyst
        if (resp.status === 404) {
          if (!cancelled) {
            setAnalystName(user?.name || user?.email?.split('@')[0] || 'User')
            setAnalystImage(null)
          }
          return
        }
        
        const json = await resp.json().catch(() => null)
        if (!cancelled && json?.success && json?.data) {
          const a = json.data
          const name = [a.firstName, a.lastName].filter(Boolean).join(' ').trim()
          setAnalystName(name || (user.email || 'Analyst'))
          setAnalystImage(a.profileImageUrl || null)
        } else if (!cancelled && user?.email) {
          setAnalystName(user?.name || user?.email?.split('@')[0] || 'User')
        }
      } catch (error) {
        console.warn('Error fetching analyst data for header:', error)
        if (!cancelled && user?.email) {
          setAnalystName(user?.name || user?.email?.split('@')[0] || 'User')
        }
      }
    })()
    return () => { cancelled = true }
  }, [user?.email])

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

  // Close dropdown on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await signOut()
  }

  return (
    <header 
      className="sticky top-0 z-50 w-full h-36 relative"
      style={bannerStyle}
      role="banner"
      aria-label="Portal header"
    >
      {/* Background overlays for text readability (match admin header) */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute inset-0 bg-white/20"></div>
      
      {/* Header content */}
      <div className="relative h-full flex flex-col justify-between pr-6">
        {/* Top row with logo, title, identity and logout */}
        <div className="flex justify-between items-center gap-4 h-full">
          {/* Left: Cupcake logo + Company logo */}
          <div className="flex items-center gap-4">
            <img 
              src="/cupcake_logo.png" 
              alt="Cupcake Logo" 
              className="h-32 md:h-32 lg:h-36 w-auto object-contain"
            />
  
          </div>

          {/* Title centered-ish on large screens */}
          <div className="text-gray-900 text-center flex-1">
          <h1 className="text-2xl md:text-3xl lg:text-3xl font-extrabold mb-2 md:mb-4 text-gray-800 tracking-tight">
          {`${settings?.industryName || 'Technology'} Industry Analyst Portal`}
        </h1>
          </div>

          {/* Identity pill + Logout on the right */}
          <div className="flex items-center gap-3">
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-full bg-white/90 backdrop-blur border border-white/60 shadow-sm hover:bg-white transition-colors"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                  {analystImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={analystImage} alt={analystName || 'Analyst'} className="w-full h-full object-cover" />
                  ) : (
                    <span>{(analystName || '').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() || 'AN'}</span>
                  )}
                </div>
                <div className="leading-tight min-w-0 text-left">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-[14rem]">{analystName || 'Analyst'}</div>
                  <div className="text-[11px] tracking-wide text-gray-500">{(user?.role || 'ANALYST').toString().toUpperCase()}</div>
                </div>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="text-sm font-medium text-gray-900">{analystName || 'Analyst'}</div>
                    {user?.email && (
                      <div className="text-xs text-gray-500">{user.email}</div>
                    )}
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        router.push('/portal/settings')
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      My Settings
                    </button>
                    <button
                      onClick={handleLogout}
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
    </header>
  )
}