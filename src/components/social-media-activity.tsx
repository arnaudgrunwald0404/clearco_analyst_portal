'use client'

import { useState, useEffect } from 'react'
import {
  Twitter,
  Linkedin,
  MessageSquare,
  TrendingUp,
  Clock,
  ExternalLink,
  Tag,
  Sparkles,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface SocialPost {
  id: string
  analystId: string
  platform: 'TWITTER' | 'LINKEDIN'
  content: string
  url: string
  postedAt: string
  engagements: number
  relevanceScore: number
  themes: string[]
  sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL'
  mentionsCompany: boolean
  analyst: {
    firstName: string
    lastName: string
    company: string
    title: string
  }
}

function getPlatformIcon(platform: string) {
  switch (platform) {
    case 'TWITTER':
      return <Twitter className="w-4 h-4 text-blue-400" />
    case 'LINKEDIN':
      return <Linkedin className="w-4 h-4 text-blue-600" />
    default:
      return <MessageSquare className="w-4 h-4 text-gray-400" />
  }
}

function getSentimentColor(sentiment: string) {
  switch (sentiment) {
    case 'POSITIVE':
      return 'bg-green-100 text-green-800'
    case 'NEGATIVE':
      return 'bg-red-100 text-red-800'
    case 'NEUTRAL':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else if (diffDays < 7) {
    return `${diffDays}d ago`
  } else {
    return date.toLocaleDateString()
  }
}

function truncateContent(content: string, maxLength: number = 120) {
  if (content.length <= maxLength) return content
  return content.substring(0, maxLength) + '...'
}

export default function SocialMediaActivity() {
  const [posts, setPosts] = useState<SocialPost[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPosts: 0,
    postsToday: 0,
    avgRelevanceScore: 0,
    topThemes: [] as { theme: string; count: number }[]
  })

  useEffect(() => {
    fetchRecentActivity()
  }, [])

  const fetchRecentActivity = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/social-media/recent-activity?limit=10')
      const data = await response.json()
      
      if (data.success) {
        setPosts(data.posts || [])
        setStats(data.stats || {
          totalPosts: 0,
          postsToday: 0,
          avgRelevanceScore: 0,
          topThemes: []
        })
      } else {
        console.error('API error:', data.error)
        // Show empty state
        setPosts([])
        setStats({
          totalPosts: 0,
          postsToday: 0,
          avgRelevanceScore: 0,
          topThemes: []
        })
      }
    } catch (error) {
      console.error('Error fetching social media activity:', error)
      // Show empty state on error
      setPosts([])
      setStats({
        totalPosts: 0,
        postsToday: 0,
        avgRelevanceScore: 0,
        topThemes: []
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Social Media Activity</h3>
          <Sparkles className="w-5 h-5 text-blue-500" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Recent Social Media Activity</h3>
          <Sparkles className="w-5 h-5 text-blue-500" />
        </div>
        <Link 
          href="/social-analytics" 
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.postsToday}</div>
          <div className="text-xs text-gray-600">Today</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.totalPosts}</div>
          <div className="text-xs text-gray-600">This Week</div>
        </div>
      </div>

      {/* Recent Posts */}
      <div className="space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No recent social media activity</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="border border-gray-100 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              {/* Post Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(post.platform)}
                  <div>
                    <div className="flex items-center space-x-2">
                      <Link 
                        href={`/analysts/${post.analystId}`}
                        className="text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {post.analyst.firstName} {post.analyst.lastName}
                      </Link>
                      {post.mentionsCompany && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Mentions Us
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      {post.analyst.title} at {post.analyst.company}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatTimeAgo(post.postedAt)}</span>
                </div>
              </div>

              {/* Post Content */}
              <p className="text-sm text-gray-800 mb-3 leading-relaxed">
                {truncateContent(post.content)}
              </p>

              {/* Tags and Metrics */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Themes */}
                  <div className="flex items-center space-x-1">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <div className="flex space-x-1">
                      {post.themes.slice(0, 2).map((theme, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {theme}
                        </span>
                      ))}
                      {post.themes.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{post.themes.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sentiment */}
                  <span className={cn(
                    'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    getSentimentColor(post.sentiment)
                  )}>
                    {post.sentiment.toLowerCase()}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  {/* Relevance Score */}
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{post.relevanceScore}% relevant</span>
                  </div>

                  {/* Engagements */}
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{post.engagements}</span>
                  </div>

                  {/* Link to post */}
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Trending Themes Footer */}
      {stats.topThemes.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Trending themes:</span>
            <div className="flex space-x-2">
              {stats.topThemes.slice(0, 3).map((theme, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800"
                >
                  {theme.theme} ({theme.count})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
