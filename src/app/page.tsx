'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Mail, FileText, TrendingUp, AlertTriangle, Heart, Activity, Calendar, MessageSquare, Video, CheckCircle, X, ListTodo, Clock, UserCheck, Loader2 } from 'lucide-react'
import SocialMediaActivity from '@/components/social-media-activity'
import { cn } from '@/lib/utils'

interface DashboardMetrics {
  totalAnalysts: number
  activeAnalysts: number
  analystsAddedPast90Days: number
  newslettersSentPast90Days: number
  contentItemsPast90Days: number
  engagementRate: number
  activeAlerts: number
  briefingsPast90Days: number
  relationshipHealth: number
  recentContentItems: ContentItem[]
  newAnalysts: NewAnalyst[]
}

interface ContentItem {
  id: string
  title: string
  type: string
  createdAt: string
  status: string
}

interface NewAnalyst {
  id: string
  firstName: string
  lastName: string
  company?: string
  createdAt: string
}

interface ActivityItem {
  type: string
  message: string
  time: string
  icon: string
  color: string
}

interface ActionItem {
  id: string
  briefingId: string
  description: string
  assignedTo?: string
  assignedBy?: string
  dueDate?: string
  isCompleted: boolean
  completedAt?: string
  completedBy?: string
  priority: 'HIGH' | 'MEDIUM' | 'LOW'
  category?: string
  notes?: string
  createdAt: string
  updatedAt: string
  briefing: {
    id: string
    title: string
    scheduledAt: string
    primaryAnalyst?: {
      firstName: string
      lastName: string
      company?: string
    }
  }
}

// Icon mapping for activity items
const iconMap: { [key: string]: any } = {
  Users,
  Mail,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Video
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionItemsLoading, setActionItemsLoading] = useState(true)
  const [industryName, setIndustryName] = useState('')
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  const fetchDashboardData = async () => {
    try {
      const [metricsRes, activityRes, actionItemsRes] = await Promise.all([
        fetch('/api/dashboard/metrics'),
        fetch('/api/dashboard/recent-activity'),
        fetch('/api/action-items?status=pending')
      ])

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json()
        setMetrics(metricsData)
      }

      if (activityRes.ok) {
        const activityData = await activityRes.json()
        setRecentActivity(activityData)
      }

      if (actionItemsRes.ok) {
        const actionItemsData = await actionItemsRes.json()
        if (actionItemsData.success) {
          setActionItems(actionItemsData.data)
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setActionItemsLoading(false)
    }
  }

  const fetchIndustryName = async () => {
    try {
      const response = await fetch('/api/settings/general')
      const data = await response.json()
      if (data.industryName) {
        setIndustryName(data.industryName)
      }
    } catch (error) {
      console.error('Error fetching industry name:', error)
      // Default will be used
    }
  }

  useEffect(() => {
    // Check for URL parameters for notifications
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (success === 'google_auth') {
      console.log('✅ Google authentication successful!')
      setNotification({
        type: 'success',
        message: 'Google authentication successful! You can now connect your calendar in Settings.'
      })
      // Clear the URL parameter
      window.history.replaceState({}, '', '/')
    } else if (error) {
      console.log('❌ Authentication error:', error)
      setNotification({
        type: 'error',
        message: 'Authentication failed. Please try again.'
      })
      // Clear the URL parameter
      window.history.replaceState({}, '', '/')
    }

    fetchDashboardData()
    fetchIndustryName()
  }, [searchParams])

  const handleCompleteActionItem = async (itemId: string, completedBy?: string) => {
    // Get the user's display name for completed by field
    const getUserName = () => {
      if (completedBy) return completedBy
      if (profile?.first_name && profile?.last_name) {
        return `${profile.first_name} ${profile.last_name}`
      }
      if (profile?.first_name) {
        return profile.first_name
      }
      if (user?.email) {
        return user.email.split('@')[0]
      }
      return 'Dashboard User'
    }
    
    const actualCompletedBy = getUserName()
    try {
      const response = await fetch(`/api/action-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          isCompleted: true,
          completedBy: actualCompletedBy
        })
      })
      
      if (response.ok) {
        // Refresh action items
        const actionItemsRes = await fetch('/api/action-items?status=pending')
        if (actionItemsRes.ok) {
          const actionItemsData = await actionItemsRes.json()
          if (actionItemsData.success) {
            setActionItems(actionItemsData.data)
          }
        }
      }
    } catch (error) {
      console.error('Error completing action item:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your {industryName || 'HR Tech'} Analyst Portal
        </p>
        
        {/* Notification Banner */}
        {notification && (
          <div className={`mt-4 p-4 rounded-lg border flex items-center justify-between ${
            notification.type === 'success' 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertTriangle className="h-5 w-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        
        {metrics && metrics.activeAlerts > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
              <p className="text-sm text-orange-800">
                You have {metrics.activeAlerts} active alert{metrics.activeAlerts !== 1 ? 's' : ''} requiring attention
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dashboard Period Notice */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          <p className="text-sm text-blue-800">
            <strong>Dashboard Period:</strong> All metrics and data shown below reflect the past 90 days unless otherwise specified.
          </p>
        </div>
      </div>

      {/* Band 1: Analysts */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="h-5 w-5 text-blue-600 mr-2" />
          Analysts
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Total Analysts with Recent Updates */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Analysts
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics?.totalAnalysts || 0}
                    </dd>
                  </dl>
                </div>
              </div>
              
              {/* Recent Updates section within Total Analysts card */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Recent Updates
                </h4>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-4">
                      <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-xs text-gray-500">No recent updates</p>
                      <p className="text-xs text-gray-400">Updates will appear here as you interact with analysts</p>
                    </div>
                  ) : (
                    recentActivity.slice(0, 6).map((activity, index) => {
                      return (
                        <div key={index} className="flex items-center justify-between py-2 border-b border-gray-300">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {activity.time} - {activity.message}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Newly Added Analysts */}
          <NewAnalystsWidget newAnalysts={metrics?.newAnalysts || []} />
        </div>
      </div>

      {/* Band 2: Coverage */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="h-5 w-5 text-blue-600 mr-2" />
          Coverage
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Row 1 */}
          {/* Engagement % */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Engagement %
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics?.engagementRate ? `${metrics.engagementRate}%` : '0%'}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Briefings */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-indigo-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Briefings
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics?.briefingsPast90Days || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Briefing Follow-ups - spans 2 rows */}
          <div className="bg-white overflow-hidden shadow rounded-lg lg:row-span-2">
            <ActionItemsWidget
              actionItems={actionItems}
              loading={actionItemsLoading}
              onComplete={handleCompleteActionItem}
              tall={true}
            />
          </div>

          {/* Row 2 */}
          {/* Active Alerts */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-6 w-6 text-orange-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Alerts
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics?.activeAlerts || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Newsletters Sent */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Mail className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Newsletters Sent
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {metrics?.newslettersSentPast90Days || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Band 3: Listening */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <MessageSquare className="h-5 w-5 text-purple-600 mr-2" />
          Listening
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Social Media Activity */}
          <div className="bg-white shadow rounded-lg">
            <Suspense fallback={<div className="p-6">Loading social media activity...</div>}>
              <SocialMediaActivity />
            </Suspense>
          </div>

          {/* Publications (Content Items) */}
          <ContentItemsWidget contentItems={metrics?.recentContentItems || []} title="Publications" />
        </div>
      </div>

    </div>
  )
}

// Loading component for Suspense fallback
function LoadingDashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 flex items-center justify-center">
      <div className="flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
        <span className="ml-2 text-white">Loading...</span>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function Dashboard() {
  return (
    <Suspense fallback={<LoadingDashboard />}>
      <DashboardContent />
    </Suspense>
  )
}

// NewAnalystsWidget Component
function NewAnalystsWidget({ newAnalysts }: { newAnalysts: NewAnalyst[] }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <UserCheck className="h-6 w-6 text-green-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-500">Newly Added Analysts</h3>
              <p className="text-2xl font-semibold text-gray-900">{newAnalysts.length}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {newAnalysts.length === 0 ? (
              <div className="text-center py-4">
                <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No new analysts added</p>
              </div>
            ) : (
              newAnalysts.slice(0, 8).map((analyst) => (
                <div key={analyst.id} className="flex items-center justify-between py-2 border-b border-gray-300">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {analyst.firstName} {analyst.lastName}
                    </p>
                    {analyst.company && (
                      <p className="text-xs text-gray-500">{analyst.company}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 ml-2">
                    {formatDate(analyst.createdAt)}
                  </span>
                </div>
              ))
            )}
            
            {newAnalysts.length > 8 && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500">
                  +{newAnalysts.length - 8} more
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ContentItemsWidget Component
function ContentItemsWidget({ contentItems, title = "Content Items Added" }: { contentItems: ContentItem[], title?: string }) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'article':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'newsletter':
        return <Mail className="w-4 h-4 text-green-500" />
      case 'briefing':
        return <Calendar className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FileText className="h-6 w-6 text-purple-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-500">{title}</h3>
              <p className="text-2xl font-semibold text-gray-900">{contentItems.length}</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {contentItems.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No content items added</p>
              <p className="text-xs text-gray-400">Content will appear here when added</p>
            </div>
          ) : (
            contentItems.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs text-gray-500 capitalize">
                          {item.type}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-400">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ActionItemsWidget Component
function ActionItemsWidget({ 
  actionItems, 
  loading, 
  onComplete,
  compact = false,
  tall = false
}: {
  actionItems: ActionItem[]
  loading: boolean
  onComplete: (itemId: string, completedBy?: string) => void
  compact?: boolean
  tall?: boolean
}) {
  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 3600 * 24))
    
    if (diffDays < 0) return { text: `Overdue ${Math.abs(diffDays)}d`, isOverdue: true }
    if (diffDays === 0) return { text: 'Due today', isOverdue: false }
    if (diffDays === 1) return { text: 'Due tomorrow', isOverdue: false }
    return { text: `Due ${diffDays}d`, isOverdue: false }
  }

  if (loading) {
    return (
      <div className={`bg-white ${compact ? 'overflow-hidden shadow rounded-lg' : 'rounded-lg border border-gray-200'} ${compact ? 'p-5' : 'p-6'}`}>
        <div className="flex items-center mb-4">
          <ListTodo className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className={`${compact ? 'text-sm font-medium text-gray-500' : 'text-lg font-semibold text-gray-900'}`}>Briefing Follow-ups</h2>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-8 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (actionItems.length === 0) {
    return (
      <div className={`bg-white ${compact ? 'overflow-hidden shadow rounded-lg' : 'rounded-lg border border-gray-200'} ${compact ? 'p-5' : 'p-6'}`}>
        <div className="flex items-center mb-4">
          <ListTodo className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className={`${compact ? 'text-sm font-medium text-gray-500' : 'text-lg font-semibold text-gray-900'}`}>Briefing Follow-ups</h2>
          {!compact && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
              0
            </span>
          )}
        </div>
        {compact ? (
          <div className="text-center py-2">
            <p className="text-2xl font-semibold text-gray-900">0</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">All caught up! No pending follow-ups.</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`${tall ? 'h-full flex flex-col' : ''} ${compact ? 'p-5' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <ListTodo className="h-6 w-6 text-blue-400" />
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">
              Briefing Follow-ups
            </dt>
            <dd className="text-2xl font-semibold text-gray-900">
              {actionItems.length}
            </dd>
          </dl>
        </div>
      </div>
      
      {/* Checklist Items */}
      <div className={`space-y-3 ${tall ? 'flex-1 overflow-y-auto pr-1' : 'max-h-64 overflow-y-auto'}`}>
        {actionItems.slice(0, tall ? 15 : 6).map((item) => {
          const dueInfo = formatDueDate(item.dueDate)
          
          return (
            <div key={item.id} className="flex items-start space-x-3 group">
              {/* Checkbox */}
              <button
                onClick={() => onComplete(item.id)}
                className="flex-shrink-0 mt-0.5 w-5 h-5 border-2 border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center group-hover:border-blue-400"
                title="Complete this task"
              >
                <CheckCircle className="w-4 h-4 text-transparent group-hover:text-blue-500" />
              </button>
              
              {/* Task Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-tight">
                      {item.description}
                    </p>
                    
                    {/* Due date */}
                    {dueInfo && (
                      <span className={cn(
                        "inline-block mt-1 text-xs px-2 py-0.5 rounded-full",
                        dueInfo.isOverdue 
                          ? 'bg-red-100 text-red-700 font-medium' 
                          : 'bg-gray-100 text-gray-600'
                      )}>
                        {dueInfo.text}
                      </span>
                    )}
                    
                    {/* Briefing info */}
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="truncate">
                        {item.briefing.title}
                        {item.briefing.primaryAnalyst && (
                          <span className="ml-1">
                            • {item.briefing.primaryAnalyst.firstName} {item.briefing.primaryAnalyst.lastName}
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  {/* Priority indicator */}
                  {item.priority === 'HIGH' && (
                    <span className="flex-shrink-0 ml-2 mt-1 w-2 h-2 bg-red-500 rounded-full" title="High Priority"></span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Show more indicator */}
        {actionItems.length > (tall ? 15 : 6) && (
          <div className="text-center pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              +{actionItems.length - (tall ? 15 : 6)} more items
              {!tall && (
                <> • <a href="/briefings" className="text-blue-600 hover:text-blue-800">View all</a></>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
