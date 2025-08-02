'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'

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
  RESEARCH_REPORT: 'bg-blue-100 text-blue-800',
  BLOG_POST: 'bg-green-100 text-green-800',
  WHITEPAPER: 'bg-purple-100 text-purple-800',
  WEBINAR: 'bg-yellow-100 text-yellow-800',
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
    const Icon = typeIcons[type as keyof typeof typeIcons] || FileText
    return <Icon className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    return typeColors[type as keyof typeof typeColors] || typeColors.OTHER
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
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading publications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Publications</h1>
        <p className="text-red-600">Error: {error}</p>
        <Button 
          onClick={fetchPublications}
          className="mt-4"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Publications</h1>
        <p className="text-gray-600">
          Track and manage analyst publications, reports, and research
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Published Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published (2024)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publications.filter(p => {
                const pubDate = new Date(p.publishedAt)
                return pubDate.getFullYear() === 2024 && pubDate <= new Date()
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published (2025)</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publications.filter(p => {
                const pubDate = new Date(p.publishedAt)
                return pubDate.getFullYear() === 2025 && pubDate <= new Date()
              }).length}
            </div>
          </CardContent>
        </Card>

        {/* Announced Stats */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announced (2025)</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publications.filter(p => {
                const pubDate = new Date(p.publishedAt)
                return pubDate.getFullYear() === 2025 && pubDate > new Date()
              }).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announced (2026)</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publications.filter(p => {
                const pubDate = new Date(p.publishedAt)
                return pubDate.getFullYear() === 2026
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracked Publications</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {publications.filter(p => p.isTracked).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {/* This will be populated once we implement the review system */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => window.location.href = '/publications/review'}
                className="text-2xl font-bold hover:bg-transparent"
              >
                5
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search publications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          {publicationTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <Button 
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => window.location.href = '/publications/review'}
        >
          <Bot className="h-4 w-4" />
          Review Discovered
        </Button>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Publication
        </Button>
      </div>

      {/* Publications Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Publications</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPublications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No publications found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedType !== 'ALL' ? 'Try adjusting your search terms or filters.' : 'Get started by adding your first publication.'}
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Publication
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Title</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Analyst</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Published</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPublications.map((publication) => (
                    <tr 
                      key={publication.id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => openDrawer(publication)}
                    >
                      <td className="py-4 px-4">
                        <div>
                          <div className="font-medium text-gray-900">{publication.title}</div>
                          {publication.summary && (
                            <div className="text-sm text-gray-500 truncate max-w-md">
                              {publication.summary}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {publication.analyst ? (
                          <div>
                            <div className="font-medium text-gray-900">
                              {publication.analyst.firstName} {publication.analyst.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{publication.analyst.company}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Unknown Analyst</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={getTypeColor(publication.type)}>
                          <span className="flex items-center gap-1">
                            {getTypeIcon(publication.type)}
                            {publication.type.replace('_', ' ')}
                          </span>
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {format(new Date(publication.publishedAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-4 px-4">
                        <Badge variant={publication.isTracked ? "default" : "secondary"}>
                          {publication.isTracked ? 'Tracked' : 'Not Tracked'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          {publication.url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(publication.url, '_blank')
                              }}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              openDrawer(publication)
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Publication Details Drawer */}
      {selectedPublication && (
        <div className={`fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity ${
          drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}>
          <div className={`fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Publication Details</h2>
                <Button variant="ghost" size="sm" onClick={closeDrawer}>
                  ×
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Title */}
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{selectedPublication.title}</h3>
                    <Badge className={getTypeColor(selectedPublication.type)}>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(selectedPublication.type)}
                        {selectedPublication.type.replace('_', ' ')}
                      </span>
                    </Badge>
                  </div>

                  {/* Analyst Info */}
                  {selectedPublication.analyst && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Analyst</h4>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <div className="font-medium">
                          {selectedPublication.analyst.firstName} {selectedPublication.analyst.lastName}
                        </div>
                        <div className="text-sm text-gray-600">{selectedPublication.analyst.company}</div>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {selectedPublication.summary && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
                      <p className="text-gray-600">{selectedPublication.summary}</p>
                    </div>
                  )}

                  {/* URL */}
                  {selectedPublication.url && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Link</h4>
                      <Button
                        variant="outline"
                        onClick={() => window.open(selectedPublication.url, '_blank')}
                        className="w-full justify-start"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Publication
                      </Button>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Published</h4>
                      <p className="text-gray-600">
                        {format(new Date(selectedPublication.publishedAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Added</h4>
                      <p className="text-gray-600">
                        {format(new Date(selectedPublication.createdAt), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <Badge variant={selectedPublication.isTracked ? "default" : "secondary"}>
                      {selectedPublication.isTracked ? 'Tracked' : 'Not Tracked'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t">
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={closeDrawer}>
                    Close
                  </Button>
                  <Button className="flex-1">
                    Edit Publication
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}