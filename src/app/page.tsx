import { Users, Mail, FileText, TrendingUp, AlertTriangle, Heart, Activity, Calendar, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock real-time data
const mockStats = {
  totalAnalysts: 247,
  newslettersSent: 24,
  contentItems: 156,
  engagementRate: 78,
  activeAlerts: 8,
  briefingsThisMonth: 12,
  relationshipHealth: 85
}

const mockRecentActivity = [
  {
    type: 'analyst_added',
    message: 'Sarah Chen (Gartner) profile updated',
    time: '2 hours ago',
    icon: Users,
    color: 'text-blue-600'
  },
  {
    type: 'newsletter_sent',
    message: 'Q4 HR Tech Trends newsletter sent to 45 analysts',
    time: '4 hours ago',
    icon: Mail,
    color: 'text-green-600'
  },
  {
    type: 'briefing_completed',
    message: 'Michael Rodriguez briefing completed',
    time: '1 day ago',
    icon: Calendar,
    color: 'text-purple-600'
  },
  {
    type: 'alert_triggered',
    message: 'Communication overdue alert for 3 analysts',
    time: '2 days ago',
    icon: AlertTriangle,
    color: 'text-orange-600'
  }
]

const mockTopAnalysts = [
  {
    name: 'Sarah Chen',
    company: 'Gartner',
    influence: 95,
    lastContact: '2 days ago',
    health: 'EXCELLENT'
  },
  {
    name: 'Michael Rodriguez',
    company: 'Forrester',
    influence: 88,
    lastContact: '1 week ago',
    health: 'GOOD'
  },
  {
    name: 'Jennifer Kim',
    company: 'IDC',
    influence: 82,
    lastContact: '3 days ago',
    health: 'GOOD'
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

export default function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to your Enhanced HR Tech Analyst Portal
        </p>
        {mockStats.activeAlerts > 0 && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-orange-600 mr-2" />
              <p className="text-sm text-orange-800">
                You have {mockStats.activeAlerts} active alerts requiring attention
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
                      {mockStats.totalAnalysts}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      +12%
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
                      {mockStats.relationshipHealth}%
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      +5%
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
                      {mockStats.engagementRate}%
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      +3%
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
                      {mockStats.activeAlerts}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      +2
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <Users className="w-4 h-4 mr-2" />
                Add New Analyst
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Mail className="w-4 h-4 mr-2" />
                Create Newsletter
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <Calendar className="w-4 h-4 mr-2" />
                Schedule Briefing
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-2" />
                Upload Content
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activity
            </h3>
            <div className="space-y-4">
              {mockRecentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 p-1 rounded-full ${activity.color}`}>
                    <activity.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
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
              {mockTopAnalysts.map((analyst, index) => (
                <div key={index} className="flex items-center justify-between">
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
                        {analyst.health}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{analyst.lastContact}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
