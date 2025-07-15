'use client'

import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Send } from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Newsletter {
  id: string
  title: string
  subject: string
  status: string
  createdAt: string
  sentAt?: string
  scheduledAt?: string
  metrics: {
    totalRecipients: number
    openRate: number
    clickRate: number
    openedCount: number
    clickedCount: number
  }
}

export default function NewslettersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const fetchNewsletters = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/newsletters')
      if (response.ok) {
        const data = await response.json()
        setNewsletters(data.data || [])
      } else {
        setError('Failed to fetch newsletters')
      }
    } catch (error) {
      setError('Failed to fetch newsletters')
    } finally {
      setLoading(false)
    }
  }

  const filteredNewsletters = newsletters.filter(newsletter => {
    const matchesSearch = newsletter.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      newsletter.subject.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'ALL' || newsletter.status === filterStatus
    
    return matchesSearch && matchesFilter
  })

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-gray-500">Loading newsletters...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Newsletters</h1>
            <p className="mt-2 text-gray-600">
              Create and manage your analyst newsletters
            </p>
          </div>
          <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" onClick={() => router.push('/newsletters/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Newsletter
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600">{error}</div>
        </div>
      )}

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search newsletters..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
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
                  <span className="text-gray-900">{newsletter.metrics.totalRecipients}</span>
                </div>

                {newsletter.status === 'SENT' && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Open Rate:</span>
                      <span className="text-gray-900">{newsletter.metrics.openRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Click Rate:</span>
                      <span className="text-gray-900">{newsletter.metrics.clickRate}%</span>
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
                    <Link href={`/newsletters/${newsletter.id}/edit`}>
                      <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </button>
                    </Link>
                    <button
                      className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      onClick={async () => {
                        setSendingId(newsletter.id)
                        await fetch(`/api/newsletters/${newsletter.id}/send`, { method: 'POST' })
                        setSendingId(null)
                        fetchNewsletters() // Refresh the data
                      }}
                      disabled={sendingId === newsletter.id}
                    >
                      <Send className="w-4 h-4 mr-1" />
                      {sendingId === newsletter.id ? 'Sending...' : 'Send'}
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
