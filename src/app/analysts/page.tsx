'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Loader, Check, ChevronDown, Trash2, AlertTriangle } from 'lucide-react'
import { cn, getInfluenceColor, getStatusColor } from '@/lib/utils'
import AnalystDrawer from '@/components/drawers/analyst-drawer'
import AddAnalystModal from '@/components/modals/add-analyst-modal'
import AnalystActionsMenu from '@/components/actions/analyst-actions-menu'
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
  type: 'Analyst' | 'Press' | 'Investor' | 'Practitioner' | 'Influencer'
  keyThemes?: string
  linkedinUrl?: string
  twitterHandle?: string
  phone?: string
  bio?: string
  personalWebsite?: string
  profileImageUrl?: string
  createdAt: string
  updatedAt: string
}

export default function AnalystsPage() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('ACTIVE')
  const [filterInfluence, setFilterInfluence] = useState('ALL')
  const [filterType, setFilterType] = useState('ALL')
  const [filterTopics, setFilterTopics] = useState<string[]>([])
  const [filterRecent, setFilterRecent] = useState(false)
  const [topicsExpanded, setTopicsExpanded] = useState(false)
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedAnalyst, setSelectedAnalyst] = useState<Analyst | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [analysts, setAnalysts] = useState<Analyst[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()
  const influenceDropdownRef = useRef<HTMLDivElement | null>(null)
  const [openInfluenceFor, setOpenInfluenceFor] = useState<string | null>(null)

  // Multi-select state
  const [selectedAnalysts, setSelectedAnalysts] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [bulkActionDropdownOpen, setBulkActionDropdownOpen] = useState(false)
  const [influenceDropdownOpen, setInfluenceDropdownOpen] = useState(false)
  const [showHardDeleteConfirm, setShowHardDeleteConfirm] = useState(false)

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
        setAnalysts(Array.isArray(result.data) ? result.data : [])
      } else {
        throw new Error(result.error || 'Failed to fetch analysts')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setAnalysts([]) // Ensure analysts is always an array even on error
      addToast({ type: 'error', message: 'Failed to load analysts' })
    } finally {
      setLoading(false)
    }
  }

  // Load analysts on component mount
  useEffect(() => {
    fetchAnalysts()
  }, [])

  // Check URL parameters on mount
  useEffect(() => {
    const filter = searchParams.get('filter')
    if (filter === 'recent') {
      setFilterRecent(true)
      setSortField('createdAt')
      setSortDirection('desc')
    }
  }, [searchParams])

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.bulk-actions-dropdown')) {
        setBulkActionDropdownOpen(false)
        setInfluenceDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close influence dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        openInfluenceFor &&
        influenceDropdownRef.current &&
        !influenceDropdownRef.current.contains(target)
      ) {
        setOpenInfluenceFor(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openInfluenceFor])

  const updateAnalystInfluence = async (analystId: string, newInfluence: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW') => {
    try {
      const res = await fetch(`/api/analysts/${analystId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ influence: newInfluence })
      })
      if (!res.ok) {
        const t = await res.text().catch(() => '')
        throw new Error(t || 'Failed to update influence')
      }
      // Update local list without refetch
      setAnalysts(prev => (prev || []).map(a => a.id === analystId ? { ...a, influence: newInfluence } as any : a))
      setOpenInfluenceFor(null)
      addToast({ type: 'success', message: 'Influence updated' })
    } catch (err) {
      addToast({ type: 'error', message: err instanceof Error ? err.message : 'Failed to update influence' })
    }
  }

  // Handle clicking outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.bulk-actions-dropdown')) {
        setBulkActionDropdownOpen(false)
        setInfluenceDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleRowClick = (analyst: Analyst) => {
    setSelectedAnalyst(analyst)
    setIsDrawerOpen(true)
  }

  const handleAnalystDeleted = () => {
    // Refresh the list
    fetchAnalysts()
  }



  const handleViewAnalyst = (analyst: Analyst) => {
    setSelectedAnalyst(analyst)
    setIsDrawerOpen(true)
  }

  // Get all unique topics for the filter dropdown
  const allTopics = useMemo(() => {
    const topics = new Set<string>()
    if (analysts && Array.isArray(analysts)) {
      analysts.forEach(analyst => {
        if (analyst.keyThemes) {
          analyst.keyThemes.split(',').forEach(topic => topics.add(topic.trim()))
        }
      })
    }
    return Array.from(topics).sort()
  }, [analysts])

  // Get topic counts for display in filters
  const getTopicCount = useCallback((topic: string) => {
    if (!analysts || !Array.isArray(analysts)) return 0
    return analysts.filter(analyst => 
      analyst.keyThemes && analyst.keyThemes.split(',').some(t => t.trim() === topic)
    ).length
  }, [analysts])

  // Calculate total topics count
  const totalTopicsCount = useMemo(() => {
    return allTopics?.length || 0
  }, [allTopics])

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

  // Multi-select helper functions
  const toggleAnalystSelection = (analystId: string) => {
    const newSelected = new Set(selectedAnalysts)
    if (newSelected.has(analystId)) {
      newSelected.delete(analystId)
    } else {
      newSelected.add(analystId)
    }
    setSelectedAnalysts(newSelected)
    setShowBulkActions(newSelected.size > 0)
  }

  const toggleAllAnalysts = () => {
    if (!filteredAndSortedAnalysts || !Array.isArray(filteredAndSortedAnalysts)) return
    
    if (selectedAnalysts.size === filteredAndSortedAnalysts.length) {
      setSelectedAnalysts(new Set())
      setShowBulkActions(false)
    } else {
      const allIds = new Set(filteredAndSortedAnalysts.map(a => a.id))
      setSelectedAnalysts(allIds)
      setShowBulkActions(true)
    }
  }

  const clearSelection = () => {
    setSelectedAnalysts(new Set())
    setShowBulkActions(false)
    setBulkActionDropdownOpen(false)
    setInfluenceDropdownOpen(false)
  }

  const handleBulkArchive = async () => {
    if (selectedAnalysts.size === 0) return

    try {
      const response = await fetch('/api/analysts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystIds: Array.from(selectedAnalysts),
          action: 'archive'
        })
      })

      if (response.ok) {
        addToast({ type: 'success', message: `Archived ${selectedAnalysts.size} analyst(s)` })
        clearSelection()
        fetchAnalysts() // Refresh the list
      } else {
        throw new Error('Failed to archive analysts')
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to archive analysts' })
    }
  }

  const handleBulkChangeInfluence = async (influence: string) => {
    if (selectedAnalysts.size === 0) return

    try {
      const response = await fetch('/api/analysts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystIds: Array.from(selectedAnalysts),
          action: 'changeInfluence',
          influence
        })
      })

      if (response.ok) {
        addToast({ type: 'success', message: `Updated influence for ${selectedAnalysts.size} analyst(s)` })
        clearSelection()
        fetchAnalysts() // Refresh the list
      } else {
        throw new Error('Failed to update influence')
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to update influence' })
    }
  }

  const handleBulkHardDelete = async () => {
    if (selectedAnalysts.size === 0) return

    try {
      const response = await fetch('/api/analysts/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystIds: Array.from(selectedAnalysts),
          action: 'hardDelete'
        })
      })

      if (response.ok) {
        addToast({ 
          type: 'success', 
          message: `Permanently deleted ${selectedAnalysts.size} analyst(s)` 
        })
        clearSelection()
        fetchAnalysts() // Refresh the list
        setShowHardDeleteConfirm(false)
      } else {
        throw new Error('Failed to delete analysts')
      }
    } catch (error) {
      addToast({ type: 'error', message: 'Failed to delete analysts' })
      setShowHardDeleteConfirm(false)
    }
  }

  const openHardDeleteConfirm = () => {
    setBulkActionDropdownOpen(false)
    setShowHardDeleteConfirm(true)
  }

  // Enhanced filtering and sorting
  const filteredAndSortedAnalysts = useMemo(() => {
    if (!analysts || !Array.isArray(analysts)) {
      return []
    }
    
    const filtered = analysts.filter(analyst => {
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
      
      const matchesType = filterType === 'ALL' || analyst.type === filterType
      
      const matchesTopics = filterTopics.length === 0 || 
        (analyst.keyThemes && analyst.keyThemes.split(',').some(t => filterTopics.some(topic => t.trim() === topic)))
      
      // Filter for recently added (last 30 days)
      const matchesRecent = !filterRecent || (() => {
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(analyst.createdAt) >= thirtyDaysAgo
      })()
      
      return matchesSearch && matchesStatus && matchesInfluence && matchesType && matchesTopics && matchesRecent
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
          case 'status':
            const statusOrder = { 'ACTIVE': 1, 'INACTIVE': 2, 'ARCHIVED': 3 }
            aValue = statusOrder[a.status] || 0
            bValue = statusOrder[b.status] || 0
            break
          case 'lastBriefing':
            aValue = new Date(a.updatedAt).getTime()
            bValue = new Date(b.updatedAt).getTime()
            break
          case 'createdAt':
            aValue = new Date(a.createdAt).getTime()
            bValue = new Date(b.createdAt).getTime()
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
  }, [analysts, searchTerm, filterStatus, filterInfluence, filterType, filterTopics, filterRecent, sortField, sortDirection])

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
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            {showBulkActions ? (
              <div className="flex items-center space-x-4">
                <div className="relative bulk-actions-dropdown">
                  <button
                    onClick={() => setBulkActionDropdownOpen(!bulkActionDropdownOpen)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Actions
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </button>
                  
                  {/* Bulk Actions Dropdown */}
                  {bulkActionDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                      <div className="py-1">
                        <button
                          onClick={handleBulkArchive}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Archive
                        </button>
                        
                        {/* Change Influence with sub-dropdown */}
                        <div className="relative">
                          <button
                            onClick={() => setInfluenceDropdownOpen(!influenceDropdownOpen)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center justify-between"
                          >
                            Change Influence
                            <ChevronDown className="w-3 h-3" />
                          </button>
                          
                          {influenceDropdownOpen && (
                            <div className="absolute left-full top-0 ml-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg">
                              <div className="py-1">
                                <button
                                  onClick={() => handleBulkChangeInfluence('VERY_HIGH')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Very High
                                </button>
                                <button
                                  onClick={() => handleBulkChangeInfluence('HIGH')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  High
                                </button>
                                <button
                                  onClick={() => handleBulkChangeInfluence('MEDIUM')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Medium
                                </button>
                                <button
                                  onClick={() => handleBulkChangeInfluence('LOW')}
                                  className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  Low
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Divider */}
                        <div className="border-t border-gray-200 my-1"></div>
                        
                        {/* Hard Delete - Dangerous Action */}
                        <button
                          onClick={openHardDeleteConfirm}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Permanently Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={clearSelection}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Clear selection ({selectedAnalysts.size})
                </button>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900">Analysts</h1>
                <p className="mt-1 text-gray-600">
                  Manage your industry analyst relationships
                </p>
              </>
            )}
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Analyst
          </button>
        </div>
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            
            {/* Type Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="ALL">All Types</option>
              <option value="Analyst">Analyst</option>
              <option value="Press">Press</option>
              <option value="Investor">Investor</option>
              <option value="Practitioner">Practitioner</option>
              <option value="Influencer">Influencer</option>
            </select>
            
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
        <div className="space-y-2">
          {/* Topics Header - Always Visible */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setTopicsExpanded(!topicsExpanded)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span>Topics ({totalTopicsCount})</span>
              <ChevronDown className={cn(
                "w-4 h-4 transition-transform duration-200",
                topicsExpanded ? "rotate-180" : ""
              )} />
            </button>
            
            {/* Show active topic filters when collapsed */}
            {!topicsExpanded && filterTopics.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                {filterTopics.map(topic => (
                  <button
                    key={topic}
                    onClick={() => toggleTopicFilter(topic)}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    <span>{topic}</span>
                    <X className="w-3 h-3 ml-1" />
                  </button>
                ))}
              </div>
            )}
            
            {filterTopics.length > 0 && (
              <button
                onClick={clearTopicFilters}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear all topics
              </button>
            )}
          </div>

          {/* Topics List - Collapsible */}
          {topicsExpanded && (
            <div className="flex flex-wrap items-center gap-2 pl-6">
              {allTopics && Array.isArray(allTopics) && allTopics.map(topic => {
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
            </div>
          )}
        </div>
        
        {/* Active Filters Summary */}
        {(filterTopics.length > 0 || filterStatus !== 'ALL' || filterInfluence !== 'ALL' || filterType !== 'ALL' || filterRecent) && (
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedAnalysts.length} of {analysts?.length || 0} analysts
            {filterRecent && (
              <span className="inline-flex items-center ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                Recently Added (30 days)
                <button
                  onClick={() => setFilterRecent(false)}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
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
            {/* Grid Header */}
            <div className="grid grid-cols-13 gap-4 bg-gray-50 px-6 py-3 border-b border-gray-200 font-medium text-xs text-gray-500 uppercase tracking-wider">
              {/* Checkbox column */}
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedAnalysts.size === filteredAndSortedAnalysts.length && filteredAndSortedAnalysts.length > 0}
                  onChange={toggleAllAnalysts}
                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                />
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('name')}
              >
                <span>Analyst</span>
                {getSortIcon('name')}
              </div>
              <div 
                className="col-span-2 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('company')}
              >
                <span>Company & Title</span>
                {getSortIcon('company')}
              </div>
              <div className="col-span-4">
                Covered Topics
              </div>
              <div 
                className="col-span-1 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('influence')}
              >
                <span>Influence</span>
                {getSortIcon('influence')}
              </div>
              <div 
                className="col-span-1 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                onClick={() => handleSort('status')}
              >
                <span>Status</span>
                {getSortIcon('status')}
              </div>
                <div 
                  className="col-span-1 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                  onClick={() => handleSort('lastBriefing')}
                >
                  <span>Last Touchpoint</span>
                  {getSortIcon('lastBriefing')}
                </div>
                <div 
                  className="col-span-1 cursor-pointer hover:bg-gray-100 transition-colors flex items-center space-x-1 rounded px-2 py-1"
                >
                  <span>Actions</span>

                </div>
            </div>
            
            {/* Grid Body */}
            <div className="divide-y divide-gray-200">
              {filteredAndSortedAnalysts && Array.isArray(filteredAndSortedAnalysts) && filteredAndSortedAnalysts.map((analyst) => (
                <div key={analyst.id} className="grid grid-cols-13 gap-4 px-6 py-4 hover:bg-gray-50">
                  {/* Checkbox column */}
                  <div className="col-span-1 flex items-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedAnalysts.has(analyst.id)}
                      onChange={() => toggleAnalystSelection(analyst.id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                  </div>
                  
                  {/* Analyst - 2/13 */}
                  <div className="col-span-2 cursor-pointer" onClick={() => handleRowClick(analyst)}>
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
                      <div className="ml-3 min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {analyst.firstName} {analyst.lastName}
                        </div>
              <div className="text-sm text-gray-500 truncate">{analyst.email}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Company & Title - 2/13 */}
                  <div className="col-span-2 cursor-pointer" onClick={() => handleRowClick(analyst)}>
                    <div className="text-sm text-gray-900 truncate">{analyst.company}</div>
                    <div className="text-sm text-gray-500 truncate">{analyst.title}</div>
                  </div>
                  
                  {/* Covered Topics - 4/13 */}
                  <div className="col-span-4 cursor-pointer" onClick={() => handleRowClick(analyst)}>
                    <div className="flex flex-wrap gap-1">
                      {analyst.keyThemes && analyst.keyThemes.split(',').map((topic, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {topic.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  {/* Influence - inline editable pill */}
                  <div className="col-span-1 relative">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setOpenInfluenceFor(openInfluenceFor === analyst.id ? null : analyst.id) }}
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent hover:opacity-90',
                        getInfluenceColor(analyst.influence)
                      )}
                      aria-haspopup="listbox"
                      aria-expanded={openInfluenceFor === analyst.id}
                      aria-label="Change influence"
                    >
                      {analyst.influence.replace('_', ' ')}
                    </button>
                    {openInfluenceFor === analyst.id && (
                      <div
                        ref={influenceDropdownRef}
                        className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                        role="listbox"
                      >
                        {([
                          ['VERY_HIGH', 'Very High'],
                          ['HIGH', 'High'],
                          ['MEDIUM', 'Medium'],
                          ['LOW', 'Low']
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            className={cn(
                              'w-full text-left px-3 py-2 text-sm hover:bg-gray-50',
                              value === analyst.influence ? 'font-semibold text-gray-900' : 'text-gray-700'
                            )}
                            onClick={(e) => { e.stopPropagation(); updateAnalystInfluence(analyst.id, value) }}
                            role="option"
                            aria-selected={value === analyst.influence}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Status - 1/13 */}
                  <div className="col-span-1 text-center cursor-pointer" onClick={() => handleRowClick(analyst)}>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      analyst.status === 'ACTIVE' && 'bg-green-100 text-green-800',
                      analyst.status === 'INACTIVE' && 'bg-yellow-100 text-yellow-800',
                      analyst.status === 'ARCHIVED' && 'bg-gray-100 text-gray-600'
                    )}>
                      {analyst.status}
                    </span>
                  </div>
                  
                  {/* Last Briefing - 1/13 */}
                  <div className="col-span-1 text-center cursor-pointer" onClick={() => handleRowClick(analyst)}>
                    <div className="text-sm text-gray-900 ">
                      {new Date(analyst.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>     
                  </div>
                  
                  {/* Actions - 1/13 */}
                  <div className="col-span-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <AnalystActionsMenu
                      analystId={analyst.id}
                      analystName={`${analyst.firstName || ''} ${analyst.lastName || ''}`.trim()}
                      analystStatus={analyst.status}
                      onDelete={handleAnalystDeleted}
                      onView={() => handleViewAnalyst(analyst)}
                    />
                  </div>
                </div>
              ))}
              
              {filteredAndSortedAnalysts.length === 0 && (
                <div className="grid grid-cols-13 gap-4 px-6 py-12">
                  <div className="col-span-13 text-center text-gray-500">
                    No analysts found matching your criteria.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedAnalyst && (
        <AnalystDrawer 
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            // Clear selected analyst after animation completes
            setTimeout(() => setSelectedAnalyst(null), 300)
          }}
          analyst={{
            ...selectedAnalyst,
            expertise: selectedAnalyst.keyThemes?.split(',').map(t => t.trim()) || [],
            influenceScore: 0,
            lastContactDate: selectedAnalyst.updatedAt,
            nextContactDate: '',
            relationshipHealth: 'GOOD',
            keyThemes: []
          }}
        />
      )}

      {/* Add Analyst Modal */}
      <AddAnalystModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAnalystAdded={() => {
          fetchAnalysts()
          setIsAddModalOpen(false)
        }}
      />

      {/* Hard Delete Confirmation Modal */}
      {showHardDeleteConfirm && (
        <>
          {/* Modal Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={() => setShowHardDeleteConfirm(false)}
          />
          
          {/* Modal Content */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Permanently Delete Analysts
                    </h3>
                    <p className="text-sm text-gray-600">
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHardDeleteConfirm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <Trash2 className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800">
                          Warning: Permanent Deletion
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          You are about to permanently delete <strong>{selectedAnalysts.size}</strong> analyst(s). 
                          This will also remove all associated data including topics, publications, and relationships.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    Are you sure you want to proceed? This action cannot be reversed.
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
                <button
                  onClick={() => setShowHardDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkHardDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Permanently</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
