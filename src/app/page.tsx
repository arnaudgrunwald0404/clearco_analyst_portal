'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Users, Mail, FileText, TrendingUp, AlertTriangle, Heart, Activity, Calendar, Award, MessageSquare, Video, CheckCircle, X, ListTodo, Clock, UserCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import SocialMediaActivity from '@/components/social-media-activity'

interface DashboardMetrics {
  totalAnalysts: number
  activeAnalysts: number
  newslettersSent: number
  contentItems: number
  engagementRate: number
  activeAlerts: number
  briefingsThisMonth: number
  relationshipHealth: number
}

interface TopAnalyst {
  id: string
  name: string
  company: string
  influence: number
  lastContact: string
  health: string
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

export default function Dashboard() {
  const searchParams = useSearchParams()
  const { user, profile } = useAuth()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [topAnalysts, setTopAnalysts] = useState<TopAnalyst[]>([])
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionItemsLoading, setActionItemsLoading] = useState(true)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

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

    const fetchDashboardData = async () => {
      try {
        const [metricsRes, analystsRes, activityRes, actionItemsRes] = await Promise.all([
          fetch('/api/dashboard/metrics'),
          fetch('/api/dashboard/top-analysts'),
          fetch('/api/dashboard/recent-activity'),
          fetch('/api/action-items?status=pending')
        ])

        if (metricsRes.ok) {
          const metricsData = await metricsRes.json()
          setMetrics(metricsData)
        }

        if (analystsRes.ok) {
          const analystsData = await analystsRes.json()
          setTopAnalysts(analystsData)
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

    fetchDashboardData()
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
          Welcome to your Enhanced HR Tech Analyst Portal
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

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Analysts
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.totalAnalysts || 0}
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      {metrics?.activeAnalysts || 0} active
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Heart className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Relationship Health
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.relationshipHealth || 0}%
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      weighted avg
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Engagement Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.engagementRate || 0}%
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      last 30 days
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

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
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {metrics?.activeAlerts || 0}
                    </div>
                    <div className="ml-2 text-xs text-gray-500">
                      requiring attention
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics?.newslettersSent || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Content Items
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics?.contentItems || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Briefings This Month
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {metrics?.briefingsThisMonth || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No recent activity</p>
                  <p className="text-xs text-gray-400">Activity will appear here as you interact with analysts</p>
                </div>
              ) : (
                recentActivity.map((activity, index) => {
                  const IconComponent = iconMap[activity.icon] || Activity
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-1 rounded-full ${activity.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                        <IconComponent className={`w-4 h-4 ${activity.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Top Analysts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Top Analysts
            </h3>
            <div className="space-y-4">
              {topAnalysts.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No analysts found</p>
                  <p className="text-xs text-gray-400">Add analysts to see top performers here</p>
                </div>
              ) : (
                topAnalysts.map((analyst, index) => (
                  <div key={analyst.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-blue-800">
                          {analyst.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{analyst.name}</p>
                        <p className="text-xs text-gray-500">{analyst.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">{analyst.influence}</span>
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          getHealthColor(analyst.health)
                        )}>
                          {analyst.health.charAt(0) + analyst.health.slice(1).toLowerCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{analyst.lastContact}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Social Media Activity */}
        <div className="xl:col-span-1">
          <SocialMediaActivity />
        </div>
      </div>

      {/* Briefing Follow-ups Widget */}
      <div>
        <ActionItemsWidget 
          actionItems={actionItems}
          loading={actionItemsLoading}
          onComplete={handleCompleteActionItem}
        />
      </div>
    </div>
  )
}

// ActionItemsWidget Component
function ActionItemsWidget({ 
  actionItems, 
  loading, 
  onComplete 
}: {
  actionItems: ActionItem[]
  loading: boolean
  onComplete: (itemId: string, completedBy: string) => void
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
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <ListTodo className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Briefing Follow-ups</h2>
        </div>
        <div className="animate-pulse space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-10 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (actionItems.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <ListTodo className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Briefing Follow-ups</h2>
          <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
            0
          </span>
        </div>
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">All caught up! No pending follow-ups.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ListTodo className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Briefing Follow-ups</h2>
          <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
            {actionItems.length}
          </span>
        </div>
        <p className="text-sm text-gray-600">Track and complete follow-up tasks from briefings</p>
      </div>
      
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {actionItems.slice(0, 12).map((item) => {
          const dueInfo = formatDueDate(item.dueDate)
          
          return (
            <div key={item.id} className="flex items-center space-x-3 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <button
                onClick={() => onComplete(item.id)}
                className="flex-shrink-0 w-4 h-4 border-2 border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center"
              >
                <CheckCircle className="w-3 h-3 text-transparent hover:text-blue-500" />
              </button>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.description}
                    {dueInfo && (
                      <span className={cn(
                        "ml-2 text-xs",
                        dueInfo.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                      )}>
                        ({dueInfo.text})
                      </span>
                    )}
                  </p>
                  
                  {item.priority === 'HIGH' && (
                    <span className="flex-shrink-0 ml-2 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </div>
                
                <div className="flex items-center text-xs text-gray-500 mt-0.5">
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
            </div>
          )
        })}
        
        {actionItems.length > 12 && (
          <div className="text-center pt-2">
            <p className="text-sm text-gray-500">
              Showing 12 of {actionItems.length} items • <a href="/briefings" className="text-blue-600 hover:text-blue-800">View all</a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
