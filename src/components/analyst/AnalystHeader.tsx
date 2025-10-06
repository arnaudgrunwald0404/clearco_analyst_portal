'use client'

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from '@/contexts/AuthContext';
import { getRandomBannerImagePath } from '@/lib/banner-utils';

interface AnalystHeaderProps {
  title?: string;
  subtitle?: string;
}

export default function AnalystHeader({ 
  title, 
  subtitle 
}: AnalystHeaderProps) {
  const { settings } = useSettings();
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [bannerImage, setBannerImage] = useState<string>('');
  const [bannerError, setBannerError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Initialize banner image
  useEffect(() => {
    // Get or set a banner image for this session (persist per session)
    let sessionBanner = sessionStorage.getItem('analystHubBannerImage');
    if (!sessionBanner) {
      sessionBanner = getRandomBannerImagePath();
      sessionStorage.setItem('analystHubBannerImage', sessionBanner);
      console.log('Generated new analyst hub banner image:', sessionBanner);
    } else {
      console.log('Using existing analyst hub banner image:', sessionBanner);
    }
    setBannerImage(sessionBanner);
  }, []);

  // Test if banner image loads successfully
  useEffect(() => {
    if (bannerImage) {
      const img = new Image();
      img.onload = () => {
        setBannerError(false);
        console.log('Analyst hub banner image loaded successfully:', bannerImage);
      };
      img.onerror = () => {
        setBannerError(true);
        console.error('Analyst hub banner image failed to load:', bannerImage);
      };
      img.src = bannerImage;
    }
  }, [bannerImage]);

  // Create banner style with image or gradient fallback
  const bannerStyle = bannerImage && !bannerError
    ? { 
        backgroundImage: `url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }
    : { 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      };

  // Close user menu on outside click or Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const getUserInitials = () => {
    if (user?.name) {
      const parts = user.name.split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0][0].toUpperCase();
    }
    if (user?.email) return user.email.split('@')[0].slice(0, 2).toUpperCase();
    return 'A';
  };

  const getDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'Analyst';
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
  };



  return (
    <header
      className="sticky top-0 z-50 w-full h-36 relative"
      style={bannerStyle}
      role="banner"
      aria-label="Analyst Hub header"
    >
      {/* Background overlays for text readability */}
      <div className="absolute inset-0 bg-black/5"></div>
      <div className="absolute inset-0 bg-white/20"></div>
      
      {/* Header content */}
      <div className="relative h-full flex">
        {/* Left section: Logo area matching sidebar width */}
        <div className="w-64 flex items-center justify-center bg-white border-r border-pink-200">
          <img 
            src="/cupcake_logo.png" 
            alt="Cupcake Logo" 
            className="h-32 md:h-32 lg:h-36 w-auto object-contain"
          />
        </div>

        {/* Right section: Title, Vendor Portal button, and user menu */}
        <div className="flex-1 flex items-center justify-between px-6">
          

          {/* Title centered */}
          <div className="text-gray-900 text-center flex-1 px-4">
            <h1 className="text-2xl md:text-3xl lg:text-3xl font-extrabold mb-2 md:mb-4 text-gray-800 tracking-tight">
              {title || `${settings?.industryName || 'Technology'} Industry Analyst Hub`}
            </h1>
            {subtitle && (
              <p className="text-lg md:text-xl font-medium text-gray-800 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Identity pill + Logout on the right */}
          <div className="flex items-center gap-3" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-3 px-3 py-2 bg-white/80 backdrop-blur rounded-full shadow hover:bg-white transition-colors"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <div className="w-8 h-8 rounded-full bg-pink-600 text-white flex items-center justify-center text-sm font-semibold">
                {getUserInitials()}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-sm font-medium text-gray-900 leading-none">{getDisplayName()}</div>
                <div className="text-xs text-gray-600 mt-0.5">Analyst</div>
              </div>
            </button>
            
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="text-sm font-medium text-gray-900">{getDisplayName()}</div>
                  {user?.email && <div className="text-xs text-gray-500">{user.email}</div>}
                </div>
                <div className="py-1">
    
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
