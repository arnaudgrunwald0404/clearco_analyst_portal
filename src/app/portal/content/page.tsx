'use client'

import { useState, useEffect } from 'react'
import {
  FileText,
  Video,
  Download,
  Play,
  Calendar,
  Eye,
  Clock,
  Filter,
  Search,
  Tag,
  ExternalLink,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

const contentTypes = [
  { value: 'ALL', label: 'All Types' },
  { value: 'VIDEO', label: 'Videos' },
  { value: 'REPORT', label: 'Reports' },
  { value: 'DEMO', label: 'Demos' },
  { value: 'CASE_STUDY', label: 'Case Studies' },
  { value: 'WEBINAR', label: 'Webinars' }
]

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
    case 'CASE_STUDY':
      return FileText
    default:
      return FileText
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  
  if (date > now) {
    return `Scheduled for ${date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })}`
  }
  
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

export default function PortalContentPage() {
  const [content, setContent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/content')
        const result = await response.json()

        if (result.success) {
          setContent(result.data)
        } else {
          throw new Error(result.error || 'Failed to fetch content.')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.'
        setError(errorMessage)
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchContent()
  }, [toast])

  // Get all unique tags from the fetched content
  const allTags = Array.from(new Set(content.flatMap(item => item.tags || [])))

  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesType = selectedType === 'ALL' || item.type === selectedType
    
    const itemTags = item.tags || []
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => itemTags.includes(tag))
    
    return matchesSearch && matchesType && matchesTags
  })

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Exclusive Content</h1>
        <p className="mt-2 text-gray-600">
          Access premium content, research, and insights tailored for industry analysts
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 space-y-4">
        {/* Search and Type Filter */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search content..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {contentTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tags Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 py-2">Filter by tags:</span>
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                selectedTags.includes(tag)
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              )}
            >
              <Tag className="w-3 h-3 mr-1" />
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-red-600">
          <FileText className="w-12 h-12 mx-auto mb-4" />
          <p>Error loading content: {error}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((item) => {
              const IconComponent = getContentIcon(item.type)

              return (
                <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Content Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <IconComponent className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-3">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {item.type.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {item.is_exclusive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Exclusive
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {item.title}
                    </h3>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {item.description}
                    </p>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mb-4">
                      {formatDate(item.created_at)}
                    </div>

                    {/* Action Button */}
                    <a href={item.url || item.file_path || '#'} target="_blank" rel="noopener noreferrer" className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                      {item.type === 'VIDEO' && <Play className="w-4 h-4 mr-2" />}
                      {item.type === 'WEBINAR' && <Calendar className="w-4 h-4 mr-2" />}
                      {item.url ? <ExternalLink className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}

                      View Content
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredContent.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">No content found matching your criteria.</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
