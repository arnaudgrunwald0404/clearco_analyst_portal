'use client'

import { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  User,
  Book,
  Video,
  Download,
  FileText,
  Calendar,
  MessageSquare,
  Users,
  TrendingUp,
  Star,
  Clock,
  Award,
  Target,
  Lightbulb,
  Shield,
  Globe,
  Zap,
  ArrowRight,
  Play,
  ExternalLink,
  Bell,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock data for the analyst portal
const mockAnalystUser = {
  id: '1',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@gartner.com',
  company: 'Gartner',
  title: 'Vice President Analyst',
  expertiseAreas: ['HR Technology', 'Talent Management', 'Employee Experience'],
  lastLogin: '2024-10-20T10:00:00Z',
  accessLevel: 'TIER1'
}

const mockCompanyVision = [
  {
    type: 'MISSION',
    title: 'Our Mission',
    content: 'To revolutionize the workplace by creating intelligent, human-centric technology solutions that empower organizations to build thriving, engaged workforces.',
    icon: Target
  },
  {
    type: 'VALUES',
    title: 'Core Values',
    content: 'Innovation through empathy, transparent communication, continuous learning, and sustainable growth that benefits both people and organizations.',
    icon: Star
  },
  {
    type: 'STRATEGY',
    title: 'Strategic Vision',
    content: 'Leading the future of work through AI-powered insights, predictive analytics, and seamless integration platforms that scale with organizational needs.',
    icon: TrendingUp
  }
]

const mockExclusiveContent = [
  {
    id: '1',
    title: 'Q4 2024 Product Roadmap Deep Dive',
    description: 'Exclusive preview of upcoming features, AI capabilities, and platform enhancements',
    type: 'VIDEO',
    duration: '45 min',
    publishedAt: '2024-10-15',
    accessLevel: 'TIER1',
    viewCount: 23,
    isNew: true
  },
  {
    id: '2',
    title: 'Market Research: Future of HR Tech 2025',
    description: 'Proprietary research findings and market intelligence report',
    type: 'REPORT',
    pages: '89 pages',
    publishedAt: '2024-10-10',
    accessLevel: 'ALL',
    downloadCount: 156,
    isNew: false
  },
  {
    id: '3',
    title: 'Beta Access: AI-Powered Analytics Suite',
    description: 'Early access to our next-generation analytics platform',
    type: 'DEMO',
    duration: 'Interactive',
    publishedAt: '2024-10-05',
    accessLevel: 'TIER1',
    viewCount: 12,
    isNew: true
  },
  {
    id: '4',
    title: 'Executive Interview Series: Future Workplace Trends',
    description: 'Candid conversations with our leadership team about industry evolution',
    type: 'VIDEO',
    duration: '30 min',
    publishedAt: '2024-09-28',
    accessLevel: 'ALL',
    viewCount: 67,
    isNew: false
  }
]

const mockPersonalizedContent = [
  {
    title: 'HR Technology Trends You Should Know',
    reason: 'Based on your expertise in HR Technology',
    type: 'Article',
    readTime: '8 min'
  },
  {
    title: 'Talent Management Platform Comparison',
    reason: 'Matches your recent publication themes',
    type: 'Research',
    readTime: '15 min'
  },
  {
    title: 'Employee Experience Metrics Workshop',
    reason: 'Relevant to your speaking engagement topics',
    type: 'Video',
    readTime: '25 min'
  }
]

const mockUpcomingEvents = [
  {
    title: 'Q4 Strategy Briefing',
    date: '2024-11-15',
    time: '2:00 PM EST',
    type: 'Virtual Meeting',
    attendees: 8
  },
  {
    title: 'Product Demo: Analytics Suite',
    date: '2024-11-20',
    time: '10:00 AM EST',
    type: 'Product Demo',
    attendees: 12
  },
  {
    title: 'Industry Roundtable Discussion',
    date: '2024-11-25',
    time: '1:00 PM EST',
    type: 'Panel Discussion',
    attendees: 25
  }
]

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function getContentIcon(type: string) {
  switch (type) {
    case 'VIDEO':
      return Video
    case 'REPORT':
      return FileText
    case 'DEMO':
      return Play
    case 'WEBINAR':
      return Calendar
    default:
      return Book
  }
}

export default function AnalystPortalPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [activeSection, setActiveSection] = useState('overview')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // Mock login - in real app, this would authenticate with backend
    if (loginForm.email && loginForm.password) {
      setIsLoggedIn(true)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-600">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Analyst Portal Access
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Exclusive access for industry analysts
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Email address"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                />
              </div>
              <div className="relative">
                <label htmlFor="password" className="sr-only">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <Lock className="h-4 w-4 text-blue-500 group-hover:text-blue-400" />
                </span>
                Access Portal
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Don't have access? Contact your relationship manager
              </p>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-600 rounded flex items-center justify-center">
                  <Shield className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Analyst Portal</h1>
                <p className="text-sm text-gray-500">Exclusive content and insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Bell className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-white">
                    {mockAnalystUser.firstName.charAt(0)}{mockAnalystUser.lastName.charAt(0)}
                  </span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{mockAnalystUser.firstName} {mockAnalystUser.lastName}</p>
                  <p className="text-gray-500">{mockAnalystUser.company}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: Globe },
              { id: 'vision', name: 'Company Vision', icon: Target },
              { id: 'content', name: 'Exclusive Content', icon: Book },
              { id: 'roadmap', name: 'Roadmap', icon: TrendingUp },
              { id: 'resources', name: 'Resources', icon: FileText }
            ].map((item) => {
              const isActive = activeSection === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={cn(
                    'flex items-center py-4 px-1 border-b-2 font-medium text-sm',
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <item.icon className="w-4 h-4 mr-2" />
                  {item.name}
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeSection === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-xl overflow-hidden">
              <div className="px-8 py-12 text-white">
                <h2 className="text-3xl font-bold mb-4">
                  Welcome back, {mockAnalystUser.firstName}!
                </h2>
                <p className="text-blue-100 text-lg mb-6">
                  Your personalized hub for exclusive insights, early access content, and strategic intelligence.
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Last login: {formatDate(mockAnalystUser.lastLogin)}
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-2" />
                    Access Level: {mockAnalystUser.accessLevel}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">New Content</p>
                    <p className="text-2xl font-semibold text-gray-900">4</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Upcoming Events</p>
                    <p className="text-2xl font-semibold text-gray-900">3</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Connections</p>
                    <p className="text-2xl font-semibold text-gray-900">12</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personalized Recommendations */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recommended for You</h3>
                <p className="text-sm text-gray-500">Based on your expertise and recent activity</p>
              </div>
              <div className="p-6 space-y-4">
                {mockPersonalizedContent.map((content, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{content.title}</h4>
                      <p className="text-sm text-gray-500">{content.reason}</p>
                      <div className="flex items-center mt-2 text-xs text-gray-400">
                        <span>{content.type}</span>
                        <span className="mx-2">•</span>
                        <span>{content.readTime}</span>
                      </div>
                    </div>
                    <button className="flex items-center text-blue-600 hover:text-blue-800">
                      <span className="text-sm">View</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Upcoming Events</h3>
              </div>
              <div className="p-6 space-y-4">
                {mockUpcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      <p className="text-sm text-gray-500">{event.type}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-400">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{formatDate(event.date)} at {event.time}</span>
                        <span className="ml-4 flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.attendees} attendees
                        </span>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                      Join
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeSection === 'vision' && (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Discover our mission, values, and strategic direction as we shape the future of work together.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {mockCompanyVision.map((item, index) => (
                <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-8">
                    <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-6">
                      <item.icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeSection === 'content' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Exclusive Content</h2>
                <p className="text-gray-600 mt-2">Early access to research, insights, and product updates</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search content..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockExclusiveContent.map((content) => {
                const IconComponent = getContentIcon(content.type)
                return (
                  <div key={content.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <IconComponent className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{content.title}</h3>
                            {content.isNew && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                New
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{content.description}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                        <div className="flex items-center space-x-4">
                          <span>Published {formatDate(content.publishedAt)}</span>
                          <span>{content.duration || content.pages}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4" />
                          <span>{content.viewCount || content.downloadCount}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          content.accessLevel === 'TIER1' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-gray-100 text-gray-800'
                        )}>
                          {content.accessLevel === 'TIER1' ? 'Tier 1 Access' : 'All Access'}
                        </span>
                        <button className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700">
                          {content.type === 'REPORT' ? (
                            <>
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </>
                          ) : (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              View
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Other sections would be implemented similarly */}
      </div>
    </div>
  )
}
