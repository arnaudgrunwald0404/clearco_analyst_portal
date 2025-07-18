'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Plus, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, X, Loader, Upload } from 'lucide-react'
import { cn, getPriorityColor } from '@/lib/utils'
import AwardDrawer from '@/components/award-drawer'
import AddAwardModal from '@/components/add-award-modal'
import AwardActionsMenu from '@/components/award-actions-menu'
import BulkUploadModal from '@/components/bulk-upload-modal'
import { useToast } from '@/components/ui/toast'

interface Award {
  id: string
  name: string
  link?: string
  organization: string
  productTopics?: string[] | string  // JSON array or string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  submissionDate: string
  publicationDate: string
  owner?: string
  status: 'EVALUATING' | 'SUBMITTED' | 'UNDER_REVIEW' | 'WINNER' | 'FINALIST' | 'NOT_SELECTED' | 'WITHDRAWN'
  cost?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function AwardsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortField, setSortField] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedAward, setSelectedAward] = useState<Award | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false)
  const [awards, setAwards] = useState<Award[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { addToast } = useToast()

  // Fetch awards from database
  const fetchAwards = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/awards')
      if (!response.ok) {
        throw new Error('Failed to fetch awards')
      }
      
      const result = await response.json()
      if (result.success) {
        setAwards(result.data)
      } else {
        throw new Error(result.error || 'Failed to fetch awards')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      addToast({ type: 'error', message: 'Failed to load awards' })
    } finally {
      setLoading(false)
    }
  }

  // Load awards on component mount
  useEffect(() => {
    fetchAwards()
  }, [])

  const handleRowClick = (award: Award) => {
    setSelectedAward(award)
    setIsDrawerOpen(true)
  }

  const handleAwardDeleted = () => {
    // Refresh the list
    fetchAwards()
  }

  const handleEditAward = (award: Award) => {
    // TODO: Open edit modal with award data
    console.log('Edit award:', award)
  }

  const handleViewAward = (award: Award) => {
    setSelectedAward(award)
    setIsDrawerOpen(true)
  }

  // Handle sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  // Enhanced filtering and sorting
  const filteredAndSortedAwards = useMemo(() => {
    const filtered = awards.filter(award => {
      const productTopicsStr = Array.isArray(award.productTopics) 
        ? award.productTopics.join(' ') 
        : (award.productTopics || '')
      
      const matchesSearch = award.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        award.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        productTopicsStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (award.owner && award.owner.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesPriority = filterPriority === 'ALL' || award.priority === filterPriority
      const matchesStatus = filterStatus === 'ALL' || award.status === filterStatus
      
      return matchesSearch && matchesPriority && matchesStatus
    })

    // Apply sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortField) {
          case 'name':
            aValue = a.name.toLowerCase()
            bValue = b.name.toLowerCase()
            break
          case 'publicationDate':
            aValue = new Date(a.publicationDate).getTime()
            bValue = new Date(b.publicationDate).getTime()
            break
          case 'submissionDate':
            aValue = new Date(a.submissionDate).getTime()
            bValue = new Date(b.submissionDate).getTime()
            break
          case 'priority':
            const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
            aValue = priorityOrder[a.priority] || 0
            bValue = priorityOrder[b.priority] || 0
            break
          case 'status':
            const statusOrder = { 'WINNER': 7, 'FINALIST': 6, 'UNDER_REVIEW': 5, 'SUBMITTED': 4, 'EVALUATING': 3, 'NOT_SELECTED': 2, 'WITHDRAWN': 1 }
            aValue = statusOrder[a.status] || 0
            bValue = statusOrder[b.status] || 0
            break
          case 'organization':
            aValue = a.organization.toLowerCase()
            bValue = b.organization.toLowerCase()
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
  }, [awards, searchTerm, filterPriority, sortField, sortDirection])

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
            <h1 className="text-3xl font-bold text-gray-900">Awards</h1>
            <p className="mt-2 text-gray-600">
              Manage and track industry awards and recognition
            </p>
          </div>
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Award
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search awards by name, organization, topics, or owner..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            
            {/* Priority Filter */}
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="ALL">All Priority</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
        
        {/* Active Filters Summary */}
        {(filterPriority !== 'ALL' || searchTerm) && (
          <div className="text-sm text-gray-600">
            Showing {filteredAndSortedAwards.length} of {awards.length} awards
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <Loader className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading awards...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">⚠️</div>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading awards</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button
              onClick={fetchAwards}
              className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Awards Table */}
      {!loading && !error && (
        <div className="bg-white shadow rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('awardName')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Award Name</span>
                      {getSortIcon('awardName')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('publicationDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Publication Date</span>
                      {getSortIcon('publicationDate')}
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('processStartDate')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Process Start Date</span>
                      {getSortIcon('processStartDate')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact Information
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Priority</span>
                      {getSortIcon('priority')}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Topics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedAwards.map((award) => (
                  <tr key={award.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(award)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {award.awardName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(award.publicationDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(award.processStartDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {award.contactInfo}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        getPriorityColor(award.priority)
                      )}>
                        {award.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {award.topics}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                      <AwardActionsMenu
                        awardId={award.id}
                        awardName={award.awardName}
                        onDelete={handleAwardDeleted}
                        onEdit={() => handleEditAward(award)}
                        onView={() => handleViewAward(award)}
                      />
                    </td>
                  </tr>
                ))}
                {filteredAndSortedAwards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <div className="text-gray-500">No awards found matching your criteria.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AwardDrawer 
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          // Clear selected award after animation completes
          setTimeout(() => setSelectedAward(null), 300)
        }}
        award={selectedAward}
      />

      {/* Add Award Modal */}
      <AddAwardModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAwardAdded={() => {
          fetchAwards()
          setIsAddModalOpen(false)
        }}
      />

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onItemsAdded={() => {
          fetchAwards()
          setIsBulkUploadOpen(false)
        }}
        type="awards"
        apiEndpoint="/api/awards/bulk"
        fieldMappings={{
          awardName: ['award name', 'awardname', 'name', 'title', 'award_name', 'award'],
          publicationDate: ['publication date', 'publicationdate', 'publication_date', 'pub date', 'pub_date'],
          processStartDate: ['process start date', 'processstartdate', 'process_start_date', 'start date', 'start_date'],
          lastSubmissionDate: ['last submission date', 'lastsubmissiondate', 'last_submission_date', 'last submission', 'last_submission'],
          nextSubmissionDate: ['next submission date', 'nextsubmissiondate', 'next_submission_date', 'next submission', 'next_submission'],
          contactInfo: ['contact info', 'contactinfo', 'contact_info', 'contact information', 'contact', 'email'],
          organizer: ['organizer', 'organization', 'org', 'company', 'sponsor'],
          priority: ['priority', 'importance', 'level', 'urgency'],
          topics: ['topics', 'categories', 'tags', 'subjects', 'areas'],
          notes: ['notes', 'comments', 'additional info', 'description', 'remarks', 'additional_info']
        }}
        requiredFields={['awardName', 'publicationDate', 'processStartDate', 'contactInfo']}
        templateData={[
          {
            awardName: 'Best HR Technology Award 2024',
            publicationDate: '2024-12-01',
            processStartDate: '2024-06-01',
            lastSubmissionDate: '2024-11-15',
            nextSubmissionDate: '2024-11-30',
            contactInfo: 'awards@example.com',
            organizer: 'HR Tech Awards',
            priority: 'HIGH',
            topics: 'HR Technology, Innovation',
            notes: 'Annual industry recognition award'
          }
        ]}
      />
    </div>
  )
}
