'use client'

import { useState } from 'react'
import { Plus, Search, Filter, Eye, Edit, Send } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'

// Mock data for newsletters
const mockNewsletters = [
  {
    id: '1',
    title: 'Q4 HR Tech Trends Report',
    subject: 'Key HR Technology Trends to Watch in Q4 2024',
    status: 'SENT',
    createdAt: '2024-10-15T10:00:00Z',
    sentAt: '2024-10-16T09:00:00Z',
    recipientCount: 45,
    openRate: 68,
    clickRate: 12
  },
  {
    id: '2',
    title: 'Employee Experience Innovation',
    subject: 'Revolutionary Approaches to Employee Experience',
    status: 'DRAFT',
    createdAt: '2024-10-20T14:30:00Z',
    recipientCount: 0,
    openRate: 0,
    clickRate: 0
  },
  {
    id: '3',
    title: 'AI in HR: What Analysts Are Saying',
    subject: 'Industry Analyst Perspectives on AI in Human Resources',
    status: 'SCHEDULED',
    createdAt: '2024-10-18T11:15:00Z',
    scheduledAt: '2024-10-25T10:00:00Z',
    recipientCount: 52,
    openRate: 0,
    clickRate: 0
  }
]

function getStatusColor(status: string) {
  switch (status) {
    case 'SENT':
      return 'bg-green-100 text-green-800'
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800'
    case 'DRAFT':
      return 'bg-yellow-100 text-yellow-800'
    case 'CANCELLED':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export default function NewslettersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')

  const filteredNewsletters = mockNewsletters.filter(newsletter => {
    const matchesSearch = newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'ALL' || newsletter.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Newsletters</h1>
          <p className="mt-2 text-gray-600">
            Create and manage newsletter campaigns for industry analysts
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Newsletter
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search newsletters..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="SENT">Sent</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Newsletters Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredNewsletters.map((newsletter) => (
          <div key={newsletter.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {newsletter.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {newsletter.subject}
                  </p>
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(newsletter.status)
                  )}>
                    {newsletter.status}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="text-gray-900">{formatDateTime(newsletter.createdAt)}</span>
                </div>
                
                {newsletter.sentAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Sent:</span>
                    <span className="text-gray-900">{formatDateTime(newsletter.sentAt)}</span>
                  </div>
                )}
                
                {newsletter.status === 'SCHEDULED' && newsletter.scheduledAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Scheduled:</span>
                    <span className="text-gray-900">{formatDateTime(newsletter.scheduledAt)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Recipients:</span>
                  <span className="text-gray-900">{newsletter.recipientCount}</span>
                </div>

                {newsletter.status === 'SENT' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Open Rate:</span>
                      <span className="text-gray-900">{newsletter.openRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Click Rate:</span>
                      <span className="text-gray-900">{newsletter.clickRate}%</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center gap-2">
                <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </button>
                {newsletter.status === 'DRAFT' && (
                  <>
                    <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                      <Send className="w-4 h-4 mr-1" />
                      Send
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredNewsletters.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No newsletters found matching your criteria.</div>
        </div>
      )}
    </div>
  )
}
