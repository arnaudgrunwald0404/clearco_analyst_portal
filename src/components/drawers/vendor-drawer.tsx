'use client'

import { useState, useEffect } from 'react'
import { X, Building, Mail, Globe, Calendar, FileText, MessageSquare, Users, ExternalLink, TrendingUp, Clock, MapPin, Loader, Tag, Sparkles } from 'lucide-react'
import { SpinningCupcake } from '@/components/ui/spinning-cupcake'
import { cn } from '@/lib/utils'

interface VendorDrawerProps {
  isOpen: boolean
  onClose: () => void
  vendor: {
    id: string
    companyName: string
    website?: string
    category: string
    tier: string
    description?: string
    // Additional fields for drawer
    lastBriefingDate?: string
    nextBriefingDate?: string
    relationshipHealth?: string
    keyContacts?: Array<{
      name: string
      title: string
      email: string
    }>
    recentActivity?: Array<{
      type: string
      description: string
      date: string
    }>
  }
}

// Mock data for recent briefings
const mockBriefings = [
  {
    id: '1',
    title: 'Q4 Product Roadmap Discussion',
    date: '2024-01-15',
    status: 'Completed',
    duration: '45 min',
    participants: ['John Smith', 'Sarah Johnson'],
    topics: ['Product Strategy', 'Market Expansion']
  },
  {
    id: '2',
    title: 'Partnership Opportunities',
    date: '2024-01-08',
    status: 'Completed',
    duration: '30 min',
    participants: ['Mike Wilson'],
    topics: ['Partnerships', 'Integration']
  }
]

// Mock data for recent content
const mockContent = [
  {
    id: '1',
    title: 'AI-Powered Analytics Platform Launch',
    type: 'Press Release',
    date: '2024-01-20',
    url: '#'
  },
  {
    id: '2',
    title: 'Q4 2023 Financial Results',
    type: 'Earnings Report',
    date: '2024-01-18',
    url: '#'
  }
]

export default function VendorDrawer({ isOpen, onClose, vendor }: VendorDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState({
    briefings: false,
    content: false
  })

  // Don't render if no vendor is provided
  if (!vendor) return null

  const getTierColor = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'STRATEGIC':
        return 'bg-purple-100 text-purple-800'
      case 'IMPORTANT':
        return 'bg-blue-100 text-blue-800'
      case 'STANDARD':
        return 'bg-green-100 text-green-800'
      case 'LOW':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

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
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{vendor.companyName}</h2>
                <p className="text-sm text-gray-500">{vendor.category}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Building },
                { id: 'briefings', label: 'Briefings', icon: Calendar },
                { id: 'content', label: 'Content', icon: FileText },
                { id: 'activity', label: 'Activity', icon: TrendingUp }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Tier</div>
                    <div className="mt-1">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', getTierColor(vendor.tier))}>
                        {vendor.tier}
                      </span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Relationship Health</div>
                    <div className="mt-1 text-lg font-semibold text-gray-900">
                      {vendor.relationshipHealth || 'Good'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Last Briefing</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {vendor.lastBriefingDate ? new Date(vendor.lastBriefingDate).toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm text-gray-500">Next Briefing</div>
                    <div className="mt-1 text-sm text-gray-900">
                      {vendor.nextBriefingDate ? new Date(vendor.nextBriefingDate).toLocaleDateString() : 'Not scheduled'}
                    </div>
                  </div>
                </div>

                {/* Company Info */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Company Information</h3>
                  <div className="space-y-3">
                    {vendor.website && (
                      <div className="flex items-center space-x-3">
                        <Globe className="h-4 w-4 text-gray-400" />
                        <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {vendor.website}
                        </a>
                      </div>
                    )}
                    {vendor.description && (
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Description</div>
                        <p className="text-sm text-gray-900">{vendor.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Key Contacts */}
                {vendor.keyContacts && vendor.keyContacts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Key Contacts</h3>
                    <div className="space-y-2">
                      {vendor.keyContacts.map((contact, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{contact.name}</div>
                            <div className="text-xs text-gray-500">{contact.title}</div>
                          </div>
                          <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline text-sm">
                            {contact.email}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'briefings' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Recent Briefings</h3>
                  <button className="text-sm text-blue-600 hover:underline">Schedule New</button>
                </div>
                
                {loading.briefings ? (
                  <div className="flex items-center justify-center py-8">
                    <SpinningCupcake size="md" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockBriefings.map((briefing) => (
                      <div key={briefing.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{briefing.title}</h4>
                            <div className="mt-1 text-xs text-gray-500">
                              {new Date(briefing.date).toLocaleDateString()} • {briefing.duration}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                              {briefing.topics.map((topic, index) => (
                                <span key={index} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {briefing.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'content' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Recent Content</h3>
                  <button className="text-sm text-blue-600 hover:underline">View All</button>
                </div>
                
                {loading.content ? (
                  <div className="flex items-center justify-center py-8">
                    <SpinningCupcake size="md" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockContent.map((content) => (
                      <div key={content.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900">{content.title}</h4>
                            <div className="mt-1 text-xs text-gray-500">
                              {content.type} • {new Date(content.date).toLocaleDateString()}
                            </div>
                          </div>
                          <a href={content.url} className="text-blue-600 hover:underline text-sm">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                
                <div className="space-y-3">
                  {vendor.recentActivity?.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{activity.description}</div>
                        <div className="text-xs text-gray-500">{new Date(activity.date).toLocaleDateString()}</div>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      No recent activity
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
