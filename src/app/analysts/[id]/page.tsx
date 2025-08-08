'use client'

import { useState, useEffect } from 'react'
import { Disclosure } from '@headlessui/react'
import { 
  User, 
  Mail, 
  Phone, 
  Linkedin, 
  Twitter, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  MessageSquare,
  FileText,
  Video,
  Clock,
  Star,
  ExternalLink,
  Plus,
  Edit,
  Heart,
  Activity,
  Users,
  Award,
  Briefcase,
  Search,
  RefreshCw,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SocialHandle {
  id: string
  platform: 'LINKEDIN' | 'TWITTER' | 'MEDIUM' | 'BLOG' | 'OTHER'
  handle: string
  displayName?: string
  isActive: boolean
}

interface Analyst {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  title?: string
  phone?: string
  linkedIn?: string
  twitter?: string
  website?: string
  bio?: string
  profileImageUrl?: string
  influenceScore: number
  lastContactDate?: string
  nextContactDate?: string
  communicationCadence?: number
  relationshipHealth: string
  recentSocialSummary?: string
  socialSummaryUpdatedAt?: string
  keyThemes?: string
  upcomingPublications?: string
  recentPublications?: string
  speakingEngagements?: string
  awards?: string
  status: string
  influence: string
  socialHandles: SocialHandle[]
  coveredTopics: { topic: string }[]
}

const mockBriefings = [
  {
    id: '1',
    title: 'Q4 Product Roadmap Discussion',
    scheduledAt: '2024-11-15T14:00:00Z',
    status: 'SCHEDULED',
    agenda: ['Product Updates', 'Market Feedback', 'Future Features']
  },
  {
    id: '2',
    title: 'Market Analysis Session',
    scheduledAt: '2024-10-10T15:00:00Z',
    completedAt: '2024-10-10T16:00:00Z',
    status: 'COMPLETED',
    outcomes: ['Positive feedback on new features', 'Suggestions for improvement']
  }
]

const mockAlerts = [
  {
    id: '1',
    type: 'COMMUNICATION_OVERDUE',
    title: 'Communication Overdue',
    message: 'No contact in the last 45 days',
    priority: 'MEDIUM',
    isRead: false,
    createdAt: '2024-10-20T00:00:00Z'
  },
  {
    id: '2',
    type: 'BRIEFING_DUE',
    title: 'Quarterly Briefing Due',
    message: 'Schedule Q4 briefing session',
    priority: 'HIGH',
    isRead: false,
    createdAt: '2024-10-18T00:00:00Z'
  }
]

function getHealthColor(health: string) {
  switch (health) {
    case 'EXCELLENT':
      return 'text-green-600 bg-green-100'
    case 'GOOD':
      return 'text-blue-600 bg-blue-100'
    case 'FAIR':
      return 'text-yellow-600 bg-yellow-100'
    case 'POOR':
      return 'text-orange-600 bg-orange-100'
    case 'CRITICAL':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

function getInfluenceColor(score: number) {
  if (score >= 80) return 'text-purple-600 bg-purple-100'
  if (score >= 60) return 'text-blue-600 bg-blue-100'
  if (score >= 40) return 'text-green-600 bg-green-100'
  if (score >= 20) return 'text-yellow-600 bg-yellow-100'
  return 'text-red-600 bg-red-100'
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export default function AnalystDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [analyst, setAnalyst] = useState<Analyst | null>(null)
  const [loading, setLoading] = useState(true)
  const [socialSearchLoading, setSocialSearchLoading] = useState({
    linkedin: false,
    twitter: false
  })

  useEffect(() => {
    const fetchAnalyst = async () => {
      try {
        const response = await fetch(`/api/analysts/${params.id}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setAnalyst(data.analyst)
          }
        }
      } catch (error) {
        console.error('Error fetching analyst:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyst()
  }, [params.id])

  const searchSocialProfile = async (platform: 'linkedin' | 'twitter') => {
    if (!analyst) return
    
    setSocialSearchLoading(prev => ({ ...prev, [platform]: true }))
    
    try {
      const response = await fetch('/api/analysts/search-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystId: params.id,
          analystName: `${analyst.firstName} ${analyst.lastName}`,
          company: analyst.company,
          platform
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.result) {
          const searchResult = result.result
          
          if (searchResult.confidence > 0) {
            const confirmMessage = `Found ${platform} profile with ${searchResult.confidence}% confidence:\n\n` +
              `${platform === 'linkedin' ? 'URL' : 'Handle'}: ${searchResult.url || searchResult.handle}\n` +
              `Reason: ${searchResult.reason}\n\n` +
              `Would you like to save this to the analyst profile?`
              
            if (confirm(confirmMessage)) {
              // The API already updates the database if confidence > 70%
              // For lower confidence, we could show in UI or ask user to confirm
              if (searchResult.confidence > 70) {
                // Refresh the component to show the new social profile
                window.location.reload()
              } else {
                alert('Profile found but with low confidence. You may want to verify manually.')
              }
            }
          } else {
            alert(`No reliable ${platform} profile found. ${searchResult.reason}`)
          }
        } else {
          alert('Search failed: ' + (result.error || 'Unknown error'))
        }
      } else {
        alert('Search request failed')
      }
    } catch (error) {
      console.error(`Error searching ${platform} profile:`, error)
      alert(`Error searching ${platform} profile. Please try again.`)
    } finally {
      setSocialSearchLoading(prev => ({ ...prev, [platform]: false }))
    }
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'intelligence', name: 'Intelligence', icon: TrendingUp },
    { id: 'communications', name: 'Communications', icon: MessageSquare },
    { id: 'briefings', name: 'Briefings', icon: Calendar },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'alerts', name: 'Alerts', icon: AlertTriangle }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading analyst profile...</p>
        </div>
      </div>
    )
  }

  if (!analyst) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Analyst not found</p>
        </div>
      </div>
    )
  }

  // Helper function to render social profile icons
  const renderSocialIcons = () => {
    const socialIcons = []

    // Add LinkedIn icons from socialHandles
    const linkedinHandles = analyst.socialHandles?.filter(handle => handle.platform === 'LINKEDIN') || []
    linkedinHandles.forEach((handle, index) => {
      const url = handle.handle.startsWith('http') ? handle.handle : `https://linkedin.com/in/${handle.handle}`
      socialIcons.push(
        <a 
          key={`linkedin-${index}`}
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title={`LinkedIn Profile${handle.displayName ? ` - ${handle.displayName}` : ''}`}
        >
          <Linkedin className="w-5 h-5" />
        </a>
      )
    })

    // Fallback to legacy linkedIn field if no social handles
    if (linkedinHandles.length === 0 && analyst.linkedIn) {
      socialIcons.push(
        <a 
          key="linkedin-legacy"
          href={analyst.linkedIn} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 transition-colors"
          title="LinkedIn Profile"
        >
          <Linkedin className="w-5 h-5" />
        </a>
      )
    }

    // Add Twitter/X icons from socialHandles
    const twitterHandles = analyst.socialHandles?.filter(handle => handle.platform === 'TWITTER') || []
    twitterHandles.forEach((handle, index) => {
      const url = handle.handle.startsWith('http') 
        ? handle.handle 
        : `https://twitter.com/${handle.handle.replace('@', '')}`
      socialIcons.push(
        <a 
          key={`twitter-${index}`}
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-800 hover:text-gray-600 transition-colors"
          title={`X (Twitter) Profile${handle.displayName ? ` - ${handle.displayName}` : ''}`}
        >
          <Twitter className="w-5 h-5" />
        </a>
      )
    })

    // Fallback to legacy twitter field if no social handles
    if (twitterHandles.length === 0 && analyst.twitter) {
      socialIcons.push(
        <a 
          key="twitter-legacy"
          href={`https://twitter.com/${analyst.twitter.replace('@', '')}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-800 hover:text-gray-600 transition-colors"
          title="X (Twitter) Profile"
        >
          <Twitter className="w-5 h-5" />
        </a>
      )
    }

    return socialIcons
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {analyst.profileImageUrl ? (
                  <img 
                    className="h-20 w-20 rounded-full" 
                    src={analyst.profileImageUrl} 
                    alt={`${analyst.firstName} ${analyst.lastName}`} 
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-2xl font-medium text-white">
                      {analyst.firstName.charAt(0)}{analyst.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {analyst.firstName} {analyst.lastName}
                </h1>
                <p className="text-lg text-gray-600">{analyst.title}</p>
                <p className="text-md text-gray-500">{analyst.company}</p>
                
                {/* Social Profile Icons */}
                <div className="mt-3 flex items-center space-x-3">
                  {renderSocialIcons()}
                </div>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getHealthColor(analyst.relationshipHealth)
                  )}>
                    <Heart className="w-3 h-3 mr-1" />
                    {analyst.relationshipHealth}
                  </span>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getInfluenceColor(analyst.influenceScore)
                  )}>
                    <Star className="w-3 h-3 mr-1" />
                    Influence: {analyst.influenceScore}/100
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact
              </button>
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Briefing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Info Bar */}
      <div className="bg-gray-100 border-b">
        <div className="px-8 py-4">
          <div className="flex items-center space-x-8">
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <a href={`mailto:${analyst.email}`} className="hover:text-blue-600">
                {analyst.email}
              </a>
            </div>
            {analyst.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <a href={`tel:${analyst.phone}`} className="hover:text-blue-600">
                  {analyst.phone}
                </a>
              </div>
            )}
            {analyst.linkedIn && (
              <div className="flex items-center text-sm text-gray-600">
                <Linkedin className="w-4 h-4 mr-2" />
                <a href={analyst.linkedIn} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  LinkedIn
                </a>
              </div>
            )}
            {analyst.twitter && (
              <div className="flex items-center text-sm text-gray-600">
                <Twitter className="w-4 h-4 mr-2" />
                <a href={`https://twitter.com/${analyst.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  {analyst.twitter}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center py-4 px-1 border-b-2 font-medium text-sm',
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <tab.icon className="w-4 h-4 mr-2" />
                  {tab.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-8 py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Bio */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Biography</h3>
                <p className="text-gray-700">{analyst.bio || 'No biography available.'}</p>
              </div>

              {/* Covered Topics */}
              <div className="bg-white rounded-lg shadow">
                <Disclosure defaultOpen>
                  {({ open }) => (
                    <>
                      <Disclosure.Button className="flex justify-between w-full px-6 py-4 text-sm font-medium text-left text-gray-900 bg-gray-50 rounded-t-lg hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                        <h3 className="text-lg font-medium">
                          Covered Topics ({analyst.coveredTopics?.length || 0})
                        </h3>
                        <ChevronUp
                          className={`${
                            open ? 'transform rotate-180' : ''
                          } w-5 h-5 text-gray-500`}
                        />
                      </Disclosure.Button>
                      <Disclosure.Panel className="px-6 pt-4 pb-6 text-sm text-gray-500">
                        <div className="flex flex-wrap gap-2">
                          {analyst.coveredTopics?.length > 0 ? (
                            analyst.coveredTopics.map((topic, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                              >
                                {topic.topic}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">No topics assigned.</span>
                          )}
                        </div>
                      </Disclosure.Panel>
                    </>
                  )}
                </Disclosure>
              </div>

              {/* Communication Timeline */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Contact:</span>
                    <span className="text-gray-900">{analyst.lastContactDate ? formatDate(analyst.lastContactDate) : 'Never'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Next Scheduled:</span>
                    <span className="text-gray-900">{analyst.nextContactDate ? formatDate(analyst.nextContactDate) : 'Not scheduled'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Cadence:</span>
                    <span className="text-gray-900">{analyst.communicationCadence ? `Every ${analyst.communicationCadence} days` : 'Not set'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Quick Stats */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Activity className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Publications</span>
                    </div>
                    <span className="text-sm font-medium">24</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Interactions</span>
                    </div>
                    <span className="text-sm font-medium">156</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Briefings</span>
                    </div>
                    <span className="text-sm font-medium">8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-500">Awards</span>
                    </div>
                    <span className="text-sm font-medium">3</span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  <div className="text-sm">
                    <p className="text-gray-900">Published article on Employee Experience</p>
                    <p className="text-gray-500">3 days ago</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900">Attended HR Tech Conference</p>
                    <p className="text-gray-500">1 week ago</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-gray-900">Quarterly briefing completed</p>
                    <p className="text-gray-500">2 weeks ago</p>
                  </div>
                </div>
              </div>

              {/* Active Alerts */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Active Alerts</h3>
                <div className="space-y-3">
                  {mockAlerts.filter(alert => !alert.isRead).map((alert) => (
                    <div key={alert.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                      <div className="flex items-center">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                        <span className="text-sm font-medium text-yellow-800">{alert.title}</span>
                      </div>
                      <p className="text-sm text-yellow-700 mt-1">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'intelligence' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Social Intelligence */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Social Intelligence</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Summary</h4>
                  <p className="text-sm text-gray-700">{analyst.recentSocialSummary || 'No recent social activity summary available.'}</p>
                  {analyst.socialSummaryUpdatedAt && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last updated: {formatDate(analyst.socialSummaryUpdatedAt)}
                    </p>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {analyst.keyThemes ? 
                      analyst.keyThemes.split(',').map((theme, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {theme.trim()}
                        </span>
                      )) : 
                      <span className="text-sm text-gray-500">No key themes identified.</span>
                    }
                  </div>
                </div>
              </div>
            </div>

            {/* Publications Pipeline */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Publication Pipeline</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Upcoming</h4>
                  <div className="space-y-2">
                    {analyst.upcomingPublications ? (
                      <p className="text-sm text-gray-700">{analyst.upcomingPublications}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No upcoming publications scheduled.</p>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Publications</h4>
                  <div className="space-y-2">
                    {analyst.recentPublications ? (
                      <p className="text-sm text-gray-700">{analyst.recentPublications}</p>
                    ) : (
                      <p className="text-sm text-gray-500">No recent publications available.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Speaking Engagements */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Speaking Engagements</h3>
              <div className="space-y-3">
                {mockAnalyst.speakingEngagements.map((engagement, index) => (
                  <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm font-medium text-green-900">{engagement.event}</p>
                    <p className="text-sm text-green-700">{engagement.topic}</p>
                    <p className="text-xs text-green-600">{formatDate(engagement.date)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'briefings' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Briefing Schedule</h3>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Schedule New Briefing
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockBriefings.map((briefing) => (
                <div key={briefing.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-medium text-gray-900">{briefing.title}</h4>
                      <p className="text-sm text-gray-500">{formatDate(briefing.scheduledAt)}</p>
                    </div>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      briefing.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                      briefing.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    )}>
                      {briefing.status}
                    </span>
                  </div>
                  
                  {briefing.agenda && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Agenda</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {briefing.agenda.map((item, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mr-2"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {briefing.outcomes && (
                    <div className="mb-4">
                      <h5 className="text-sm font-medium text-gray-900 mb-2">Outcomes</h5>
                      <ul className="text-sm text-gray-700 space-y-1">
                        {briefing.outcomes.map((outcome, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-2"></span>
                            {outcome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <button className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                      <Edit className="w-3 h-3 mr-1" />
                      Edit
                    </button>
                    {briefing.status === 'COMPLETED' && (
                      <button className="flex items-center px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        <Video className="w-3 h-3 mr-1" />
                        Recording
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other tab contents would be implemented similarly */}
      </div>
    </div>
  )
}
