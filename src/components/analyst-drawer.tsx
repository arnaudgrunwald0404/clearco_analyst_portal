'use client'

import { useState, useEffect } from 'react'
import { X, User, Building, Mail, Phone, Linkedin, Twitter, Globe, Calendar, FileText, MessageSquare, Users, ExternalLink, TrendingUp, Clock, MapPin, Loader, Tag, Sparkles, Reply, Share, Send, Wand2 } from 'lucide-react'
import { cn, getInfluenceColor, getStatusColor } from '@/lib/utils'

interface AnalystDrawerProps {
  isOpen: boolean
  onClose: () => void
  analyst: {
    id: string
    firstName: string
    lastName: string
    email: string
    company?: string
    title?: string
    influence: string
    status: string
    expertise: string[]
    linkedIn?: string
    twitter?: string
    phone?: string
    bio?: string
    profileImageUrl?: string
    // Additional fields for drawer
    influenceScore?: number
    lastContactDate?: string
    nextContactDate?: string
    relationshipHealth?: string
    keyThemes?: string[]
    website?: string
  }
}

// Mock data for publications (last 2 years)
const mockPublications = [
  {
    id: '1',
    title: 'The Future of HR Technology: AI and Automation Trends',
    type: 'RESEARCH_REPORT',
    publishedAt: '2024-03-15',
    url: 'https://example.com/report1',
    summary: 'Comprehensive analysis of AI adoption in HR technology and its impact on workforce management.'
  },
  {
    id: '2',
    title: 'Employee Experience Revolution: Beyond Traditional Engagement',
    type: 'BLOG_POST',
    publishedAt: '2024-01-22',
    url: 'https://example.com/blog1',
    summary: 'Exploring new approaches to employee experience that go beyond traditional engagement metrics.'
  },
  {
    id: '3',
    title: 'Talent Management in the Post-Digital Era',
    type: 'WEBINAR',
    publishedAt: '2023-11-10',
    url: 'https://example.com/webinar1',
    summary: 'Live discussion on evolving talent management strategies in digital-first organizations.'
  },
  {
    id: '4',
    title: 'HR Analytics: Measuring What Matters',
    type: 'WHITEPAPER',
    publishedAt: '2023-08-05',
    url: 'https://example.com/whitepaper1',
    summary: 'Framework for implementing meaningful HR analytics that drive business outcomes.'
  }
]

// Mock data for social media posts (latest 3-5)
const mockSocialPosts = [
  {
    id: '1',
    platform: 'LINKEDIN',
    content: 'Just attended an incredible panel on the future of workplace flexibility. The consensus is clear: hybrid work is here to stay, but companies need to be more intentional about creating connection opportunities.',
    postedAt: '2024-06-25',
    engagements: 127,
    url: 'https://linkedin.com/post1'
  },
  {
    id: '2',
    platform: 'TWITTER',
    content: 'New research shows that companies with strong employee experience programs see 40% higher retention rates. The ROI on EX investment is undeniable. #EmployeeExperience #HRTech',
    postedAt: '2024-06-22',
    engagements: 89,
    url: 'https://twitter.com/post1'
  },
  {
    id: '3',
    platform: 'LINKEDIN',
    content: 'Exciting to see how AI is transforming talent acquisition. From resume screening to candidate matching, the technology is becoming more sophisticated while still maintaining the human touch where it matters most.',
    postedAt: '2024-06-18',
    engagements: 203,
    url: 'https://linkedin.com/post2'
  },
  {
    id: '4',
    platform: 'TWITTER',
    content: 'Speaking at #HRTechConf next month about the evolution of performance management. Looking forward to sharing some surprising insights from our latest research!',
    postedAt: '2024-06-15',
    engagements: 56,
    url: 'https://twitter.com/post2'
  }
]

// Mock data for briefing history
const mockBriefings = [
  {
    id: '1',
    title: 'Q2 Product Roadmap Briefing',
    scheduledAt: '2024-06-10',
    completedAt: '2024-06-10',
    status: 'COMPLETED',
    duration: 45,
    outcomes: ['Positive feedback on AI features', 'Interest in integration capabilities', 'Request for beta access'],
    followUpActions: ['Send beta invitation', 'Schedule demo with larger team']
  },
  {
    id: '2',
    title: 'Company Vision & Strategy Update',
    scheduledAt: '2024-04-15',
    completedAt: '2024-04-15',
    status: 'COMPLETED',
    duration: 30,
    outcomes: ['Aligned on market positioning', 'Discussed competitive landscape', 'Explored partnership opportunities'],
    followUpActions: ['Share competitive analysis', 'Introduce to partnership team']
  },
  {
    id: '3',
    title: 'New Feature Demo - Analytics Dashboard',
    scheduledAt: '2024-02-28',
    completedAt: '2024-02-28',
    status: 'COMPLETED',
    duration: 60,
    outcomes: ['Impressed with visualization capabilities', 'Suggested UI improvements', 'Potential case study collaboration'],
    followUpActions: ['Implement suggested UI changes', 'Draft case study proposal']
  },
  {
    id: '4',
    title: 'Market Trends Discussion',
    scheduledAt: '2024-07-15',
    status: 'SCHEDULED',
    duration: 30,
    outcomes: [],
    followUpActions: []
  }
]

export default function AnalystDrawer({ isOpen, onClose, analyst }: AnalystDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [publications, setPublications] = useState([])
  const [socialPosts, setSocialPosts] = useState([])
  const [briefings, setBriefings] = useState([])
  const [loading, setLoading] = useState({
    publications: false,
    socialPosts: false,
    briefings: false
  })
  const [engagementModal, setEngagementModal] = useState<{
    isOpen: boolean
    type: 'reply' | 'share' | null
    post: any
  }>({ isOpen: false, type: null, post: null })
  const [engagementText, setEngagementText] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)

  // Fetch data when drawer opens or tab changes
  useEffect(() => {
    if (!isOpen || !analyst?.id) return

    const fetchData = async (endpoint: string, setter: Function, loadingKey: string) => {
      setLoading(prev => ({ ...prev, [loadingKey]: true }))
      try {
        const response = await fetch(`/api/analysts/${analyst.id}/${endpoint}`)
        const result = await response.json()
        if (result.success) {
          setter(result.data)
        }
      } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error)
        // Fall back to mock data if API fails
        if (endpoint === 'publications') setter(mockPublications)
        if (endpoint === 'social-posts') setter(mockSocialPosts)
        if (endpoint === 'briefings') setter(mockBriefings)
      } finally {
        setLoading(prev => ({ ...prev, [loadingKey]: false }))
      }
    }

    // Fetch all data when drawer opens
    fetchData('publications', setPublications, 'publications')
    fetchData('social-posts', setSocialPosts, 'socialPosts')
    fetchData('briefings', setBriefings, 'briefings')
  }, [isOpen, analyst?.id])

  // Handle body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const getPublicationIcon = (type: string) => {
    switch (type) {
      case 'RESEARCH_REPORT':
        return <FileText className="w-4 h-4" />
      case 'BLOG_POST':
        return <MessageSquare className="w-4 h-4" />
      case 'WEBINAR':
        return <Users className="w-4 h-4" />
      case 'WHITEPAPER':
        return <FileText className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'LINKEDIN':
        return <Linkedin className="w-4 h-4 text-blue-600" />
      case 'TWITTER':
        return <Twitter className="w-4 h-4 text-blue-400" />
      default:
        return <MessageSquare className="w-4 h-4" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getBriefingStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const generateAIResponse = async () => {
    if (!engagementModal.post || !engagementModal.type) return

    setIsGeneratingAI(true)
    try {
      const response = await fetch('/api/analysts/generate-social-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystId: analyst.id,
          analystName: `${analyst.firstName} ${analyst.lastName}`,
          post: engagementModal.post,
          responseType: engagementModal.type,
          context: {
            company: analyst.company,
            title: analyst.title,
            expertise: analyst.expertise,
            relationshipHistory: [], // Could include past interactions
            recentBriefings: briefings.slice(0, 3) // Recent context
          }
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setEngagementText(result.message)
        } else {
          alert('Failed to generate AI response: ' + result.error)
        }
      } else {
        alert('Failed to generate AI response')
      }
    } catch (error) {
      console.error('Error generating AI response:', error)
      alert('Error generating AI response. Please try again.')
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleEngagementSubmit = async () => {
    if (!engagementText.trim() || !engagementModal.post) return

    try {
      // In a real implementation, this would post to the social media platform
      // For now, we'll just log the action and close the modal
      console.log('Engaging with post:', {
        type: engagementModal.type,
        postId: engagementModal.post.id,
        message: engagementText,
        platform: engagementModal.post.platform
      })

      // TODO: Implement actual social media posting
      // This would integrate with LinkedIn API, Twitter API, etc.
      
      // Close modal and reset
      setEngagementModal({ isOpen: false, type: null, post: null })
      setEngagementText('')
      
      // Show success message
      alert(`${engagementModal.type === 'reply' ? 'Reply' : 'Share'} will be posted to ${engagementModal.post.platform}`)
      
    } catch (error) {
      console.error('Error posting engagement:', error)
      alert('Error posting to social media. Please try again.')
    }
  }

  // Don't render if no analyst is provided
  if (!analyst) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          backgroundColor: isOpen ? 'rgba(0, 0, 0, 0.3)' : 'transparent',
          pointerEvents: isOpen ? 'auto' : 'none'
        }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div className={`fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out overflow-hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                {analyst.profileImageUrl ? (
                  <img
                    src={analyst.profileImageUrl}
                    alt={`${analyst.firstName} ${analyst.lastName}`}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      e.currentTarget.style.display = 'none'
                      if (e.currentTarget.nextSibling) {
                        (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'
                      }
                    }}
                  />
                ) : null}
                <div 
                  className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center"
                  style={{ display: analyst.profileImageUrl ? 'none' : 'flex' }}
                >
                  <span className="text-lg font-medium text-blue-800">
                    {analyst.firstName.charAt(0)}{analyst.lastName.charAt(0)}
                  </span>
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {analyst.firstName} {analyst.lastName}
                </h2>
                <p className="text-sm text-gray-600">
                  {analyst.title} {analyst.company && `at ${analyst.company}`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'publications', label: 'Publications' },
              { id: 'social', label: 'Social Media' },
              { id: 'briefings', label: 'Briefing History' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Status and Influence */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getStatusColor(analyst.status)
                      )}>
                        {analyst.status}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Influence</label>
                    <div className="mt-1">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getInfluenceColor(analyst.influence)
                      )}>
                        {analyst.influence.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${analyst.email}`} className="text-blue-600 hover:underline">
                        {analyst.email}
                      </a>
                    </div>
                    {analyst.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <a href={`tel:${analyst.phone}`} className="text-blue-600 hover:underline">
                          {analyst.phone}
                        </a>
                      </div>
                    )}
                    {analyst.linkedIn && (
                      <div className="flex items-center space-x-3">
                        <Linkedin className="w-4 h-4 text-gray-400" />
                        <a href={analyst.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}
                    {analyst.twitter && (
                      <div className="flex items-center space-x-3">
                        <Twitter className="w-4 h-4 text-gray-400" />
                        <a href={`https://twitter.com/${analyst.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {analyst.twitter}
                        </a>
                      </div>
                    )}
                    {analyst.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="w-4 h-4 text-gray-400" />
                        <a href={analyst.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Website
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Covered Topics</h3>
                  <div className="flex flex-wrap gap-2">
                    {analyst.coveredTopics && analyst.coveredTopics.length > 0 ? (
                      analyst.coveredTopics.map((topic, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                        >
                          {typeof topic === 'string' ? topic : topic.topic}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500 italic">No topics specified</span>
                    )}
                  </div>
                </div>

                {/* Relationship Health */}
                {analyst.relationshipHealth && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Relationship Health</h3>
                    <div className="flex items-center space-x-3">
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700">{analyst.relationshipHealth}</span>
                    </div>
                  </div>
                )}

                {/* Bio */}
                {analyst.bio && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Bio</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{analyst.bio}</p>
                  </div>
                )}

                {/* Key Themes */}
                {analyst.keyThemes && analyst.keyThemes.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Key Themes</h3>
                    <div className="flex flex-wrap gap-2">
                      {analyst.keyThemes.map((theme, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'publications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Publications (Last 2 Years)</h3>
                  {loading.publications ? (
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <span className="text-sm text-gray-500">{publications.length} publications</span>
                  )}
                </div>
                {loading.publications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : publications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No publications found in the last 2 years.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {publications.map((publication) => (
                    <div key={publication.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getPublicationIcon(publication.type)}
                            <span className="text-xs font-medium text-gray-500 uppercase">
                              {publication.type.replace('_', ' ')}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              {formatDate(publication.publishedAt)}
                            </span>
                          </div>
                          <h4 className="font-medium text-gray-900 mb-2">{publication.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{publication.summary}</p>
                        </div>
                        {publication.url && (
                          <a
                            href={publication.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-4 p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'social' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Latest Social Media Posts</h3>
                  {loading.socialPosts ? (
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-500">{socialPosts.length} recent posts</span>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
                
                {loading.socialPosts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : socialPosts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p>No social media posts found.</p>
                    <p className="text-xs mt-1">Posts will appear here once our crawler finds relevant content.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {socialPosts.map((post) => (
                    <div key={post.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-all">
                      {/* Post Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          {getPlatformIcon(post.platform)}
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-700">
                                {post.platform}
                              </span>
                              {post.mentionsCompany && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Mentions Us
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(post.postedAt)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {post.relevanceScore && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {post.relevanceScore}% relevant
                            </span>
                          )}
                          {post.url && (
                            <a
                              href={post.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                      
                      {/* Post Content */}
                      <p className="text-sm text-gray-800 mb-4 leading-relaxed">{post.content}</p>
                      
                      {/* Analysis Tags */}
                      {post.themes && post.themes.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-center mb-2">
                            <Tag className="w-3 h-3 text-gray-400 mr-1" />
                            <span className="text-xs font-medium text-gray-500">THEMES</span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {post.themes.map((theme, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                              >
                                {theme}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Engagement Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {post.sentiment && (
                            <div className="flex items-center space-x-1">
                              <span className="text-gray-400">Sentiment:</span>
                              <span className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                                post.sentiment === 'POSITIVE' ? 'bg-green-100 text-green-800' :
                                post.sentiment === 'NEGATIVE' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              )}>
                                {post.sentiment.toLowerCase()}
                              </span>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>{post.engagements || 0} engagements</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Analyzed {formatDate(post.analyzedAt || post.createdAt)}</span>
                          </div>
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setEngagementModal({ isOpen: true, type: 'reply', post })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Reply className="w-3 h-3" />
                            Reply
                          </button>
                          <button
                            onClick={() => setEngagementModal({ isOpen: true, type: 'share', post })}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          >
                            <Share className="w-3 h-3" />
                            Share
                          </button>
                        </div>
                      </div>
                    </div>
                    ))}
                  </div>
                )}
                
                {/* Social Media Summary */}
                {socialPosts.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Activity Summary</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{socialPosts.length}</div>
                        <div className="text-xs text-gray-600">Recent Posts</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">
                          {socialPosts.filter(p => p.mentionsCompany).length}
                        </div>
                        <div className="text-xs text-gray-600">Mentions Us</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">
                          {Math.round(socialPosts.reduce((sum, p) => sum + (p.relevanceScore || 0), 0) / socialPosts.length) || 0}%
                        </div>
                        <div className="text-xs text-gray-600">Avg Relevance</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'briefings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Briefing History</h3>
                  {loading.briefings ? (
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <span className="text-sm text-gray-500">{briefings.length} briefings</span>
                  )}
                </div>
                {loading.briefings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : briefings.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No briefings found.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {briefings.map((briefing) => (
                    <div key={briefing.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{briefing.title}</span>
                            <span className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                              getBriefingStatusColor(briefing.status)
                            )}>
                              {briefing.status}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>Scheduled: {formatDate(briefing.scheduledAt)}</span>
                            </div>
                            {briefing.completedAt && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>Completed: {formatDate(briefing.completedAt)}</span>
                              </div>
                            )}
                            {briefing.duration && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{briefing.duration} minutes</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {briefing.outcomes && briefing.outcomes.length > 0 && (
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Key Outcomes:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {briefing.outcomes.map((outcome, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{outcome}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {briefing.followUpActions && briefing.followUpActions.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Follow-up Actions:</h5>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {briefing.followUpActions.map((action, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-blue-400 mt-1">→</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Modal */}
      {engagementModal.isOpen && engagementModal.post && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-60"
            onClick={() => setEngagementModal({ isOpen: false, type: null, post: null })}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  {engagementModal.type === 'reply' ? (
                    <>
                      <Reply className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Reply to Post</h3>
                    </>
                  ) : (
                    <>
                      <Share className="w-5 h-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Share Post</h3>
                    </>
                  )}
                  <div className="flex items-center space-x-2 ml-4">
                    {getPlatformIcon(engagementModal.post.platform)}
                    <span className="text-sm text-gray-500">{engagementModal.post.platform}</span>
                  </div>
                </div>
                <button
                  onClick={() => setEngagementModal({ isOpen: false, type: null, post: null })}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Original Post */}
              <div className="p-6 bg-gray-50 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Original Post</h4>
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-2 mb-3">
                    {getPlatformIcon(engagementModal.post.platform)}
                    <span className="text-sm font-medium text-gray-700">
                      {analyst.firstName} {analyst.lastName}
                    </span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">
                      {formatDate(engagementModal.post.postedAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {engagementModal.post.content}
                  </p>
                </div>
              </div>

              {/* Compose Area */}
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {engagementModal.type === 'reply' ? 'Your Reply' : 'Share with Comment'}
                    </label>
                    <div className="relative">
                      <textarea
                        value={engagementText}
                        onChange={(e) => setEngagementText(e.target.value)}
                        placeholder={`Write your ${engagementModal.type === 'reply' ? 'reply' : 'comment'}...`}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      />
                      
                      {/* AI Helper */}
                      {!engagementText.trim() && (
                        <div className="absolute inset-x-3 bottom-3">
                          <button
                            onClick={generateAIResponse}
                            disabled={isGeneratingAI}
                            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isGeneratingAI ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Wand2 className="w-4 h-4" />
                            )}
                            {isGeneratingAI ? 'Generating...' : 'AI can help you craft a message'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Character Count */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div>
                      {engagementModal.post.platform === 'TWITTER' && (
                        <span className={cn(
                          'font-medium',
                          engagementText.length > 280 ? 'text-red-600' : 'text-gray-500'
                        )}>
                          {engagementText.length}/280 characters
                        </span>
                      )}
                      {engagementModal.post.platform === 'LINKEDIN' && (
                        <span className={cn(
                          'font-medium',
                          engagementText.length > 3000 ? 'text-red-600' : 'text-gray-500'
                        )}>
                          {engagementText.length}/3000 characters
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>Posting as ClearCompany</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end space-x-3 pt-4">
                    <button
                      onClick={() => setEngagementModal({ isOpen: false, type: null, post: null })}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleEngagementSubmit}
                      disabled={!engagementText.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      {engagementModal.type === 'reply' ? 'Post Reply' : 'Share Post'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
