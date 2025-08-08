'use client'

import { useState, useEffect } from 'react'
import Exa from "exa-js"
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
  User,
  X,
  Sparkles,
  Trash2,
  Pencil,
  Check,
  Clock
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [analysts, setAnalysts] = useState<Array<{id: string, firstName: string, lastName: string, company: string}>>([])
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    summary: '',
    type: 'RESEARCH_REPORT' as const,
    analystId: '',
    publishedAt: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
    isTracked: true
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Publication>>({})
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  // Discovery progress tracking
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveryProgress, setDiscoveryProgress] = useState<{
    totalAnalysts: number
    currentAnalyst: number
    currentAnalystName: string
    completed: Array<{
      analyst: string
      publicationsFound: number
    }>
  }>({
    totalAnalysts: 0,
    currentAnalyst: 0,
    currentAnalystName: '',
    completed: []
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const filter = params.get('filter')
    
    fetchPublications(filter)
    fetchAnalysts()
  }, [])

  const fetchPublications = async (filter: string | null = null) => {
    try {
      setLoading(true)
      setError(null)
      let url = '/api/publications'
      if (filter) {
        url += `?filter=${filter}`
      }
      const response = await fetch(url)
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

  const fetchAnalysts = async () => {
    try {
      const response = await fetch('/api/analysts')
      if (response.ok) {
        const data = await response.json()
        setAnalysts(data.data || [])
      }
    } catch (error) {
      console.error('Error fetching analysts:', error)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Please enter a title')
      return
    }
    
    if (!formData.analystId) {
      alert('Please select an analyst')
      return
    }

    try {
      const submitData = {
        ...formData,
        publishedAt: new Date(formData.publishedAt).toISOString()
      }

      const response = await fetch('/api/publications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        setIsAddModalOpen(false)
        resetForm()
        fetchPublications() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to create publication'}`)
      }
    } catch (error) {
      console.error('Error creating publication:', error)
      alert('Error creating publication')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      url: '',
      summary: '',
      type: 'RESEARCH_REPORT',
      analystId: '',
      publishedAt: new Date().toISOString().split('T')[0],
      isTracked: true
    })
  }

  const startEdit = (publication: Publication) => {
    setEditingId(publication.id)
    setEditData(publication)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const saveEdit = async () => {
    if (!editingId || !editData) return

    try {
      const response = await fetch(`/api/publications/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editData)
      })

      if (response.ok) {
        setEditingId(null)
        setEditData({})
        fetchPublications() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to update publication'}`)
      }
    } catch (error) {
      console.error('Error updating publication:', error)
      alert('Error updating publication')
    }
  }

  const deletePublication = async (id: string) => {
    try {
      const response = await fetch(`/api/publications/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setDeleteConfirmId(null)
        fetchPublications() // Refresh the list
      } else {
        const errorData = await response.json()
        alert(`Error: ${errorData.error || 'Failed to delete publication'}`)
      }
    } catch (error) {
      console.error('Error deleting publication:', error)
      alert('Error deleting publication')
    }
  }

  const discoverWithExa = async () => {
    try {
      setIsDiscovering(true)
      setError(null)
      
      const exa = new Exa("7ec7a421-de10-42a7-9165-0413b1721dfa");
      const discoveredPublications: Publication[] = []
      
      // Get a few sample analysts or use all if the list is small
      const analystsToSearch = analysts.slice(0, 8) // Increased limit for better demo
      
      // Initialize progress tracking
      setDiscoveryProgress({
        totalAnalysts: analystsToSearch.length,
        currentAnalyst: 0,
        currentAnalystName: '',
        completed: []
      })
      
      for (let i = 0; i < analystsToSearch.length; i++) {
        const analyst = analystsToSearch[i]
        const analystName = `${analyst.firstName} ${analyst.lastName}`
        
        // Update current analyst progress
        setDiscoveryProgress(prev => ({
          ...prev,
          currentAnalyst: i + 1,
          currentAnalystName: analystName
        }))
        
        try {
          console.log(`Searching for publications by ${analystName}`)
          
          const result = await exa.search(
            `PDF Publications by ${analystName} about Talent Acquisition and Talent Management`,
            {
              type: "auto",
              category: "pdf",
              userLocation: "US",
              numResults: 3, // Limit per analyst
              startPublishedDate: "2024-01-01T08:00:00.000Z",
              endPublishedDate: "2025-08-05T06:59:59.999Z"
            }
          )
          
          let publicationsFoundForAnalyst = 0
          
          // Process results and convert to Publication format
          if (result.results) {
            for (const item of result.results) {
              const publication: Publication = {
                id: `exa-${Date.now()}-${Math.random()}`, // Temporary ID
                analystId: analyst.id,
                title: item.title || 'Untitled Publication',
                url: item.url,
                summary: item.text?.substring(0, 200) + '...' || 'No summary available',
                type: 'RESEARCH_REPORT', // Default type, could be inferred from content
                publishedAt: item.publishedDate || new Date().toISOString(),
                isTracked: false, // Default to not tracked for discovered items
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                analyst: {
                  firstName: analyst.firstName,
                  lastName: analyst.lastName,
                  company: analyst.company
                }
              }
              
              discoveredPublications.push(publication)
              publicationsFoundForAnalyst++
            }
          }
          
          // Update completed list
          setDiscoveryProgress(prev => ({
            ...prev,
            completed: [...prev.completed, {
              analyst: analystName,
              publicationsFound: publicationsFoundForAnalyst
            }]
          }))
          
          // Add small delay to avoid rate limiting and show progress
          await new Promise(resolve => setTimeout(resolve, 800))
          
        } catch (analystError) {
          console.error(`Error searching for ${analystName}:`, analystError)
          
          // Still add to completed list with 0 results
          setDiscoveryProgress(prev => ({
            ...prev,
            completed: [...prev.completed, {
              analyst: analystName,
              publicationsFound: 0
            }]
          }))
        }
      }
      
      // Clear current analyst when done
      setDiscoveryProgress(prev => ({
        ...prev,
        currentAnalyst: prev.totalAnalysts,
        currentAnalystName: ''
      }))
      
      // Show final summary
      const totalFound = discoveredPublications.length
      const totalAnalysts = analystsToSearch.length
      const successfulAnalysts = discoveryProgress.completed.filter(r => r.publicationsFound > 0).length
      
      if (totalFound > 0) {
        alert(`Discovery Complete! 🎉\n\nFound ${totalFound} publications across ${successfulAnalysts}/${totalAnalysts} analysts.\n\nOpening review page...`)
        window.open('/publications/review', '_blank')
      } else {
        alert(`Discovery Complete\n\nSearched ${totalAnalysts} analysts but no publications were found.\nTry adjusting the search criteria or search terms.`)
      }
      
    } catch (error) {
      console.error('Error with Exa discovery:', error)
      setError('Failed to discover publications with Exa')
    } finally {
      setIsDiscovering(false)
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
          <Button onClick={() => fetchPublications()}>
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
            onClick={discoverWithExa}
            disabled={isDiscovering}
          >
            {isDiscovering ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {isDiscovering ? 'Discovering...' : 'Discover Publications'}
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Publication
          </Button>
        </div>
      </div>

      {/* Discovery Progress */}
      {(isDiscovering || discoveryProgress.completed.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-blue-900">
              {isDiscovering ? 'Discovering Publications with AI' : 'Discovery Complete'}
            </h3>
            <div className="flex items-center gap-3">
              <div className="text-sm text-blue-600">
                {discoveryProgress.currentAnalyst} of {discoveryProgress.totalAnalysts} analysts
              </div>
              {!isDiscovering && (
                <button
                  onClick={() => setDiscoveryProgress({
                    totalAnalysts: 0,
                    currentAnalyst: 0,
                    currentAnalystName: '',
                    completed: []
                  })}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-blue-600 mb-2">
              <span>Progress</span>
              <span>{Math.round((discoveryProgress.currentAnalyst / discoveryProgress.totalAnalysts) * 100)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(discoveryProgress.currentAnalyst / discoveryProgress.totalAnalysts) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Current Analyst */}
          {discoveryProgress.currentAnalystName && (
            <div className="flex items-center gap-2 mb-4 text-blue-800">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Searching publications for {discoveryProgress.currentAnalystName}...</span>
            </div>
          )}

          {/* Completed Analysts */}
          {discoveryProgress.completed.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-blue-900">
                  Completed ({discoveryProgress.completed.length}/{discoveryProgress.totalAnalysts}):
                </h4>
                <div className="text-xs text-blue-600">
                  Total found: {discoveryProgress.completed.reduce((sum, r) => sum + r.publicationsFound, 0)}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {discoveryProgress.completed.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between bg-white border border-blue-200 rounded-lg px-3 py-2"
                  >
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {result.analyst}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-blue-600 font-medium">
                        {result.publicationsFound}
                      </span>
                      {result.publicationsFound > 0 ? (
                        <FileText className="h-3 w-3 text-green-500" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
            <Clock className="w-8 h-8 text-orange-500" />
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
            <div className="grid gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide" style={{gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr 1fr'}}>
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
                className="px-4 py-3 hover:bg-gray-50"
              >
                {editingId === publication.id ? (
                  // Edit Mode
                  <div className="grid gap-4 items-center" style={{gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr 1fr'}}>
                    {/* Publication Info - Editable */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        {getTypeIcon(publication.type)}
                      </div>
                      <div className="min-w-0 flex-1 space-y-2">
                        <input
                          type="text"
                          value={editData.title || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Title"
                        />
                        <input
                          type="text"
                          value={editData.summary || ''}
                          onChange={(e) => setEditData(prev => ({ ...prev, summary: e.target.value }))}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Summary"
                        />
                      </div>
                    </div>

                    {/* Type - Editable */}
                    <div>
                      <select
                        value={editData.type || publication.type}
                        onChange={(e) => setEditData(prev => ({ ...prev, type: e.target.value as any }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {publicationTypes.filter(type => type.value !== 'ALL').map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Analyst - Editable */}
                    <div>
                      <select
                        value={editData.analystId || publication.analystId}
                        onChange={(e) => setEditData(prev => ({ ...prev, analystId: e.target.value }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No analyst</option>
                        {analysts.map(analyst => (
                          <option key={analyst.id} value={analyst.id}>
                            {analyst.firstName} {analyst.lastName}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Published Date - Editable */}
                    <div>
                      <input
                        type="date"
                        value={editData.publishedAt ? new Date(editData.publishedAt).toISOString().split('T')[0] : new Date(publication.publishedAt).toISOString().split('T')[0]}
                        onChange={(e) => setEditData(prev => ({ ...prev, publishedAt: new Date(e.target.value).toISOString() }))}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Status - Editable */}
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editData.isTracked !== undefined ? editData.isTracked : publication.isTracked}
                          onChange={(e) => setEditData(prev => ({ ...prev, isTracked: e.target.checked }))}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="ml-2 text-xs text-gray-700">Tracked</span>
                      </label>
                    </div>

                    {/* Edit Actions */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={saveEdit}
                        className="px-2 py-1 text-xs text-green-600 hover:text-green-800 transition-colors"
                        title="Save Changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 transition-colors"
                        title="Cancel Edit"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div 
                    className="grid gap-4 items-center cursor-pointer" 
                    style={{gridTemplateColumns: '3fr 1fr 1.5fr 1fr 1fr 1fr'}}
                    onClick={() => openDrawer(publication)}
                  >
                    {/* Publication Info */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        {getTypeIcon(publication.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-gray-900 break-words">
                          {publication.title}
                        </div>
                        {publication.summary && (
                          <div className="text-sm text-gray-600 break-words">
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
                    <div className="flex items-center space-x-1">
                      {publication.url && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(publication.url, '_blank')
                          }}
                          className="px-2 py-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                          title="Open Publication"
                        >
                          Open
                        </button>
                      )}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          startEdit(publication)
                        }}
                        className="px-1 py-1 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteConfirmId(publication.id)
                        }}
                        className="px-1 py-1 text-xs text-gray-600 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          openDrawer(publication)
                        }}
                        className="px-2 py-1 text-xs text-gray-600 hover:text-green-600 transition-colors"
                        title="View Details"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add Publication Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add New Publication</h2>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  resetForm()
                }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleFormSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="Enter publication title"
                  required
                />
              </div>

              {/* URL */}
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="https://example.com/publication"
                />
              </div>

              {/* Summary */}
              <div>
                <label htmlFor="summary" className="block text-sm font-medium text-gray-700 mb-2">
                  Summary
                </label>
                <textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                  placeholder="Brief description of the publication"
                />
              </div>

              {/* Type and Analyst Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                    Type *
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    {publicationTypes.filter(type => type.value !== 'ALL').map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Analyst */}
                <div>
                  <label htmlFor="analystId" className="block text-sm font-medium text-gray-700 mb-2">
                    Analyst *
                  </label>
                  <select
                    id="analystId"
                    value={formData.analystId}
                    onChange={(e) => setFormData(prev => ({ ...prev, analystId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  >
                    <option value="">Select an analyst</option>
                    {analysts.map(analyst => (
                      <option key={analyst.id} value={analyst.id}>
                        {analyst.firstName} {analyst.lastName} - {analyst.company}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Published Date */}
              <div>
                <label htmlFor="publishedAt" className="block text-sm font-medium text-gray-700 mb-2">
                  Published Date *
                </label>
                <input
                  type="date"
                  id="publishedAt"
                  value={formData.publishedAt}
                  onChange={(e) => setFormData(prev => ({ ...prev, publishedAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  required
                />
              </div>

              {/* Is Tracked */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isTracked"
                  checked={formData.isTracked}
                  onChange={(e) => setFormData(prev => ({ ...prev, isTracked: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
                <label htmlFor="isTracked" className="ml-2 text-sm text-gray-700">
                  Track this publication
                </label>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddModalOpen(false)
                    resetForm()
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Add Publication
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Delete Publication</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this publication? This action cannot be undone.
              </p>
              <div className="flex items-center justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => deletePublication(deleteConfirmId)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}