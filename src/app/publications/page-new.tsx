'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Plus, 
  Filter, 
  Calendar,
  ExternalLink,
  FileText,
  BookOpen,
  Newspaper,
  File,
  RefreshCw,
  Bot,
  Eye,
  AlertCircle,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Publication {
  id: string
  analystId: string
  title: string
  url?: string
  summary?: string
  type: 'RESEARCH_REPORT' | 'BLOG_POST' | 'WHITEPAPER' | 'WEBINAR' | 'PODCAST' | 'ARTICLE' | 'OTHER'
  publishedAt: string
  isTracked: boolean
  createdAt: string
  updatedAt: string
  analyst?: {
    firstName: string
    lastName: string
    company: string
  }
}

const publicationTypes = [
  { value: 'ALL', label: 'All Types' },
  { value: 'RESEARCH_REPORT', label: 'Research Reports' },
  { value: 'BLOG_POST', label: 'Blog Posts' },
  { value: 'WHITEPAPER', label: 'Whitepapers' },
  { value: 'WEBINAR', label: 'Webinars' },
  { value: 'PODCAST', label: 'Podcasts' },
  { value: 'ARTICLE', label: 'Articles' },
  { value: 'OTHER', label: 'Other' }
]

const typeColors = {
  RESEARCH_REPORT: 'bg-purple-100 text-purple-800',
  BLOG_POST: 'bg-blue-100 text-blue-800',
  WHITEPAPER: 'bg-green-100 text-green-800',
  WEBINAR: 'bg-orange-100 text-orange-800',
  PODCAST: 'bg-pink-100 text-pink-800',
  ARTICLE: 'bg-indigo-100 text-indigo-800',
  OTHER: 'bg-gray-100 text-gray-800'
}

const typeIcons = {
  RESEARCH_REPORT: FileText,
  BLOG_POST: BookOpen,
  WHITEPAPER: File,
  WEBINAR: Calendar,
  PODCAST: FileText,
  ARTICLE: Newspaper,
  OTHER: File
}

export default function PublicationsPage() {
  const [publications, setPublications] = useState<Publication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedPublication, setSelectedPublication] = useState<Publication | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    fetchPublications()
  }, [])

  const fetchPublications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/publications')
      if (response.ok) {
        const data = await response.json()
        setPublications(data.data || [])
      } else {
        setError('Failed to fetch publications')
      }
    } catch (error) {
      setError('Error fetching publications')
      console.error('Error fetching publications:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPublications = publications.filter(publication => {
    const matchesSearch = (
      publication.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      publication.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      publication.analyst?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      publication.analyst?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      publication.analyst?.company.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const matchesType = selectedType === 'ALL' || publication.type === selectedType

    return matchesSearch && matchesType
  })

  const getTypeIcon = (type: string) => {
    const IconComponent = typeIcons[type as keyof typeof typeIcons] || File
    return <IconComponent className="w-5 h-5 text-blue-600" />
  }

  const openDrawer = (publication: Publication) => {
    setSelectedPublication(publication)
    setDrawerOpen(true)
  }

  const closeDrawer = () => {
    setDrawerOpen(false)
    setSelectedPublication(null)
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading publications...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading publications</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchPublications}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Publications</h1>
          <p className="mt-2 text-gray-600">
            Track and manage analyst publications, reports, and research
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => window.open('/publications/review', '_blank')}
          >
            <Eye className="h-4 w-4" />
            Find Publications
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Publication
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {publications.filter(p => {
                  const pubDate = new Date(p.publishedAt)
                  return pubDate.getFullYear() === 2024 && pubDate <= new Date()
                }).length}
              </p>
              <p className="text-sm text-gray-600">Published 2024</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {publications.filter(p => {
                  const pubDate = new Date(p.publishedAt)
                  return pubDate.getFullYear() === 2025 && pubDate <= new Date()
                }).length}
              </p>
              <p className="text-sm text-gray-600">Published 2025</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Bot className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {publications.filter(p => p.isTracked).length}
              </p>
              <p className="text-sm text-gray-600">Tracked</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">5</p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search publications by title, summary, analyst, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {publicationTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Publications List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Table Header */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="px-4 py-3">
            <div className="grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
              <span>Publication</span>
              <span>Type</span>
              <span>Analyst</span>
              <span>Published</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="divide-y divide-gray-200">
          {filteredPublications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No publications found</h3>
              <p className="text-gray-600">
                {publications.length === 0 
                  ? 'Get started by adding your first publication'
                  : 'No publications match your search criteria'
                }
              </p>
            </div>
          ) : (
            filteredPublications.map((publication) => (
              <div 
                key={publication.id} 
                className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => openDrawer(publication)}
              >
                <div className="grid grid-cols-6 gap-4 items-center">
                  {/* Publication Info */}
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      {getTypeIcon(publication.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {publication.title}
                      </div>
                      {publication.summary && (
                        <div className="text-sm text-gray-600 truncate">
                          {publication.summary}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Type */}
                  <div>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      typeColors[publication.type] || 'bg-gray-100 text-gray-800'
                    )}>
                      {publication.type.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Analyst */}
                  <div className="text-sm">
                    {publication.analyst ? (
                      <div>
                        <div className="text-gray-900 font-medium">
                          {publication.analyst.firstName} {publication.analyst.lastName}
                        </div>
                        <div className="text-gray-600">
                          {publication.analyst.company}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">No analyst assigned</span>
                    )}
                  </div>

                  {/* Published Date */}
                  <div className="text-sm text-gray-900">
                    {format(new Date(publication.publishedAt), 'MMM dd, yyyy')}
                  </div>

                  {/* Status */}
                  <div>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      publication.isTracked 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    )}>
                      {publication.isTracked ? 'Tracked' : 'Not Tracked'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {publication.url && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          window.open(publication.url, '_blank')
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Open Publication"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        openDrawer(publication)
                      }}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}