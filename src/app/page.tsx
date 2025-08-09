'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSettings } from '@/contexts/SettingsContext'
import { Users, Mail, FileText, TrendingUp, AlertTriangle, Heart, Activity, Calendar, MessageSquare, Video, CheckCircle, X, ListTodo, Clock, UserCheck, Loader2, BookOpen, File } from 'lucide-react'
// import SocialMediaActivity from '@/components/features/social-media-activity'
import { cn } from '@/lib/utils'
import { getRandomBannerImagePath } from '@/lib/banner-utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { handleAbortError } from '@/lib/utils/abort-error-handler'

interface DashboardMetrics {
  totalAnalysts: number
  activeAnalysts: number
  analystsAddedPast90Days: number
  contentItemsPast90Days: number
  engagementRate: number
  briefingsPast90Days: number
  briefingsYTD: number
  briefingsPlanned: number
  briefingsDue: number
  briefingFollowUps: number
  newslettersYTD: number
  relationshipHealth: number
  upcomingPublications: number
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
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { settings, loading: settingsLoading } = useSettings()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [actionItems, setActionItems] = useState<ActionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionItemsLoading, setActionItemsLoading] = useState(true)
  const [bannerImage, setBannerImage] = useState<string>('')
  const [bannerError, setBannerError] = useState<boolean>(false)
  const [notification, setNotification] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)

  // Redirect unauthenticated users to /auth after auth resolves
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth')
    }
  }, [authLoading, user, router])

  const fetchDashboardData = async () => {
    let controller: AbortController | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Add timeout to prevent hanging requests
      controller = new AbortController();
      timeoutId = setTimeout(() => {
        if (controller) {
          console.log('⏰ Request timeout - aborting dashboard data fetch');
          controller.abort();
        }
      }, 15000); // Increased to 15 seconds
      
      // Use Promise.allSettled to handle failures gracefully
      const results = await Promise.allSettled([
        fetch('/api/dashboard/metrics', { signal: controller.signal }),
        fetch('/api/dashboard/recent-activity', { signal: controller.signal }),
        fetch('/api/action-items?status=pending', { signal: controller.signal })
      ]);

      // Clear timeout if all requests completed
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }

      // Process results with better error handling
      const [metricsResult, activityResult, actionItemsResult] = results;
      
      // Process metrics
      if (metricsResult.status === 'fulfilled' && metricsResult.value.ok) {
        try {
          const data = await metricsResult.value.json();
          const metricsData = data.data || data;
          setMetrics(metricsData);
          console.log('📊 Dashboard metrics loaded:', data.cached ? '(cached)' : '(fresh)');
        } catch (error) {
          console.error('Failed to parse metrics data:', error);
        }
      } else {
        console.error('Failed to fetch metrics:', metricsResult.status === 'rejected' ? metricsResult.reason : metricsResult.value?.status);
      }

      // Process activity
      if (activityResult.status === 'fulfilled' && activityResult.value.ok) {
        try {
          const data = await activityResult.value.json();
          const activityData = Array.isArray(data) ? data : (data.data || data);
          setRecentActivity(activityData);
          console.log('📈 Recent activity loaded:', data.cached ? '(cached)' : '(fresh)');
        } catch (error) {
          console.error('Failed to parse activity data:', error);
        }
      } else {
        console.error('Failed to fetch activity:', activityResult.status === 'rejected' ? activityResult.reason : activityResult.value?.status);
      }

      // Process action items
      if (actionItemsResult.status === 'fulfilled' && actionItemsResult.value.ok) {
        try {
          const data = await actionItemsResult.value.json();
          if (data.success) {
            setActionItems(data.data);
            console.log('✅ Action items loaded');
          }
        } catch (error) {
          console.error('Failed to parse action items data:', error);
        }
      } else {
        console.error('Failed to fetch action items:', actionItemsResult.status === 'rejected' ? actionItemsResult.reason : actionItemsResult.value?.status);
        // Set empty array for action items if they fail
        setActionItems([]);
      }
      
    } catch (error) {
      // Clear timeout if it exists
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('⏰ Request timeout - dashboard data fetch took too long');
        // Set default values for timeout
        setMetrics({
          totalAnalysts: 0,
          activeAnalysts: 0,
          analystsAddedPast90Days: 0,
          contentItemsPast90Days: 0,
          engagementRate: 0,
          briefingsPast90Days: 0,
          briefingsYTD: 0,
          briefingsPlanned: 0,
          briefingsDue: 0,
          briefingFollowUps: 0,
          newslettersYTD: 0,
          relationshipHealth: 0,
          upcomingPublications: 0,
          recentContentItems: [],
          newAnalysts: []
        });
        setRecentActivity([]);
        setActionItems([]);
      } else {
        console.error('❌ Error fetching dashboard data:', error);
      }
    } finally {
      setLoading(false);
      setActionItemsLoading(false);
    }
  }



  useEffect(() => {
    // Set banner image for admin dashboard
    const adminBanner = sessionStorage.getItem('adminBannerImage')
    if (!adminBanner) {
      const newBanner = getRandomBannerImagePath()
      sessionStorage.setItem('adminBannerImage', newBanner)
      setBannerImage(newBanner)
    } else {
      setBannerImage(adminBanner)
    }

    // Check for URL parameters for newsletters
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

    // Create a flag to track if component is still mounted
    let isMounted = true;
    
    const loadDashboardData = async () => {
      if (isMounted) {
        await fetchDashboardData();
      }
    };
    
    loadDashboardData();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [searchParams])

  // Test if banner image loads successfully
  useEffect(() => {
    if (bannerImage) {
      const img = new Image()
      img.onload = () => {
        setBannerError(false)
        console.log('Banner image loaded successfully:', bannerImage)
      }
      img.onerror = () => {
        setBannerError(true)
        console.error('Banner image failed to load:', bannerImage)
      }
      img.src = bannerImage
    }
  }, [bannerImage])

  const handleCompleteActionItem = async (itemId: string, completedBy?: string) => {
    // Get the user's display name for completed by field
    const getUserName = () => {
      if (completedBy) return completedBy
      if (user?.name) {
        return user.name
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
        try {
          const actionItemsRes = await fetch('/api/action-items?status=pending')
          if (actionItemsRes.ok) {
            const actionItemsData = await actionItemsRes.json()
            if (actionItemsData.success) {
              setActionItems(actionItemsData.data)
            }
          }
        } catch (refreshError) {
          handleAbortError(refreshError, 'Action items refresh');
        }
      }
    } catch (error) {
      handleAbortError(error, 'Action item completion');
    }
  }

  if (loading || settingsLoading || authLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {authLoading ? 'Loading authentication...' : 
             settingsLoading ? 'Loading your workspace...' : 'Loading dashboard...'}
          </p>
          {settingsLoading && (
            <p className="text-sm text-gray-500 mt-2">This may take a few moments...</p>
          )}
        </div>
      </div>
    )
  }

  // Create banner style with image or gradient fallback
  const bannerStyle = bannerImage && !bannerError
    ? { 
        backgroundImage: `url(${bannerImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : { 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }

  return (
    <div>
      {/* Dashboard Content */}
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Overview</h1>

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
        </div>

        {/* Band 1: Analysts */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            Analysts
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Analysts */}
            <Card
              title={recentActivity.length === 0 ? "No recent updates in the last 90 days" : "Recent analyst updates (last 90 days)"}
            >
              <CardContent className="p-5">
                <div className="flex items-center mb-0">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Analysts
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {metrics?.totalAnalysts || 0}
                        </dd>
                      </dl>
                      <TotalAnalystsNewlyAdded newAnalysts={metrics?.newAnalysts || []} router={router} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage % */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <div className="flex items-start justify-between">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Coverage %
                        </dt>
                        <dd className="text-2xl font-semibold text-gray-900">
                          {metrics?.engagementRate ? `${metrics.engagementRate}%` : '0%'}
                        </dd>
                      </dl>
                      <CoverageSparkline />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Publications */}
            <Card
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push('/publications?filter=upcoming')}
            >
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BookOpen className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Upcoming Publications (180 days)
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {metrics?.upcomingPublications || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

        {/* Band 2: Briefings */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Calendar className="h-5 w-5 text-blue-600 mr-2" />
            Briefings
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Briefings YTD */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Briefings (YTD)
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {metrics?.briefingsYTD || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Newsletters YTD */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Newsletters (YTD)
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {metrics?.newslettersYTD || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Briefing Follow Ups - spans 2 rows */}
            <Card className="lg:row-span-2">
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <MessageSquare className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Follow Ups
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {metrics?.briefingFollowUps || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Briefings Due */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Briefings Due
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {metrics?.briefingsDue || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Briefings Planned */}
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Briefings Planned
                      </dt>
                      <dd className="text-2xl font-semibold text-gray-900">
                        {metrics?.briefingsPlanned || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Social Media Activity section temporarily disabled */}
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

// CoverageSparkline Component
function CoverageSparkline() {
  // Mock data for sparkline - this will be replaced with real historical data
  const mockData = [45, 52, 48, 61, 55, 67, 73, 69, 76, 82, 78, 85, 88, 84, 92, 87, 94, 91, 96, 93]
  
  const maxValue = Math.max(...mockData)
  const minValue = Math.min(...mockData)
  const range = maxValue - minValue || 1

  // Create SVG path for sparkline
  const pathData = mockData.map((value, index) => {
    const x = (index / (mockData.length - 1)) * 100
    const y = 100 - ((value - minValue) / range) * 100
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Trend (Last 20 periods)</span>
        <span className="text-xs text-green-600 font-medium">↗ +8.2%</span>
      </div>
      <div className="mt-1">
        <svg
          width="120"
          height="20"
          viewBox="0 0 100 100"
          className="text-green-500"
          preserveAspectRatio="none"
        >
          <path
            d={pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* Add gradient fill under the line */}
          <defs>
            <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path
            d={`${pathData} L 100 100 L 0 100 Z`}
            fill="url(#sparklineGradient)"
          />
        </svg>
      </div>
    </div>
  )
}

// TotalAnalystsNewlyAdded Component  
function TotalAnalystsNewlyAdded({ newAnalysts, router }: { newAnalysts: NewAnalyst[]; router: any }) {
  
  const handleClick = () => {
    // Navigate to analysts page with filter for recently added
    router.push('/analysts?filter=recent')
  }

  if (newAnalysts.length === 0) {
    return null
  }

  return (
    <div className="text-right">
      <button
        onClick={handleClick}
        className="text-right transition-colors cursor-pointer hover:opacity-80"
        title="View analysts added in the past 30 days"
      >
        <div className="text-xs text-gray-400">
          Newly Added (30 days)
        </div>
        <div className="text-lg font-semibold text-gray-900 mt-1">
          {newAnalysts.length}
        </div>
      </button>
    </div>
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

  // Create tooltip content
  const tooltipContent = newAnalysts.length === 0 
    ? "No new analysts added in the last 90 days"
    : `Recent additions (last 90 days):\n${newAnalysts.slice(0, 8).map(analyst => 
        `${analyst.firstName} ${analyst.lastName}${analyst.company ? ` • ${analyst.company}` : ''} (${formatDate(analyst.createdAt)})`
      ).join('\n')}${newAnalysts.length > 8 ? `\n+${newAnalysts.length - 8} more` : ''}`

  return (
    <div 
      className="cursor-help hover:shadow-md transition-shadow"
      title={tooltipContent}
      tabIndex={0}
      role="button"
      aria-label="Show newly added analysts"
    >
      <div className="flex items-center justify-between">
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
      case 'publication':
      case 'research_report':
        return <BookOpen className="w-4 h-4 text-indigo-500" />
      case 'blog_post':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'whitepaper':
        return <File className="w-4 h-4 text-green-600" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string | undefined | null) => {
    if (!status) return 'bg-gray-100 text-gray-800'
    
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
    <div>
      <div className="flex items-center justify-between">
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
        <div className="flex items-center">
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
      <div className={`bg-white ${compact ? 'overflow-hidden shadow rounded-lg' : 'rounded-lg '} ${compact ? 'p-5' : 'p-6'}`}>
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
                        {item.briefing?.title || 'No briefing title'}
                        {item.briefing?.primaryAnalyst && (
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
