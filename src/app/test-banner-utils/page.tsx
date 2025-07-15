'use client'

import { useEffect, useState } from 'react'
import { getRandomBannerImagePath, getAllBannerImagePaths } from '@/lib/banner-utils'

export default function TestBannerUtilsPage() {
  const [randomBanner, setRandomBanner] = useState<string>('')
  const [allBanners, setAllBanners] = useState<string[]>([])
  const [error, setError] = useState<string>('')

  useEffect(() => {
    try {
      console.log('Testing banner utilities...')
      
      // Test random banner
      const random = getRandomBannerImagePath()
      console.log('Random banner path:', random)
      setRandomBanner(random)
      
      // Test all banners
      const all = getAllBannerImagePaths()
      console.log('All banner paths:', all)
      setAllBanners(all)
      
    } catch (err) {
      console.error('Error testing banner utilities:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900">Banner Utils Test</h1>
        
        {error && (
          <div className="mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Random Banner Path</h2>
            <div className="bg-white p-4 rounded-lg border">
              <p className="font-mono text-sm">{randomBanner || 'Loading...'}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">All Banner Paths ({allBanners.length})</h2>
            <div className="bg-white p-4 rounded-lg border">
              {allBanners.length === 0 ? (
                <p className="text-gray-500">No banners found</p>
              ) : (
                <ul className="space-y-2">
                  {allBanners.map((banner, index) => (
                    <li key={index} className="font-mono text-sm">
                      {banner}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Direct Image Test</h2>
            <div className="bg-white p-4 rounded-lg border">
              <img 
                src="/banner-art/1dx_cO8C-Uo96jkN9s37Z.png"
                alt="Test"
                className="max-w-full h-32 object-cover"
              />
              <p className="text-sm text-gray-600 mt-2">Direct path: /banner-art/1dx_cO8C-Uo96jkN9s37Z.png</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 