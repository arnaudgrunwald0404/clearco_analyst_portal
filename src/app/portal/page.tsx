'use client'

import { useEffect, useState } from 'react'
import { getRandomBannerImagePath, getAllBannerImagePaths } from '@/lib/banner-utils'

export default function PortalPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    // Debug banner functionality
    const randomBanner = getRandomBannerImagePath()
    const allBanners = getAllBannerImagePaths()
    
    setDebugInfo({
      randomBanner,
      allBanners: allBanners.slice(0, 3), // Show first 3
      sessionBanner: sessionStorage.getItem('portalBannerImage'),
      timestamp: new Date().toISOString()
    })
  }, [])

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analyst Portal Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your analyst portal dashboard
        </p>
      </div>
      
      {/* Debug Information */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <pre className="text-sm text-gray-700 whitespace-pre-wrap">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900">Your Publications</h3>
            <p className="text-blue-700">Manage your published content</p>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-900">Briefings</h3>
            <p className="text-green-700">View upcoming briefings</p>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-purple-900">Testimonials</h3>
            <p className="text-purple-700">Read peer testimonials</p>
          </div>
        </div>
    </div>
  )
}
