'use client'

import React, { useState, useEffect } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { getRandomBannerImagePath } from '@/lib/banner-utils';

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
  const [bannerImage, setBannerImage] = useState<string>('');
  const [bannerError, setBannerError] = useState(false);

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





  return (
    <header
      className="relative w-full h-36 flex items-center justify-center"
      style={bannerStyle}
      role="banner"
      aria-label="Main header"
    >
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
