'use client'

import { useState, useEffect } from 'react'
import { getRandomBannerImagePath, getAllBannerImagePaths } from '@/lib/banner-utils'

export default function TestBannersPage() {
  const [currentBanner, setCurrentBanner] = useState<string>('')
  const [bannerError, setBannerError] = useState<boolean>(false)
  const [allBanners, setAllBanners] = useState<string[]>([])

  useEffect(() => {
    // Set a random banner
    const banner = getRandomBannerImagePath()
    setCurrentBanner(banner)
    
    // Get all banner paths
    setAllBanners(getAllBannerImagePaths())
  }, [])

  // Test if banner image loads successfully
  useEffect(() => {
    if (currentBanner) {
      const img = new Image()
      img.onload = () => {
        setBannerError(false)
        console.log('Test banner image loaded successfully:', currentBanner)
      }
      img.onerror = () => {
        setBannerError(true)
        console.error('Test banner image failed to load:', currentBanner)
      }
      img.src = currentBanner
    }
  }, [currentBanner])

  const changeBanner = () => {
    const newBanner = getRandomBannerImagePath()
    setCurrentBanner(newBanner)
  }

  const bannerStyle = currentBanner && !bannerError
    ? { 
        backgroundImage: `url(${currentBanner})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : { 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Banner Test Page</h1>
        
        {/* Current Banner Display */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Banner</h2>
          <div 
            className="w-full h-36 relative border-4 border-green-500 rounded-lg overflow-hidden"
            style={bannerStyle}
          >
            <div className="absolute inset-0 bg-black bg-opacity-40"></div>
            <div className="absolute bottom-4 left-6 text-white">
              <h3 className="text-2xl font-bold mb-1">Test Banner</h3>
              <p className="text-lg opacity-90">Testing banner image display</p>
            </div>
            
            {/* Debug info */}
            <div className="absolute top-4 right-4 text-white text-xs bg-black bg-opacity-75 p-2 rounded">
              <div>Path: {currentBanner}</div>
              <div>Error: {bannerError ? 'Yes' : 'No'}</div>
              <div>Style: {currentBanner && !bannerError ? 'Image' : 'Gradient'}</div>
            </div>
          </div>
          
          <button 
            onClick={changeBanner}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Change Banner
          </button>
        </div>

        {/* All Available Banners */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">All Available Banners ({allBanners.length})</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allBanners.map((banner, index) => (
              <div key={index} className="border rounded-lg overflow-hidden">
                <img 
                  src={banner} 
                  alt={`Banner ${index + 1}`}
                  className="w-full h-24 object-cover"
                  onError={(e) => {
                    console.error('Failed to load banner:', banner)
                    e.currentTarget.style.display = 'none'
                  }}
                />
                <div className="p-2 text-xs text-gray-600 truncate">
                  {banner.split('/').pop()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Direct Image Test */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Direct Image Test</h2>
          <div className="border rounded-lg p-4">
            <img 
              src="/banner-art/1dx_cO8C-Uo96jkN9s37Z.png"
              alt="Direct test"
              className="max-w-full h-32 object-cover"
              onLoad={() => console.log('Direct image loaded successfully')}
              onError={() => console.error('Direct image failed to load')}
            />
            <p className="text-sm text-gray-600 mt-2">Direct path: /banner-art/1dx_cO8C-Uo96jkN9s37Z.png</p>
          </div>
        </div>
      </div>
    </div>
  )
} 