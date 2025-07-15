'use client'

import { useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Mail,
  Calendar,
  AlertTriangle,
  Heart,
  Star,
  Activity,
  Award,
  MessageSquare,
  FileText,
  Clock,
  Target,
  BarChart3,
  PieChart,
  Filter,
  Download
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data for analytics
const mockMetrics = {
  totalAnalysts: 247,
  activeRelationships: 189,
  communicationHealth: 78, // percentage
  averageInfluenceScore: 68,
  totalInteractions: 1247,
  newslettersSent: 24,
  briefingsCompleted: 86,
  alertsActive: 12
}

const mockRelationshipHealth = [
  { status: 'EXCELLENT', count: 45, percentage: 24 },
  { status: 'GOOD', count: 89, percentage: 47 },
  { status: 'FAIR', count: 35, percentage: 19 },
  { status: 'POOR', count: 15, percentage: 8 },
  { status: 'CRITICAL', count: 5, percentage: 3 }
]

const mockInfluenceDistribution = [
  { range: '80-100', count: 42, label: 'Very High' },
  { range: '60-79', count: 78, label: 'High' },
  { range: '40-59', count: 89, label: 'Medium' },
  { range: '20-39', count: 32, label: 'Low' },
  { range: '0-19', count: 6, label: 'Very Low' }
]

const mockCommunicationTrends = [
  { month: 'Jul', interactions: 145, newsletters: 3, briefings: 12 },
  { month: 'Aug', interactions: 167, newsletters: 2, briefings: 15 },
  { month: 'Sep', interactions: 198, newsletters: 4, briefings: 18 },
  { month: 'Oct', interactions: 234, newsletters: 3, briefings: 22 },
  { month: 'Nov', interactions: 189, newsletters: 2, briefings: 19 }
]

const mockTopAnalysts = [
  {
    id: '1',
    name: 'Sarah Chen',
    company: 'Gartner',
    influenceScore: 95,
    interactions: 24,
    lastContact: '2024-10-15',
    health: 'EXCELLENT'
  },
  {
    id: '2',
    name: 'Michael Rodriguez',
    company: 'Forrester',
    influenceScore: 88,
    interactions: 18,
    lastContact: '2024-10-12',
    health: 'GOOD'
  },
  {
    id: '3',
    name: 'Jennifer Kim',
    company: 'IDC',
    influenceScore: 82,
    interactions: 15,
    lastContact: '2024-10-10',
    health: 'GOOD'
  },
  {
    id: '4',
    name: 'David Thompson',
    company: 'Bersin & Associates',
    influenceScore: 79,
    interactions: 12,
    lastContact: '2024-10-08',
    health: 'FAIR'
  }
]

const mockAlerts = [
  {
    type: 'COMMUNICATION_OVERDUE',
    count: 8,
    description: 'Analysts with overdue communications'
  },
  {
    type: 'BRIEFING_DUE',
    count: 5,
    description: 'Quarterly briefings due'
  },
  {
    type: 'RELATIONSHIP_HEALTH',
    count: 3,
    description: 'Relationships requiring attention'
  },
  {
    type: 'SOCIAL_MENTION',
    count: 12,
    description: 'New social media mentions'
  }
]

const mockContentPerformance = [
  {
    title: 'Q3 HR Tech Trends Report',
    type: 'Newsletter',
    opens: 156,
    clicks: 89,
    engagement: 57,
    date: '2024-10-01'
  },
  {
    title: 'AI in the Workplace Webinar',
    type: 'Content',
    views: 234,
    downloads: 145,
    engagement: 62,
    date: '2024-09-28'
  },
  {
    title: 'Employee Experience Guide',
    type: 'Whitepaper',
    downloads: 89,
    shares: 34,
    engagement: 38,
    date: '2024-09-25'
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

function getHealthBarColor(health: string) {
  switch (health) {
    case 'EXCELLENT':
      return 'bg-green-500'
    case 'GOOD':
      return 'bg-blue-500'
    case 'FAIR':
      return 'bg-yellow-500'
    case 'POOR':
      return 'bg-orange-500'
    case 'CRITICAL':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

export default function AnalyticsPage() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('last-3-months')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Intelligence and insights for analyst relationship management
        </p>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <select
            value={selectedTimeframe}
            onChange={(e) => setSelectedTimeframe(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="last-month">Last Month</option>
            <option value="last-3-months">Last 3 Months</option>
            <option value="last-6-months">Last 6 Months</option>
            <option value="last-year">Last Year</option>
          </select>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                      {mockMetrics.totalAnalysts}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="sr-only">Increased by</span>
                      12%
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
                    Communication Health
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {mockMetrics.communicationHealth}%
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      5%
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
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Influence Score
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {mockMetrics.averageInfluenceScore}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      3pts
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
                      {mockMetrics.alertsActive}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-red-600">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      2
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Relationship Health Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Relationship Health Distribution</h3>
          <div className="space-y-4">
            {mockRelationshipHealth.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-sm font-medium text-gray-700">
                  {item.status}
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className={cn('h-3 rounded-full', getHealthBarColor(item.status))}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
                  {item.count} ({item.percentage}%)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Influence Score Distribution */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Influence Score Distribution</h3>
          <div className="space-y-4">
            {mockInfluenceDistribution.map((item, index) => (
              <div key={index} className="flex items-center">
                <div className="w-20 text-sm font-medium text-gray-700">
                  {item.range}
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full bg-purple-500"
                      style={{ width: `${(item.count / mockMetrics.totalAnalysts) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-16 text-sm text-gray-600 text-right">
                  {item.count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Communication Trends */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Trends</h3>
        <div className="grid grid-cols-5 gap-4">
          {mockCommunicationTrends.map((month, index) => (
            <div key={index} className="text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">{month.month}</div>
              <div className="space-y-2">
                <div className="flex flex-col items-center">
                  <div className="w-full bg-blue-200 rounded h-20 flex items-end justify-center">
                    <div
                      className="bg-blue-600 rounded-b w-8"
                      style={{
                        height: `${Math.max((month.interactions / 250) * 100, 10)}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-600 mt-1">
                    {month.interactions} interactions
                  </span>
                </div>
                <div className="flex justify-center space-x-2 text-xs">
                  <span className="text-green-600">{month.newsletters} newsletters</span>
                  <span className="text-purple-600">{month.briefings} briefings</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row - Tables and Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Analysts */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Performing Analysts</h3>
          <div className="space-y-4">
            {mockTopAnalysts.map((analyst, index) => (
              <div key={analyst.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {analyst.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{analyst.name}</p>
                    <p className="text-xs text-gray-500">{analyst.company}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{analyst.influenceScore}/100</p>
                    <p className="text-xs text-gray-500">{analyst.interactions} interactions</p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                    getHealthColor(analyst.health)
                  )}>
                    {analyst.health}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active Alerts Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Active Alerts</h3>
          <div className="space-y-4">
            {mockAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{alert.description}</p>
                    <p className="text-xs text-gray-500">{alert.type.replace('_', ' ').toLowerCase()}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-semibold text-orange-600">{alert.count}</span>
                  <button className="text-blue-600 hover:text-blue-800 text-sm">
                    View →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content Performance */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Content Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockContentPerformance.map((content, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{content.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {content.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${content.engagement}%` }}
                        ></div>
                      </div>
                      <span>{content.engagement}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {content.type === 'Newsletter' ? (
                      <div>
                        <div>{content.opens} opens</div>
                        <div>{content.clicks} clicks</div>
                      </div>
                    ) : content.type === 'Content' ? (
                      <div>
                        <div>{content.views} views</div>
                        <div>{content.downloads} downloads</div>
                      </div>
                    ) : (
                      <div>
                        <div>{content.downloads} downloads</div>
                        <div>{content.shares} shares</div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(content.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
