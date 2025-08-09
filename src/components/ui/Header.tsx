'use client'

import React, { useState, useEffect, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getRandomBannerImagePath } from '@/lib/banner-utils';
import { useAuth } from '@/contexts/AuthContext'

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showBanner?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title, 
  subtitle, 
  showBanner = true 
}) => {
  const { settings, isInitialized } = useSettings();
  const { user, loading, signOut } = useAuth()
  const [bannerImage, setBannerImage] = useState<string>('');
  const [bannerError, setBannerError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Initialize banner image
  useEffect(() => {
    // Get or set a banner image for this session (persist per session)
    let sessionBanner = sessionStorage.getItem('mainBannerImage')
    if (!sessionBanner) {
      sessionBanner = getRandomBannerImagePath()
      sessionStorage.setItem('mainBannerImage', sessionBanner)
      console.log('Generated new main banner image:', sessionBanner)
    } else {
      console.log('Using existing main banner image:', sessionBanner)
    }
    setBannerImage(sessionBanner)
  }, [])

  // Test if banner image loads successfully
  useEffect(() => {
    if (bannerImage) {
      const img = new Image()
      img.onload = () => {
        setBannerError(false)
        console.log('Main banner image loaded successfully:', bannerImage)
      }
      img.onerror = () => {
        setBannerError(true)
        console.error('Main banner image failed to load:', bannerImage)
      }
      img.src = bannerImage
    }
  }, [bannerImage])

  // Use settings if available, otherwise use fallbacks
  const industryName = settings?.industryName || 'Industry';



  // Create banner style with image or gradient fallback
  const bannerStyle = bannerImage && !bannerError
    ? { 
        backgroundImage: `url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        border: 'none' // Remove debug border
      }
    : { 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none' // Remove debug border
      }

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const getUserInitials = () => {
    if (user?.name) {
      const parts = user.name.split(' ')
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      return parts[0][0].toUpperCase()
    }
    if (user?.email) return user.email.split('@')[0].slice(0, 2).toUpperCase()
    return 'U'
  }

  const getDisplayName = () => {
    if (user?.name) return user.name
    if (user?.email) return user.email.split('@')[0]
    return 'Guest'
  }




  return (
    <header
      className="relative w-full h-36 flex items-center justify-center"
      style={bannerStyle}
      role="banner"
      aria-label="Main header"
    >
      {/* Always-visible user chip (top-right) */}
      <div className="absolute top-3 right-4 z-20" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-3 px-3 py-2 bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-colors"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold">
            {getUserInitials()}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-sm font-medium text-gray-900 leading-none">{getDisplayName()}</div>
            {user?.role && <div className="text-xs text-gray-600 mt-0.5">{user.role}</div>}
          </div>
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="text-sm font-medium text-gray-900">{getDisplayName()}</div>
              {user?.email && <div className="text-xs text-gray-500">{user.email}</div>}
            </div>
            <div className="py-1">
              {user ? (
                <button
                  onClick={async () => { setMenuOpen(false); await signOut() }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign Out
                </button>
              ) : (
                <a href="/auth" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sign In</a>
              )}
            </div>
          </div>
        )}
      </div>
      {/* Overlay for text legibility */}
      <div className="absolute inset-0 bg-black/5"></div>
      
      {/* White center overlay for text readability */}
      <div className="absolute inset-0 bg-white/20"></div>
      
      <div className="relative z-10 text-center px-4 md:px-8 max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl lg:text-3xl font-extrabold mb-2 md:mb-4 text-gray-800 tracking-tight">
          {title || `${industryName} Industry Relationship Management`}
        </h1>
        
        <p className="text-lg md:text-xl lg:text-2xl font-medium text-gray-800 leading-relaxed">
          {subtitle || "Manage relationships • Get noticed • Drive growth"}
        </p>
      </div>
    </header>
  );
}

export default Header;
