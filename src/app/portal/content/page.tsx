'use client'

import { useState } from 'react'
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
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Mock exclusive content data
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
    isNew: true,
    tags: ['Product', 'Roadmap', 'AI'],
    thumbnailUrl: '/api/placeholder/300/200'
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
    isNew: false,
    tags: ['Research', 'Market Analysis', 'Trends'],
    fileSize: '12.5 MB'
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
    isNew: true,
    tags: ['Demo', 'Analytics', 'Beta'],
    demoUrl: 'https://demo.example.com'
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
    isNew: false,
    tags: ['Leadership', 'Interviews', 'Trends'],
    thumbnailUrl: '/api/placeholder/300/200'
  },
  {
    id: '5',
    title: 'Customer Success Case Study: Global Implementation',
    description: 'Detailed analysis of a Fortune 500 company\'s transformation journey',
    type: 'CASE_STUDY',
    pages: '24 pages',
    publishedAt: '2024-09-20',
    accessLevel: 'TIER1',
    downloadCount: 89,
    isNew: false,
    tags: ['Case Study', 'Implementation', 'Fortune 500'],
    fileSize: '8.2 MB'
  },
  {
    id: '6',
    title: 'Upcoming Webinar: AI in Talent Management',
    description: 'Join our experts for insights on leveraging AI for talent acquisition and retention',
    type: 'WEBINAR',
    duration: '60 min',
    publishedAt: '2024-11-15',
    accessLevel: 'ALL',
    registrationCount: 234,
    isUpcoming: true,
    tags: ['Webinar', 'AI', 'Talent Management'],
    registrationUrl: 'https://register.example.com'
  }
]

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
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('ALL')
  const [selectedTags, setSelectedTags] = useState<string[]>([])

  // Get all unique tags
  const allTags = Array.from(new Set(mockExclusiveContent.flatMap(item => item.tags)))

  const filteredContent = mockExclusiveContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = selectedType === 'ALL' || item.type === selectedType
    
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.some(tag => item.tags.includes(tag))
    
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  
                  {(item.isNew || item.isUpcoming) && (
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                      item.isNew ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    )}>
                      {item.isNew ? 'New' : 'Upcoming'}
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
                <div className="flex flex-wrap gap-1 mb-4">
                  {item.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Metadata */}
                <div className="flex items-center text-xs text-gray-500 mb-4">
                  <Clock className="w-3 h-3 mr-1" />
                  <span className="mr-4">
                    {item.duration || item.pages || item.fileSize}
                  </span>
                  
                  {item.viewCount && (
                    <>
                      <Eye className="w-3 h-3 mr-1" />
                      <span className="mr-4">{item.viewCount} views</span>
                    </>
                  )}
                  
                  {item.downloadCount && (
                    <>
                      <Download className="w-3 h-3 mr-1" />
                      <span>{item.downloadCount} downloads</span>
                    </>
                  )}
                  
                  {item.registrationCount && (
                    <>
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>{item.registrationCount} registered</span>
                    </>
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-4">
                  {formatDate(item.publishedAt)}
                </div>

                {/* Action Button */}
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center">
                  {item.type === 'VIDEO' && <Play className="w-4 h-4 mr-2" />}
                  {item.type === 'REPORT' && <Download className="w-4 h-4 mr-2" />}
                  {item.type === 'DEMO' && <ExternalLink className="w-4 h-4 mr-2" />}
                  {item.type === 'WEBINAR' && item.isUpcoming && <Calendar className="w-4 h-4 mr-2" />}
                  {item.type === 'CASE_STUDY' && <Download className="w-4 h-4 mr-2" />}
                  
                  {item.type === 'VIDEO' && 'Watch Video'}
                  {item.type === 'REPORT' && 'Download Report'}
                  {item.type === 'DEMO' && 'Access Demo'}
                  {item.type === 'WEBINAR' && (item.isUpcoming ? 'Register' : 'Watch Recording')}
                  {item.type === 'CASE_STUDY' && 'Download Case Study'}
                </button>
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
    </div>
  )
}
