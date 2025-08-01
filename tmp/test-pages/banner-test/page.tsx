'use client'

import { useState } from 'react'
import { getRandomBannerImagePath } from '@/lib/banner-utils'

export default function BannerTestPage() {
  const [bannerPath] = useState(getRandomBannerImagePath())

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900">Banner Test</h1>
      
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Banner Path:</h2>
          <p className="font-mono text-sm bg-gray-100 p-2 rounded">{bannerPath}</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Background Image Test:</h2>
          <div 
            className="w-full h-36 bg-cover bg-center bg-no-repeat border rounded-lg"
            style={{ backgroundImage: `url(${bannerPath})` }}
          />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Direct Image Test:</h2>
          <img 
            src={bannerPath} 
            alt="Test banner"
            className="w-full h-36 object-cover border rounded-lg"
            onError={(e) => {
              console.error('Image failed to load:', bannerPath)
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.classList.remove('hidden')
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', bannerPath)
            }}
          />
          <div className="hidden w-full h-36 bg-red-100 border border-red-300 rounded-lg flex items-center justify-center">
            <p className="text-red-600">Image failed to load: {bannerPath}</p>
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Gradient Fallback:</h2>
          <div 
            className="w-full h-36 border rounded-lg"
            style={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            }}
          />
        </div>
      </div>
    </div>
  )
} 