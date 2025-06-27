'use client'

import { useState } from 'react'
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
  Briefcase
} from 'lucide-react'
import { cn } from '@/lib/utils'

// This would normally come from your database based on the ID
const mockAnalyst = {
  id: '1',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@gartner.com',
  company: 'Gartner',
  title: 'Vice President Analyst',
  phone: '+1-555-0123',
  linkedIn: 'https://linkedin.com/in/sarahchen',
  twitter: '@sarahchen_hr',
  website: 'https://gartner.com/sarah-chen',
  bio: 'Leading HR Technology analyst with 15+ years of experience in the industry. Specializes in talent management, employee experience, and workforce analytics.',
  profileImageUrl: null,
  influenceScore: 85,
  lastContactDate: '2024-10-15T10:00:00Z',
  nextContactDate: '2024-11-15T10:00:00Z',
  communicationCadence: 30,
  relationshipHealth: 'GOOD',
  expertise: ['HR Technology', 'Talent Management', 'Employee Experience'],
  recentSocialSummary: 'Recently discussing AI impact on HR, future of work trends, and employee engagement strategies. Active in conversations about hybrid work policies.',
  socialSummaryUpdatedAt: '2024-10-20T00:00:00Z',
  keyThemes: ['AI in HR', 'Future of Work', 'Employee Engagement', 'Hybrid Work'],
  upcomingPublications: [
    {
      title: 'The Future of HR Technology 2025',
      type: 'Research Report',
      expectedDate: '2024-12-01'
    },
    {
      title: 'AI and the Workplace Webinar',
      type: 'Webinar',
      expectedDate: '2024-11-15'
    }
  ],
  recentPublications: [
    {
      title: 'Employee Experience Trends Q3 2024',
      type: 'Blog Post',
      publishedDate: '2024-10-10',
      url: 'https://example.com/blog/employee-experience-trends'
    },
    {
      title: 'HR Tech Market Analysis',
      type: 'Research Report',
      publishedDate: '2024-09-25',
      url: 'https://example.com/research/hr-tech-market'
    }
  ],
  speakingEngagements: [
    {
      event: 'HR Tech Conference 2024',
      date: '2024-11-20',
      topic: 'The AI Revolution in HR'
    }
  ],
  status: 'ACTIVE',
  influence: 'VERY_HIGH'
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

  const tabs = [
    { id: 'overview', name: 'Overview', icon: User },
    { id: 'intelligence', name: 'Intelligence', icon: TrendingUp },
    { id: 'communications', name: 'Communications', icon: MessageSquare },
    { id: 'briefings', name: 'Briefings', icon: Calendar },
    { id: 'content', name: 'Content', icon: FileText },
    { id: 'alerts', name: 'Alerts', icon: AlertTriangle }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {mockAnalyst.profileImageUrl ? (
                  <img 
                    className="h-20 w-20 rounded-full" 
                    src={mockAnalyst.profileImageUrl} 
                    alt={`${mockAnalyst.firstName} ${mockAnalyst.lastName}`} 
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-2xl font-medium text-white">
                      {mockAnalyst.firstName.charAt(0)}{mockAnalyst.lastName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {mockAnalyst.firstName} {mockAnalyst.lastName}
                </h1>
                <p className="text-lg text-gray-600">{mockAnalyst.title}</p>
                <p className="text-md text-gray-500">{mockAnalyst.company}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getHealthColor(mockAnalyst.relationshipHealth)
                  )}>
                    <Heart className="w-3 h-3 mr-1" />
                    {mockAnalyst.relationshipHealth}
                  </span>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getInfluenceColor(mockAnalyst.influenceScore)
                  )}>
                    <Star className="w-3 h-3 mr-1" />
                    Influence: {mockAnalyst.influenceScore}/100
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
              <a href={`mailto:${mockAnalyst.email}`} className="hover:text-blue-600">
                {mockAnalyst.email}
              </a>
            </div>
            {mockAnalyst.phone && (
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <a href={`tel:${mockAnalyst.phone}`} className="hover:text-blue-600">
                  {mockAnalyst.phone}
                </a>
              </div>
            )}
            {mockAnalyst.linkedIn && (
              <div className="flex items-center text-sm text-gray-600">
                <Linkedin className="w-4 h-4 mr-2" />
                <a href={mockAnalyst.linkedIn} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  LinkedIn
                </a>
              </div>
            )}
            {mockAnalyst.twitter && (
              <div className="flex items-center text-sm text-gray-600">
                <Twitter className="w-4 h-4 mr-2" />
                <a href={`https://twitter.com/${mockAnalyst.twitter.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="hover:text-blue-600">
                  {mockAnalyst.twitter}
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
                <p className="text-gray-700">{mockAnalyst.bio}</p>
              </div>

              {/* Expertise */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Expertise Areas</h3>
                <div className="flex flex-wrap gap-2">
                  {mockAnalyst.expertise.map((area, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Communication Timeline */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Communication Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Last Contact:</span>
                    <span className="text-gray-900">{formatDate(mockAnalyst.lastContactDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Next Scheduled:</span>
                    <span className="text-gray-900">{formatDate(mockAnalyst.nextContactDate)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Cadence:</span>
                    <span className="text-gray-900">Every {mockAnalyst.communicationCadence} days</span>
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
                  <p className="text-sm text-gray-700">{mockAnalyst.recentSocialSummary}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Last updated: {formatDate(mockAnalyst.socialSummaryUpdatedAt)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Key Themes</h4>
                  <div className="flex flex-wrap gap-2">
                    {mockAnalyst.keyThemes.map((theme, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {theme}
                      </span>
                    ))}
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
                    {mockAnalyst.upcomingPublications.map((pub, index) => (
                      <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-900">{pub.title}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-blue-700">{pub.type}</span>
                          <span className="text-xs text-blue-600">{formatDate(pub.expectedDate)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Publications</h4>
                  <div className="space-y-2">
                    {mockAnalyst.recentPublications.map((pub, index) => (
                      <div key={index} className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{pub.title}</p>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-xs text-gray-600">{pub.type}</span>
                              <span className="text-xs text-gray-500">{formatDate(pub.publishedDate)}</span>
                            </div>
                          </div>
                          {pub.url && (
                            <a 
                              href={pub.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
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
