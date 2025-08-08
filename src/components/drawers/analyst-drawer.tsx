'use client'

import { useState, useEffect } from 'react'
import { X, User, Building, Mail, Phone, Linkedin, Twitter, Globe, Calendar, FileText, MessageSquare, Users, ExternalLink, TrendingUp, Clock, MapPin, Loader, Tag, Sparkles, Reply, Share, Send, Wand2, Search, RefreshCw, Edit, Save, XCircle, Camera, Image } from 'lucide-react'
import { cn, getInfluenceColor, getStatusColor } from '@/lib/utils'
import { useSettings } from '@/contexts/SettingsContext'

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
    coveredTopics?: string[] | { topic: string }[]
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
  const { settings } = useSettings()
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
  const [socialSearchLoading, setSocialSearchLoading] = useState({
    linkedin: false,
    twitter: false,
    phone: false,
    website: false
  })
  const [searchResultsModal, setSearchResultsModal] = useState<{
    isOpen: boolean
    type: 'linkedin' | 'twitter' | 'phone' | 'website' | null
    results: any[]
  }>({ isOpen: false, type: null, results: [] })
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedData, setEditedData] = useState<{
    status: string
    influence: string
    relationshipHealth: string
    email: string
    phone: string
    linkedIn: string
    twitter: string
    website: string
    coveredTopics: string[]
  }>({
    status: analyst?.status || 'ACTIVE',
    influence: analyst?.influence || 'MEDIUM',
    relationshipHealth: analyst?.relationshipHealth || 'GOOD',
    email: analyst?.email || '',
    phone: analyst?.phone || '',
    linkedIn: analyst?.linkedIn || '',
    twitter: analyst?.twitter || '',
    website: analyst?.website || '',
    coveredTopics: analyst?.coveredTopics ? analyst.coveredTopics.map(t => typeof t === 'string' ? t : t.topic) : []
  })
  const [isSaving, setIsSaving] = useState(false)
  const [profilePictureModal, setProfilePictureModal] = useState<{
    isOpen: boolean
    pictures: any[]
    loading: boolean
  }>({ isOpen: false, pictures: [], loading: false })

  // Handle entering edit mode
  const handleEnterEditMode = () => {
    if (!analyst) return
    
    setEditedData({
      status: analyst.status || 'ACTIVE',
      influence: analyst.influence || 'MEDIUM',
      relationshipHealth: analyst.relationshipHealth || 'GOOD',
      email: analyst.email || '',
      phone: analyst.phone || '',
      linkedIn: analyst.linkedIn || '',
      twitter: analyst.twitter || '',
      website: analyst.website || '',
      coveredTopics: analyst.coveredTopics ? analyst.coveredTopics.map(t => typeof t === 'string' ? t : t.topic) : []
    })
    setIsEditMode(true)
  }

  // Handle canceling edit mode
  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditedData({
      status: analyst?.status || 'ACTIVE',
      influence: analyst?.influence || 'MEDIUM',
      relationshipHealth: analyst?.relationshipHealth || 'GOOD',
      email: analyst?.email || '',
      phone: analyst?.phone || '',
      linkedIn: analyst?.linkedIn || '',
      twitter: analyst?.twitter || '',
      website: analyst?.website || '',
      coveredTopics: analyst?.coveredTopics ? analyst.coveredTopics.map(t => typeof t === 'string' ? t : t.topic) : []
    })
  }

  // Handle saving edit mode
  const handleSaveEdit = async () => {
    if (!analyst?.id) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/analysts/${analyst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedData)
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update the analyst object inline
          Object.assign(analyst, {
            status: editedData.status,
            influence: editedData.influence,
            relationshipHealth: editedData.relationshipHealth,
            email: editedData.email,
            phone: editedData.phone,
            linkedIn: editedData.linkedIn,
            twitter: editedData.twitter,
            website: editedData.website,
            coveredTopics: editedData.coveredTopics.map(topic => ({ topic }))
          })
          setIsEditMode(false)
          // Force a re-render
          setActiveTab(activeTab)
        } else {
          alert('Failed to save changes: ' + result.error)
        }
      } else {
        alert('Failed to save changes')
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Error saving changes. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle adding a new topic
  const handleAddTopic = () => {
    const newTopic = prompt('Enter a new topic:')
    if (newTopic && newTopic.trim()) {
      setEditedData(prev => ({
        ...prev,
        coveredTopics: [...prev.coveredTopics, newTopic.trim()]
      }))
    }
  }

  // Handle removing a topic
  const handleRemoveTopic = (index: number) => {
    setEditedData(prev => ({
      ...prev,
      coveredTopics: prev.coveredTopics.filter((_, i) => i !== index)
    }))
  }

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

    // fetchData('publications', setPublications, 'publications')
    // fetchData('social-posts', setSocialPosts, 'socialPosts')
    // fetchData('briefings', setBriefings, 'briefings')
  }, [isOpen, analyst?.id])

  // Update edit data when analyst changes
  useEffect(() => {
    if (analyst) {
      setEditedData({
        status: analyst.status || 'ACTIVE',
        influence: analyst.influence || 'MEDIUM',
        relationshipHealth: analyst.relationshipHealth || 'GOOD',
        email: analyst.email || '',
        phone: analyst.phone || '',
        linkedIn: analyst.linkedIn || '',
        twitter: analyst.twitter || '',
        website: analyst.website || '',
        coveredTopics: analyst.coveredTopics ? analyst.coveredTopics.map(t => typeof t === 'string' ? t : t.topic) : []
      })
    }
  }, [analyst])

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

  const searchProfilePictures = async () => {
    setProfilePictureModal(prev => ({ ...prev, loading: true, isOpen: true }))
    
    try {
      const industryName = settings?.industryName || 'Technology'
      
      console.log(`🔍 Searching for headshots: "Headshot of ${industryName} analyst ${analyst.firstName} ${analyst.lastName}"`)
      
      const response = await fetch('/api/analysts/search-profile-pictures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystName: `${analyst.firstName} ${analyst.lastName}`,
          company: analyst.company,
          title: analyst.title,
          industryName: industryName
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.results) {
          setProfilePictureModal(prev => ({
            ...prev,
            pictures: result.results,
            loading: false
          }))
        } else {
          alert('No profile pictures found')
          setProfilePictureModal(prev => ({ ...prev, loading: false, isOpen: false }))
        }
      } else {
        alert('Failed to search for profile pictures')
        setProfilePictureModal(prev => ({ ...prev, loading: false, isOpen: false }))
      }
    } catch (error) {
      console.error('Error searching for profile pictures:', error)
      alert('Error searching for profile pictures. Please try again.')
      setProfilePictureModal(prev => ({ ...prev, loading: false, isOpen: false }))
    }
  }

  const selectProfilePicture = async (pictureUrl: string) => {
    try {
      const response = await fetch(`/api/analysts/${analyst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileImageUrl: pictureUrl
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update the analyst object to reflect the change immediately
          analyst.profileImageUrl = pictureUrl
          
          // Close the modal
          setProfilePictureModal({ isOpen: false, pictures: [], loading: false })
          
          // Force a re-render to show the updated picture
          setActiveTab(activeTab)
          
          alert('✅ Profile picture updated successfully!')
        } else {
          throw new Error(result.error || 'Failed to save')
        }
      } else {
        throw new Error(`Server error: ${response.status}`)
      }
    } catch (error) {
      console.error('Error saving profile picture:', error)
      alert('❌ Failed to save profile picture. Please try again.')
    }
  }

  const searchSocialProfile = async (platform: 'linkedin' | 'twitter' | 'phone' | 'website') => {
    setSocialSearchLoading(prev => ({ ...prev, [platform]: true }))
    
    try {
      const response = await fetch('/api/analysts/search-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystId: analyst.id,
          analystName: `${analyst.firstName} ${analyst.lastName}`,
          company: analyst.company,
          platform
        })
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success && result.results && result.results.length > 0) {
          // Show selection modal with multiple results
          setSearchResultsModal({
            isOpen: true,
            type: platform,
            results: result.results
          })
          setSelectedResults([])
        } else if (result.success && result.result) {
          // Single result - show old logic for backward compatibility
          const searchResult = result.result
          
          if (searchResult.confidence > 0) {
            const confirmMessage = `Found ${platform} with ${searchResult.confidence}% confidence:\n\n` +
              `${getPlatformFieldName(platform)}: ${searchResult.url || searchResult.handle || searchResult.value}\n` +
              `Reason: ${searchResult.reason}\n\n` +
              `Would you like to save this to the analyst profile?`
              
            if (confirm(confirmMessage)) {
              await saveSocialMediaResult(platform, searchResult)
            }
          } else {
            alert(`No reliable ${platform} found. ${searchResult.reason}`)
          }
        } else {
          alert(`No ${platform} found.`)
        }
      } else {
        alert('Search request failed')
      }
    } catch (error) {
      console.error(`Error searching ${platform}:`, error)
      alert(`Error searching ${platform}. Please try again.`)
    } finally {
      setSocialSearchLoading(prev => ({ ...prev, [platform]: false }))
    }
  }
  
  const getPlatformFieldName = (platform: string) => {
    switch (platform) {
      case 'linkedin': return 'LinkedIn URL'
      case 'twitter': return 'Twitter Handle'
      case 'phone': return 'Phone Number'
      case 'website': return 'Website URL'
      default: return 'Value'
    }
  }
  
  const saveSocialMediaResult = async (platform: 'linkedin' | 'twitter' | 'phone' | 'website', searchResult: any) => {
    try {
      // Determine the field name and value based on platform
      let fieldName: string
      let fieldValue: string
      
      switch (platform) {
        case 'linkedin':
          fieldName = 'linkedIn'
          fieldValue = searchResult.url || ''
          break
        case 'twitter':
          fieldName = 'twitter'
          fieldValue = searchResult.handle || searchResult.url || ''
          break
        case 'phone':
          fieldName = 'phone'
          fieldValue = searchResult.value || searchResult.url || ''
          break
        case 'website':
          fieldName = 'website'
          fieldValue = searchResult.url || ''
          break
        default:
          throw new Error(`Unknown platform: ${platform}`)
      }
      
      // Save to database
      const response = await fetch(`/api/analysts/${analyst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [fieldName]: fieldValue
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          // Update the analyst object to reflect the change immediately
          (analyst as any)[fieldName] = fieldValue
          
          // Update the edit data as well if we're in edit mode
          if (isEditMode) {
            setEditedData(prev => ({
              ...prev,
              [fieldName]: fieldValue
            }))
          }
          
          // Force a re-render to show the updated value
          setActiveTab(activeTab)
          
          // Show success message
          const displayValue = fieldValue.length > 50 ? fieldValue.substring(0, 50) + '...' : fieldValue
          alert(`✅ Successfully saved ${getPlatformFieldName(platform)}: ${displayValue}`)
        } else {
          throw new Error(result.error || 'Failed to save')
        }
      } else {
        throw new Error(`Server error: ${response.status}`)
      }
    } catch (error) {
      console.error(`Error saving ${platform} result:`, error)
      alert(`❌ Failed to save ${getPlatformFieldName(platform)}. Please try again.`)
    }
  }

  const handleSaveSelectedResults = async () => {
    if (selectedResults.length === 0 || !searchResultsModal.type) return
    
    try {
      const response = await fetch(`/api/analysts/${analyst.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [searchResultsModal.type]: selectedResults
        })
      })
      
      if (response.ok) {
        // Update the analyst object inline instead of reloading
        if (searchResultsModal.type === 'linkedin') {
          analyst.linkedIn = selectedResults[0] // Assuming we take the first one for LinkedIn
        } else if (searchResultsModal.type === 'twitter') {
          analyst.twitter = selectedResults[0] // Assuming we take the first one for Twitter
        } else if (searchResultsModal.type === 'phone') {
          analyst.phone = selectedResults[0] // Assuming we take the first one for Phone
        } else if (searchResultsModal.type === 'website') {
          analyst.website = selectedResults[0] // Assuming we take the first one for Website
        }
        
        setSearchResultsModal({ isOpen: false, type: null, results: [] })
        setSelectedResults([])
        
        // Force a re-render by updating state
        // This is a simple way to trigger re-render without full page reload
        setActiveTab(activeTab)
      } else {
        alert('Failed to save selected results')
      }
    } catch (error) {
      console.error('Error saving results:', error)
      alert('Error saving results. Please try again.')
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
            <div className="flex items-center space-x-2">
              {/* Edit Mode Toggle */}
              {!isEditMode ? (
                <button
                  onClick={handleEnterEditMode}
                  className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={searchProfilePictures}
                    className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    title="Search Google Images for analyst headshots"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Find Photo</span>
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'Saving...' : 'Save'}</span>
                  </button>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'publications', label: 'Content' },
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
                {/* Status, Influence, and Relationship Health */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      {isEditMode ? (
                        <select
                          value={editedData.status}
                          onChange={(e) => setEditedData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      ) : (
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getStatusColor(analyst.status)
                        )}>
                          {analyst.status}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Influence</label>
                    <div className="mt-1">
                      {isEditMode ? (
                        <select
                          value={editedData.influence}
                          onChange={(e) => setEditedData(prev => ({ ...prev, influence: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="VERY_HIGH">Very High</option>
                        </select>
                      ) : (
                        <span className={cn(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          getInfluenceColor(analyst.influence)
                        )}>
                          {analyst.influence.replace('_', ' ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Relationship Health</label>
                    <div className="mt-1">
                      {isEditMode ? (
                        <select
                          value={editedData.relationshipHealth}
                          onChange={(e) => setEditedData(prev => ({ ...prev, relationshipHealth: e.target.value }))}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="EXCELLENT">Excellent</option>
                          <option value="GOOD">Good</option>
                          <option value="FAIR">Fair</option>
                          <option value="POOR">Poor</option>
                          <option value="CRITICAL">Critical</option>
                        </select>
                      ) : (
                        <span className="text-sm text-gray-700">
                          {analyst.relationshipHealth || 'N/A'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <div className="flex-1">
                          <div className="text-xs font-medium text-gray-500">Email</div>
                          {isEditMode ? (
                            <input
                              type="email"
                              value={editedData.email}
                              onChange={(e) => setEditedData(prev => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Enter email address"
                            />
                          ) : (
                            <a href={`mailto:${analyst.email}`} className="text-blue-600 hover:underline text-sm">
                              {analyst.email}
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500">Phone</div>
                        {isEditMode ? (
                          <input
                            type="tel"
                            value={editedData.phone}
                            onChange={(e) => setEditedData(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter phone number"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            {analyst.phone ? (
                              <a href={`tel:${analyst.phone}`} className="text-blue-600 hover:underline text-sm">
                                {analyst.phone}
                              </a>
                            ) : (
                              <>
                                <span className="text-gray-500 text-sm">N/A</span>
                                <button
                                  onClick={() => searchSocialProfile('phone')}
                                  disabled={socialSearchLoading.phone}
                                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {socialSearchLoading.phone ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Search className="w-3 h-3" />
                                  )}
                                  <span>Search with AI</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* LinkedIn */}
                    <div className="flex items-center space-x-3">
                      <Linkedin className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500">LinkedIn</div>
                        {isEditMode ? (
                          <input
                            type="url"
                            value={editedData.linkedIn}
                            onChange={(e) => setEditedData(prev => ({ ...prev, linkedIn: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter LinkedIn URL"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            {analyst.linkedIn ? (
                              <a href={analyst.linkedIn} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                LinkedIn Profile
                              </a>
                            ) : (
                              <>
                                <span className="text-gray-500 text-sm">N/A</span>
                                <button
                                  onClick={() => searchSocialProfile('linkedin')}
                                  disabled={socialSearchLoading.linkedin}
                                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {socialSearchLoading.linkedin ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Search className="w-3 h-3" />
                                  )}
                                  <span>Search with AI</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Twitter/X */}
                    <div className="flex items-center space-x-3">
                      <Twitter className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500">Twitter/X</div>
                        {isEditMode ? (
                          <input
                            type="text"
                            value={editedData.twitter}
                            onChange={(e) => setEditedData(prev => ({ ...prev, twitter: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter Twitter handle"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            {analyst.twitter ? (
                              <a href={`https://twitter.com/${analyst.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                {analyst.twitter}
                              </a>
                            ) : (
                              <>
                                <span className="text-gray-500 text-sm">N/A</span>
                                <button
                                  onClick={() => searchSocialProfile('twitter')}
                                  disabled={socialSearchLoading.twitter}
                                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {socialSearchLoading.twitter ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Search className="w-3 h-3" />
                                  )}
                                  <span>Search with AI</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Website */}
                    <div className="flex items-center space-x-3">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-xs font-medium text-gray-500">Website</div>
                        {isEditMode ? (
                          <input
                            type="url"
                            value={editedData.website}
                            onChange={(e) => setEditedData(prev => ({ ...prev, website: e.target.value }))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter website URL"
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            {analyst.website ? (
                              <a href={analyst.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                                Website
                              </a>
                            ) : (
                              <>
                                <span className="text-gray-500 text-sm">N/A</span>
                                <button
                                  onClick={() => searchSocialProfile('website')}
                                  disabled={socialSearchLoading.website}
                                  className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                                >
                                  {socialSearchLoading.website ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Search className="w-3 h-3" />
                                  )}
                                  <span>Search with AI</span>
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expertise */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Covered Topics</h3>
                    {isEditMode && (
                      <button
                        onClick={handleAddTopic}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <span>+ Add Topic</span>
                      </button>
                    )}
                  </div>
                  {isEditMode ? (
                    editedData.coveredTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {editedData.coveredTopics.map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 group"
                          >
                            {topic}
                            <button
                              onClick={() => handleRemoveTopic(index)}
                              className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                        <Tag className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No topics specified.</p>
                        <button
                          onClick={handleAddTopic}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Add your first topic
                        </button>
                      </div>
                    )
                  ) : (
                    analyst.coveredTopics && analyst.coveredTopics.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {analyst.coveredTopics.map((topic, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800"
                          >
                            {typeof topic === 'string' ? topic : topic.topic}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Tag className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">No topics specified.</p>
                      </div>
                    )
                  )}
                </div>

                {/*
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium text-gray-900">Social Media Activity</h3>
                    {loading.socialPosts ? (
                      <Loader className="w-4 h-4 animate-spin text-blue-600" />
                    ) : (
                      <span className="text-sm text-gray-500">Latest 5 posts</span>
                    )}
                  </div>
                  
                  {loading.socialPosts ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="w-6 h-6 animate-spin text-blue-600" />
                    </div>
                  ) : socialPosts.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <MessageSquare className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">No social media posts found.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {socialPosts.slice(0, 5).map((post) => (
                        <div key={post.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getPlatformIcon(post.platform)}
                              <span className="text-xs font-medium text-gray-600">
                                {post.platform}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(post.postedAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              {post.url && (
                                <a
                                  href={post.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-800 mb-2 leading-relaxed line-clamp-3">{post.content}</p>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{post.engagements || 0} engagements</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => setEngagementModal({ isOpen: true, type: 'reply', post })}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                              >
                                <Reply className="w-3 h-3" />
                                Reply
                              </button>
                              <button
                                onClick={() => setEngagementModal({ isOpen: true, type: 'share', post })}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors"
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
                </div>
                */

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
                  <h3 className="text-lg font-medium text-gray-900">Content (Last 2 Years)</h3>
                  {loading.publications ? (
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  ) : (
                    <span className="text-sm text-gray-500">{publications.length} items</span>
                  )}
                </div>
                {loading.publications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : publications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No content found in the last 2 years.
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
      
      {/* Search Results Selection Modal */}
      {searchResultsModal.isOpen && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-60"
            onClick={() => setSearchResultsModal({ isOpen: false, type: null, results: [] })}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <Search className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    Select {getPlatformFieldName(searchResultsModal.type || 'website')}
                  </h3>
                </div>
                <button
                  onClick={() => setSearchResultsModal({ isOpen: false, type: null, results: [] })}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Results List */}
              <div className="p-6 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-4">
                  We found {searchResultsModal.results.length} potential {searchResultsModal.type} results. 
                  Select the ones that belong to {analyst.firstName} {analyst.lastName}:
                </p>
                
                <div className="space-y-3">
                  {searchResultsModal.results.map((result, index) => (
                    <div 
                      key={index} 
                      className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id={`result-${index}`}
                          checked={selectedResults.includes(result.url || result.handle || result.value)}
                          onChange={(e) => {
                            const value = result.url || result.handle || result.value
                            if (e.target.checked) {
                              setSelectedResults(prev => [...prev, value])
                            } else {
                              setSelectedResults(prev => prev.filter(item => item !== value))
                            }
                          }}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <label htmlFor={`result-${index}`} className="cursor-pointer">
                            <div className="font-medium text-gray-900 mb-1">
                              {result.url || result.handle || result.value}
                            </div>
                            {result.title && (
                              <div className="text-sm text-gray-600 mb-1">{result.title}</div>
                            )}
                            {result.description && (
                              <div className="text-sm text-gray-500 mb-2">{result.description}</div>
                            )}
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <span className="font-medium">Confidence:</span>
                                <span className={cn(
                                  'px-2 py-0.5 rounded-full font-medium',
                                  result.confidence >= 80 ? 'bg-green-100 text-green-800' :
                                  result.confidence >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                )}>
                                  {result.confidence}%
                                </span>
                              </div>
                              {result.reason && (
                                <div className="flex items-center space-x-1">
                                  <span className="font-medium">Reason:</span>
                                  <span>{result.reason}</span>
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                        {(result.url || result.handle || result.value) && (
                          <a
                            href={result.url || (result.handle?.startsWith('@') ? `https://twitter.com/${result.handle.substring(1)}` : result.value)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between p-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedResults.length} of {searchResultsModal.results.length} selected
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSearchResultsModal({ isOpen: false, type: null, results: [] })}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveSelectedResults}
                    disabled={selectedResults.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save Selected
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Profile Picture Search Modal */}
      {profilePictureModal.isOpen && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-30 z-60"
            onClick={() => setProfilePictureModal({ isOpen: false, pictures: [], loading: false })}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Camera className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Select Profile Picture for {analyst.firstName} {analyst.lastName}
                    </h3>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Search className="w-4 h-4" />
                    <span>Searching: "Headshot of {settings?.industryName || 'Technology'} analyst {analyst.firstName} {analyst.lastName}"</span>
                  </div>
                </div>
                <button
                  onClick={() => setProfilePictureModal({ isOpen: false, pictures: [], loading: false })}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {profilePictureModal.loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                    <p className="text-sm text-gray-600 mb-2">Searching Google Images via SerpApi...</p>
                    <p className="text-xs text-gray-500">
                      Query: "Headshot of {settings?.industryName || 'Technology'} analyst {analyst.firstName} {analyst.lastName}"
                    </p>
                  </div>
                ) : profilePictureModal.pictures.length === 0 ? (
                  <div className="text-center py-12">
                    <Image className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">No profile pictures found.</p>
                    <button
                      onClick={searchProfilePictures}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Search className="w-4 h-4" />
                      Search Again
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600">
                        Found {profilePictureModal.pictures.length} profile picture options from SerpApi Google Images.
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Powered by</span>
                        <span className="font-medium">SerpApi</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      {profilePictureModal.pictures.map((picture, index) => (
                        <div 
                          key={index}
                          className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
                          onClick={() => selectProfilePicture(picture.url)}
                        >
                          <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden flex items-center justify-center">
                            <img
                              src={picture.thumbnail || picture.url}
                              alt={picture.title || `Profile picture option ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => {
                                e.currentTarget.src = picture.url // Fallback to original if thumbnail fails
                              }}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-gray-900">
                                {picture.source}
                              </span>
                              <span className={cn(
                                'px-2 py-0.5 rounded-full text-xs font-medium',
                                picture.confidence >= 90 ? 'bg-green-100 text-green-800' :
                                picture.confidence >= 75 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              )}>
                                {picture.confidence}% match
                              </span>
                            </div>
                            
                            {picture.title && (
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {picture.title}
                              </p>
                            )}
                            
                            {picture.width && picture.height && (
                              <p className="text-xs text-gray-500">
                                {picture.width} × {picture.height}
                              </p>
                            )}
                          </div>
                          
                          <button className="w-full mt-3 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
                            Select This Picture
                          </button>
                        </div>
                      ))}
                    </div>
                    
                    <div className="text-center pt-4 border-t border-gray-200">
                      <button
                        onClick={searchProfilePictures}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Search Again
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
