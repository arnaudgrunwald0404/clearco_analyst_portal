'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Loader } from 'lucide-react'
import { cn, getInfluenceColor, getStatusColor } from '@/lib/utils'
import AnalystDrawer from '@/components/analyst-drawer'
import AddAnalystModal from '@/components/add-analyst-modal'
import AnalystActionsMenu from '@/components/analyst-actions-menu'
import { useToast } from '@/components/ui/toast'

interface Analyst {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  title?: string
  influence: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
  coveredTopics: Array<{ topic: string }>
  linkedIn?: string
  twitter?: string
  phone?: string
  bio?: string
  website?: string
  profileImageUrl?: string
  createdAt: string
  updatedAt: string
}

export default function AnalystsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterInfluence, setFilterInfluence] = useState('ALL')
  const [filterTopics, setFilterTopics] = useState<string[]>([])
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedAnalyst, setSelectedAnalyst] = useState<Analyst | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  // Fetch analysts from database
  const fetchAnalysts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/analysts')
      if (!response.ok) {
        throw new Error('Failed to fetch analysts')
      }
      
      const result = await response.json()
      if (result.success) {
        setAnalysts(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch analysts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      addToast({ type: 'error', message: 'Failed to load analysts' })
    } finally {
      setLoading(false)
    }
  }

  // Load analysts on component mount
  useEffect(() => {
    fetchAnalysts()
  }, [])

  const handleRowClick = (analyst: Analyst) => {
    setSelectedAnalyst(analyst)
    setIsDrawerOpen(true)
  }

  const handleAnalystDeleted = () => {
    // Refresh the list
    fetchAnalysts()
  }

  const handleEditAnalyst = (analyst: Analyst) => {
    // TODO: Open edit modal with analyst data
    console.log('Edit analyst:', analyst)
  }

  const handleViewAnalyst = (analyst: Analyst) => {
    setSelectedAnalyst(analyst)
    setIsDrawerOpen(true)
  }

  // Get all unique topics for the filter dropdown
  const allTopics = useMemo(() => {
    const topics = new Set<string>()
    analysts.forEach(analyst => {
      analyst.coveredTopics.forEach(topicObj => topics.add(topicObj.topic))
    })
    return Array.from(topics).sort()
  }, [analysts])

  // Get topic counts for display in filters
  const getTopicCount = useCallback((topic: string) => {
    return analysts.filter(analyst => 
      analyst.coveredTopics.some(topicObj => topicObj.topic === topic)
    ).length
  }, [analysts])

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Handle topic filtering
  const toggleTopicFilter = (topic: string) => {
    setFilterTopics(prev => 
      prev.includes(topic) 
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    )
  }

  const clearTopicFilters = () => {
    setFilterTopics([])
  }

  // Enhanced filtering and sorting
  const filteredAndSortedAnalysts = useMemo(() => {
    let filtered = analysts.filter(analyst => {
      // Filter out archived analysts by default (unless specifically viewing archived)
      const isArchived = analyst.status === 'ARCHIVED'
      if (filterStatus !== 'ARCHIVED' && isArchived) {
        return false
      }
      
      const matchesSearch = analyst.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        analyst.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (analyst.company?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        analyst.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'ALL' || analyst.status === filterStatus
      
      const matchesInfluence = filterInfluence === 'ALL' || analyst.influence === filterInfluence
      
      const matchesTopics = filterTopics.length === 0 || 
        filterTopics.some(topic => analyst.coveredTopics.some(topicObj => topicObj.topic === topic))
      
      return matchesSearch && matchesStatus && matchesInfluence && matchesTopics
    })

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortField) {
          case 'name':
            aValue = `${a.firstName} ${a.lastName}`.toLowerCase()
            bValue = `${b.firstName} ${b.lastName}`.toLowerCase()
            break
          case 'company':
            aValue = (a.company || '').toLowerCase()
            bValue = (b.company || '').toLowerCase()
            break
          case 'influence':
            const influenceOrder = { 'VERY_HIGH': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
            aValue = influenceOrder[a.influence] || 0
            bValue = influenceOrder[b.influence] || 0
            break
          case 'lastBriefing':
            aValue = new Date(a.updatedAt).getTime()
            bValue = new Date(b.updatedAt).getTime()
            break
          default:
            return 0
        }

        if (sortDirection === 'asc') {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        } else {
          return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
        }
      })
    }

    return filtered
  }, [analysts, searchTerm, filterStatus, filterInfluence, filterTopics, sortField, sortDirection])

  // Get sort icon for column headers
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 text-blue-600" />
      : <ArrowDown className="w-4 h-4 text-blue-600" />
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analysts</h1>
          <p className="mt-2 text-gray-600">
            Manage your industry analyst relationships
          </p>
        </div>
<button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Analyst
        </button>
      </div>

      {/* Enhanced Search and Filter Bar */}
      <div className="space-y-4 mb-6">
        {/* Search and Basic Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search analysts by name, company, or email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            
            {/* Status Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ARCHIVED">Archived</option>
            </select>
            
            {/* Influence Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterInfluence}
              onChange={(e) => setFilterInfluence(e.target.value)}
            >
              <option value="ALL">All Influence</option>
              <option value="VERY_HIGH">Very High</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
        
        {/* Topic Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Topics:</span>
          {allTopics.map(topic => {
            const count = getTopicCount(topic)
            return (
              <button
                key={topic}
                onClick={() => toggleTopicFilter(topic)}
                className={cn(
                  'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  filterTopics.includes(topic)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <span>{topic}</span>
                <span className="ml-1 text-xs opacity-75">({count})</span>
                {filterTopics.includes(topic) && (
                  <X className="w-3 h-3 ml-1" />
                )}
              </button>
            )
          })}
          
          {filterTopics.length > 0 && (
            <button
              onClick={clearTopicFilters}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium ml-2"
            >
              Clear all topics
            </button>
          )}
        </div>
        
        {/* Active Filters Summary */}
        {(filterTopics.length > 0 || filterStatus !== 'ALL' || filterInfluence !== 'ALL') && (
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedAnalysts.length} of {analysts.length} analysts
            {filterTopics.length > 0 && (
              <span> covering: {filterTopics.join(', ')}</span>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading analysts...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading analysts</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchAnalysts}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Analysts Table */}
      {!loading && !error && (
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center space-x-1">
                  <span>Analyst</span>
                  {getSortIcon('name')}
                </div>
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('company')}
              >
                <div className="flex items-center space-x-1">
                  <span>Company & Title</span>
                  {getSortIcon('company')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Covered Topics
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('influence')}
              >
                <div className="flex items-center space-x-1">
                  <span>Influence</span>
                  {getSortIcon('influence')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => handleSort('lastBriefing')}
              >
                <div className="flex items-center space-x-1">
                  <span>Last Briefing/Touchpoint</span>
                  {getSortIcon('lastBriefing')}
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedAnalysts.map((analyst) => (
              <tr key={analyst.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(analyst)}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {analyst.profileImageUrl ? (
                        <img
                          src={analyst.profileImageUrl}
                          alt={`${analyst.firstName} ${analyst.lastName}`}
                          className="h-10 w-10 rounded-full object-cover"
                          onError={(e) => {
                            // Fallback to initials if image fails to load
                            e.currentTarget.style.display = 'none'
                            if (e.currentTarget.nextSibling) {
                              (e.currentTarget.nextSibling as HTMLElement).style.display = 'flex'
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center"
                        style={{ display: analyst.profileImageUrl ? 'none' : 'flex' }}
                      >
                        <span className="text-sm font-medium text-blue-800">
                          {analyst.firstName.charAt(0)}{analyst.lastName.charAt(0)}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {analyst.firstName} {analyst.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{analyst.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{analyst.company}</div>
                  <div className="text-sm text-gray-500">{analyst.title}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {analyst.coveredTopics.map((topicObj, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {topicObj.topic}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getInfluenceColor(analyst.influence)
                  )}>
                    {analyst.influence.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getStatusColor(analyst.status)
                  )}>
                    {analyst.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      {new Date(analyst.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      Last updated
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                  <AnalystActionsMenu
                    analystId={analyst.id}
                    analystName={`${analyst.firstName || ''} ${analyst.lastName || ''}`.trim()}
                    onDelete={handleAnalystDeleted}
                    onEdit={() => handleEditAnalyst(analyst)}
                    onView={() => handleViewAnalyst(analyst)}
                  />
                </td>
              </tr>
            ))}
            {filteredAndSortedAnalysts.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12">
                  <div className="text-gray-500">No analysts found matching your criteria.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
        </div>
      )}

      <AnalystDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          // Clear selected analyst after animation completes
          setTimeout(() => setSelectedAnalyst(null), 300)
        }}
        analyst={selectedAnalyst}
      />

      {/* Add Analyst Modal */}
      <AddAnalystModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAnalystAdded={() => {
          fetchAnalysts()
          setIsAddModalOpen(false)
        }}
      />
    </div>
  )
}
