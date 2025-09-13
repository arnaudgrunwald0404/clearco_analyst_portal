'use client'

import { useState, useEffect } from 'react'
import { X, Heart, MessageCircle, Repeat2, ExternalLink, TrendingUp, Users, Activity, Clock, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface XPost {
  id: string
  content: string
  url: string
  postedAt: string
  engagements: number
  likes: number
  shares: number
  comments: number
  sentiment: string | null
  themes: string[]
  isRelevant: boolean
  analyst: {
    id: string
    firstName: string
    lastName: string
    company: string
    title: string
    influence: string
    profileImageUrl: string | null
    twitterHandle: string | null
  }
}

interface XActivityData {
  posts: XPost[]
  summary: {
    totalPosts: number
    totalEngagements: number
    uniqueAnalysts: number
    totalAnalystsWithHandles: number
    avgEngagements: number
    timeRange: {
      from: string
      to: string
      days: number
    }
  }
}

export default function XActivityPage() {
  const [data, setData] = useState<XActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedDays, setSelectedDays] = useState(7) // Changed default to 7 days

  const fetchXActivity = async (days: number = 7) => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔥 Fetching X activity for last', days, 'days...')
      
      const response = await fetch(`/api/social-media/twitter-activity?days=${days}&limit=100`)
      const result = await response.json()
      
      console.log('🔥 API Response:', { status: response.status, success: result.success, dataLength: result.data?.posts?.length })
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || `API returned ${response.status}: Failed to fetch X activity`)
      }
      
      setData(result.data)
    } catch (err) {
      console.error('❌ Error fetching X activity:', err)
      setError(err instanceof Error ? err.message : 'Failed to load X activity')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchXActivity(selectedDays)
    setRefreshing(false)
  }

  const handleDaysChange = (days: number) => {
    setSelectedDays(days)
    fetchXActivity(days)
  }

  useEffect(() => {
    fetchXActivity(selectedDays)
  }, [])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays === 1) return '1 day ago'
    if (diffInDays < 7) return `${diffInDays} days ago`
    
    return date.toLocaleDateString()
  }

  const getInfluenceColor = (influence: string) => {
    switch (influence?.toUpperCase()) {
      case 'VERY_HIGH': return 'bg-red-100 text-red-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'LOW': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">X Activity</h1>
            <p className="mt-2 text-gray-600">Recent X posts from high and very high influence analysts</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading X activity...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">X Activity</h1>
            <p className="mt-2 text-gray-600">Recent X posts from high and very high influence analysts</p>
          </div>
        </div>
        
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <X className="w-12 h-12 mx-auto opacity-50" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading X Activity</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchXActivity(selectedDays)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <X className="w-8 h-8 text-black" />
            X Activity
          </h1>
          <p className="mt-2 text-gray-600">
            Recent X posts from high and very high influence analysts
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Last:</span>
            {[1, 3, 7].map((days) => (
              <button
                key={days}
                onClick={() => handleDaysChange(days)}
                className={cn(
                  "px-3 py-1 text-sm rounded-lg transition-colors",
                  selectedDays === days
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {days}d
              </button>
            ))}
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards - Removed Total Engagements and Avg Engagements */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Posts (7 days) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Posts ({selectedDays} days)
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data.summary.totalPosts}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Active Analysts (7 days) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Analysts ({selectedDays} days)
                  </dt>
                  <dd className="text-2xl font-semibold text-gray-900">
                    {data.summary.uniqueAnalysts}/{data.summary.totalAnalystsWithHandles}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          {/* Time Range */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Time Range
                  </dt>
                  <dd className="text-sm font-semibold text-gray-900">
                    {data.summary.timeRange.days} days
                  </dd>
                  <dd className="text-xs text-gray-600">
                    {new Date(data.summary.timeRange.from).toLocaleDateString()} - {new Date(data.summary.timeRange.to).toLocaleDateString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts List */}
      {data && data.posts.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Posts</h2>
          {data.posts.map((post) => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {post.analyst.profileImageUrl ? (
                    <img
                      src={post.analyst.profileImageUrl}
                      alt={`${post.analyst.firstName} ${post.analyst.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {post.analyst.firstName} {post.analyst.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">{post.analyst.title} at {post.analyst.company}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={cn("px-2 py-1 text-xs font-medium rounded-full", getInfluenceColor(post.analyst.influence))}>
                        {post.analyst.influence?.replace('_', ' ').toLowerCase()}
                      </span>
                      <span className="text-xs text-gray-500">{formatTimeAgo(post.postedAt)}</span>
                    </div>
                  </div>
                </div>
                
                <a
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Post Content */}
              <div className="mb-4">
                <p className="text-gray-800 leading-relaxed">{post.content}</p>
              </div>

              {/* Themes */}
              {post.themes && post.themes.length > 0 && (
                <div className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {post.themes.slice(0, 3).map((theme, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {theme}
                      </span>
                    ))}
                    {post.themes.length > 3 && (
                      <span className="text-xs text-gray-500">+{post.themes.length - 3} more</span>
                    )}
                  </div>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Heart className="w-4 h-4" />
                  <span>{post.likes}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Repeat2 className="w-4 h-4" />
                  <span>{post.shares}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{post.comments}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="w-4 h-4" />
                  <span>{post.engagements} total</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <X className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No X Activity Found</h3>
          <p className="text-gray-600 mb-4">
            No X posts found from high and very high influence analysts in the last {selectedDays} days.
          </p>
          <button
            onClick={() => handleDaysChange(7)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Last 7 Days
          </button>
        </div>
      )}
    </div>
  )
}
