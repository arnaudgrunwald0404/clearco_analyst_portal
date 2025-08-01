'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Calendar,
  FileText,
  MessageSquare,
  Newspaper,
  Users,
  Clock,
  TrendingUp,
  Award,
  ExternalLink,
  ArrowRight,
  Briefcase,
  Star
} from 'lucide-react'

interface DashboardStats {
  upcomingBriefings: number
  completedBriefings: number
  totalPublications: number
  recentTestimonials: number
}

interface RecentActivity {
  id: string
  type: 'briefing' | 'publication' | 'testimonial' | 'news'
  title: string
  date: string
  description: string
}

export default function PortalPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    upcomingBriefings: 3,
    completedBriefings: 12,
    totalPublications: 8,
    recentTestimonials: 5
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading data
    const loadDashboardData = async () => {
      setLoading(true)
      
      // Mock recent activity data
      const mockActivity: RecentActivity[] = [
        {
          id: '1',
          type: 'briefing',
          title: 'Q4 Product Roadmap Review',
          date: '2024-11-15',
          description: 'Scheduled for next week with key stakeholders'
        },
        {
          id: '2',
          type: 'publication',
          title: 'AI in HR: Market Analysis 2025',
          date: '2024-11-10',
          description: 'Published in Industry Insights'
        },
        {
          id: '3',
          type: 'testimonial',
          title: 'Customer Success Story',
          date: '2024-11-08',
          description: 'Featured in latest case study'
        },
        {
          id: '4',
          type: 'news',
          title: 'Platform Update v3.2',
          date: '2024-11-05',
          description: 'New features and improvements released'
        }
      ]
      
      setRecentActivity(mockActivity)
      setLoading(false)
    }

    loadDashboardData()
  }, [])

  const navigationCards = [
    {
      title: 'Briefings',
      description: 'Manage upcoming and past analyst briefings',
      icon: Calendar,
      href: '/portal/briefings',
      color: 'bg-blue-500',
      stats: `${stats.upcomingBriefings} upcoming`
    },
    {
      title: 'Content Library',
      description: 'Access exclusive reports, videos, and resources',
      icon: FileText,
      href: '/portal/content',
      color: 'bg-green-500',
      stats: `${stats.totalPublications} items`
    },
    {
      title: 'Testimonials',
      description: 'Read peer testimonials and success stories',
      icon: MessageSquare,
      href: '/portal/testimonials',
      color: 'bg-purple-500',
      stats: `${stats.recentTestimonials} recent`
    },
    {
      title: 'Latest News',
      description: 'Stay updated with industry insights',
      icon: Newspaper,
      href: '/portal/news',
      color: 'bg-orange-500',
      stats: 'Daily updates'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'briefing': return Calendar
      case 'publication': return FileText
      case 'testimonial': return MessageSquare
      case 'news': return Newspaper
      default: return Clock
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'briefing': return 'text-blue-600 bg-blue-50'
      case 'publication': return 'text-green-600 bg-green-50'
      case 'testimonial': return 'text-purple-600 bg-purple-50'
      case 'news': return 'text-orange-600 bg-orange-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {user?.name || 'Analyst'}!
            </h1>
            <p className="text-blue-100 text-lg">
              Here's what's happening in your analyst portal today
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{stats.upcomingBriefings}</div>
            <div className="text-blue-100">Upcoming Briefings</div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.completedBriefings}</div>
              <div className="text-sm text-gray-600">Completed Briefings</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.totalPublications}</div>
              <div className="text-sm text-gray-600">Publications</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Star className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">{stats.recentTestimonials}</div>
              <div className="text-sm text-gray-600">Testimonials</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <div className="text-2xl font-bold text-gray-900">98%</div>
              <div className="text-sm text-gray-600">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {navigationCards.map((card) => {
            const IconComponent = card.icon
            return (
              <div
                key={card.title}
                onClick={() => router.push(card.href)}
                className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.color}`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{card.description}</p>
                <div className="text-xs text-gray-500 font-medium">{card.stats}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const ActivityIcon = getActivityIcon(activity.type)
              return (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                    <ActivityIcon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                    <div className="text-xs text-gray-500">{activity.description}</div>
                    <div className="text-xs text-gray-400 mt-1">{activity.date}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Q4 Product Roadmap Review</div>
                <div className="text-xs text-gray-600">Nov 15, 2024 • 2:00 PM EST</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">AI in HR Webinar</div>
                <div className="text-xs text-gray-600">Nov 20, 2024 • 1:00 PM EST</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-purple-600" />
              <div>
                <div className="text-sm font-medium text-gray-900">Customer Success Story</div>
                <div className="text-xs text-gray-600">Nov 25, 2024 • 3:00 PM EST</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Calendar className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Schedule Briefing</span>
          </button>
          <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <FileText className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Request Content</span>
          </button>
          <button className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <MessageSquare className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  )
}
