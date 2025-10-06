'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, ExternalLink, Calendar, User } from 'lucide-react'
import { SpinningCupcake } from '@/components/ui/spinning-cupcake'

interface NewsItem {
  id: string
  vendor: string
  title: string
  text: string
  url: string
  publishedDate: string
  author: string
  type: string
  timeAgo: string
}

export default function VendorsNewsfeedPage() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [selectedVendor, setSelectedVendor] = useState('ClearCompany')
  const [availableVendors] = useState(['ClearCompany', 'TechCorp', 'DataCorp', 'CloudVendor', 'AI Innovations'])

  const fetchNewsfeed = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/vendors/newsfeed?vendor=${encodeURIComponent(selectedVendor)}&limit=15`)
      if (!response.ok) {
        throw new Error('Failed to fetch newsfeed')
      }
      
      const result = await response.json()
      if (result.success) {
        setNewsItems(result.data || [])
        setLastUpdated(new Date())
      } else {
        throw new Error(result.error || 'Failed to fetch newsfeed')
      }
    } catch (error) {
      console.error('Error fetching newsfeed:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch newsfeed')
      setNewsItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNewsfeed()
  }, [selectedVendor])

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'funding': return 'bg-green-100 text-green-800'
      case 'acquisition': return 'bg-purple-100 text-purple-800'
      case 'product update': return 'bg-blue-100 text-blue-800'
      case 'partnership': return 'bg-yellow-100 text-yellow-800'
      case 'award': return 'bg-pink-100 text-pink-800'
      case 'report': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendor Newsfeed</h1>
          <p className="text-gray-600">Latest news and updates from vendors in your network.</p>
          {lastUpdated && (
            <p className="text-xs text-gray-500 mt-1">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Vendor Selection */}
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
          >
            {availableVendors.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>
          
          <button
            onClick={fetchNewsfeed}
            disabled={loading}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <SpinningCupcake size="lg" />
            <span className="text-gray-600">Loading latest news...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Newsfeed Unavailable</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              {error.includes('Perplexity API key') && (
                <p className="text-xs text-red-600 mt-2">
                  The newsfeed service requires a Perplexity API key to be configured by your administrator.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* News Items */}
      {!loading && !error && (
        <div className="space-y-4">
          {newsItems.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No news available</h3>
              <p className="text-gray-500">No recent news found for the selected vendors.</p>
            </div>
          ) : (
            newsItems.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {item.title}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                        {item.type}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {item.text}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {item.author}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {item.timeAgo}
                      </div>
                      <div className="text-xs text-gray-400">
                        {item.vendor}
                      </div>
                    </div>
                  </div>
                  
                  {item.url !== '#' && (
                    <div className="ml-4 flex-shrink-0">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Read More
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
