'use client'

import { useState, useEffect } from 'react'
import {
  Clock,
  Users,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Calendar as CalendarIcon,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalystDue {
  id: string
  firstName: string
  lastName: string
  email: string
  company?: string
  title?: string
  influence: string

  relationshipHealth: string
  profileImageUrl?: string
  tier: {
    name: string
    briefingFrequency: number
  }
  lastBriefing?: {
    id: string
    scheduledAt: string
  } | null
  nextBriefing?: {
    id: string
    scheduledAt: string
  } | null
  daysSinceLastBriefing: number
  overdueDays: number
  needsBriefing: boolean
}

interface BulkActionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedAnalysts: AnalystDue[]
  onAction: (action: string, data?: any) => void
}



const healthColors: Record<string, string> = {
  'EXCELLENT': 'bg-green-100 text-green-800',
  'GOOD': 'bg-blue-100 text-blue-800',
  'FAIR': 'bg-yellow-100 text-yellow-800',
  'POOR': 'bg-orange-100 text-orange-800',
  'CRITICAL': 'bg-red-100 text-red-800',
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function BulkActionModal({ isOpen, onClose, selectedAnalysts, onAction }: BulkActionModalProps) {
  const [action, setAction] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  if (!isOpen) return null

  const handleAction = async () => {
    if (!action) return
    
    setIsProcessing(true)
    try {
      await onAction(action)
      onClose()
    } catch (error) {
      console.error('Bulk action failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Bulk Actions ({selectedAnalysts.length} selected)
          </h3>
          
          <div className="space-y-3 mb-6">
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="snooze"
                checked={action === 'snooze'}
                onChange={(e) => setAction(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Snooze (30 days)</div>
                <div className="text-sm text-gray-600">Postpone briefing requirements</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="schedule"
                checked={action === 'schedule'}
                onChange={(e) => setAction(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Schedule Briefings</div>
                <div className="text-sm text-gray-600">Create briefing meetings</div>
              </div>
            </label>
            
            <label className="flex items-center">
              <input
                type="radio"
                name="action"
                value="downgrade"
                checked={action === 'downgrade'}
                onChange={(e) => setAction(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Downgrade Tier</div>
                <div className="text-sm text-gray-600">Move to lower priority tier</div>
              </div>
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleAction}
              disabled={!action || isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Apply Action'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function BriefingsDuePage() {
  const [analysts, setAnalysts] = useState<AnalystDue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState('ALL')
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'overdue' | 'tier' | 'name'>('overdue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    fetchAnalystsDue()
  }, [searchTerm, selectedTier, currentPage, sortBy, sortOrder])

  const fetchAnalystsDue = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedTier !== 'ALL' && { tier: selectedTier })
      })
      
      const response = await fetch(`/api/briefings/due?${params}`)
      const data = await response.json()
      
      if (data.success) {
        let sortedAnalysts = [...data.data]
        
        // Apply sorting
        sortedAnalysts.sort((a, b) => {
          let aValue: any, bValue: any
          
          switch (sortBy) {
            case 'overdue':
              aValue = a.overdueDays
              bValue = b.overdueDays
              break
            case 'tier':
              aValue = a.tier.name
              bValue = b.tier.name
              break
            case 'name':
              aValue = `${a.firstName} ${a.lastName}`
              bValue = `${b.firstName} ${b.lastName}`
              break
            default:
              return 0
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
          } else {
            return aValue < bValue ? 1 : -1
          }
        })
        
        setAnalysts(sortedAnalysts)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching analysts due for briefings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedAnalysts.length === analysts.length) {
      setSelectedAnalysts([])
    } else {
      setSelectedAnalysts(analysts.map(a => a.id))
    }
  }

  const handleSelectAnalyst = (analystId: string) => {
    setSelectedAnalysts(prev => 
      prev.includes(analystId)
        ? prev.filter(id => id !== analystId)
        : [...prev, analystId]
    )
  }

  const handleBulkAction = async (action: string, data?: any) => {
    try {
      if (action === 'schedule') {
        // Handle bulk scheduling
        const suggestedTimes = generateSuggestedTimes()
        const results = []
        
        for (const analystId of selectedAnalysts) {
          const analyst = analysts.find(a => a.id === analystId)
          if (!analyst) continue
          
          try {
            const response = await fetch('/api/scheduling-agent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                analystId,
                subject: `ClearCompany Briefing - ${analyst.firstName} ${analyst.lastName}`,
                suggestedTimes
              })
            })
            
            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                results.push(`✅ ${analyst.firstName} ${analyst.lastName}`)
              } else {
                results.push(`❌ ${analyst.firstName} ${analyst.lastName}: ${data.error}`)
              }
            } else {
              results.push(`❌ ${analyst.firstName} ${analyst.lastName}: Failed`)
            }
          } catch (error) {
            results.push(`❌ ${analyst.firstName} ${analyst.lastName}: Error`)
          }
        }
        
        alert(`Bulk scheduling results:\n${results.join('\n')}`)
        setSelectedAnalysts([])
        await fetchAnalystsDue()
      } else {
        // Handle other bulk actions
        const response = await fetch('/api/briefings/due', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            analystIds: selectedAnalysts,
            data
          })
        })
        
        if (response.ok) {
          setSelectedAnalysts([])
          await fetchAnalystsDue()
        }
      }
    } catch (error) {
      console.error('Bulk action failed:', error)
    }
  }

  const handleSort = (field: 'overdue' | 'tier' | 'name') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const handleStartScheduling = async (analystId: string, firstName: string, lastName: string) => {
    try {
      const response = await fetch('/api/scheduling-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analystId,
          subject: `ClearCompany Briefing - ${firstName} ${lastName}`,
          suggestedTimes: generateSuggestedTimes()
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          alert(`Scheduling conversation started for ${firstName} ${lastName}`)
          // Optionally refresh the page or navigate to scheduling agent page
        } else {
          alert(`Error: ${data.error}`)
        }
      } else {
        alert('Failed to start scheduling conversation')
      }
    } catch (error) {
      console.error('Error starting scheduling:', error)
      alert('Failed to start scheduling conversation')
    }
  }

  const generateSuggestedTimes = () => {
    const times = []
    const now = new Date()
    
    // Generate times for next 5 business days
    for (let i = 1; i <= 5; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      
      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue
      
      // Add morning and afternoon slots
      const morning = new Date(date)
      morning.setHours(10, 0, 0, 0)
      times.push(morning.toISOString())
      
      const afternoon = new Date(date)
      afternoon.setHours(14, 0, 0, 0)
      times.push(afternoon.toISOString())
    }
    
    return times.slice(0, 8) // Return max 8 suggested times
  }

  const selectedAnalystsData = analysts.filter(a => selectedAnalysts.includes(a.id))

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Briefings Due</h1>
          <p className="mt-2 text-gray-600">
            Analysts who need briefings based on their influence tier requirements
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {selectedAnalysts.length > 0 && (
            <button
              onClick={() => setShowBulkModal(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Actions ({selectedAnalysts.length})
            </button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search analysts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedTier}
            onChange={(e) => setSelectedTier(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">All Tiers</option>
            <option value="TIER_1">Tier 1</option>
            <option value="TIER_2">Tier 2</option>
            <option value="TIER_3">Tier 3</option>
            <option value="TIER_4">Tier 4</option>
          </select>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">{analysts.length}</p>
              <p className="text-sm text-gray-600">Total Due</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {analysts.filter(a => a.overdueDays > 30).length}
              </p>
              <p className="text-sm text-gray-600">Overdue 30+ Days</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">
                {analysts.filter(a => a.tier.name === 'TIER_1').length}
              </p>
              <p className="text-sm text-gray-600">Tier 1 (Critical)</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-2xl font-bold text-gray-900">{selectedAnalysts.length}</p>
              <p className="text-sm text-gray-600">Selected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analysts...</span>
        </div>
      )}

      {/* Analysts Table */}
      {!loading && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Table Header */}
          <div className="border-b border-gray-200 bg-gray-50">
            <div className="px-4 py-3 flex items-center">
              <input
                type="checkbox"
                checked={selectedAnalysts.length === analysts.length && analysts.length > 0}
                onChange={handleSelectAll}
                className="mr-3"
              />
              <div className="flex-1 grid grid-cols-6 gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <button
                  onClick={() => handleSort('name')}
                  className="text-left flex items-center hover:text-gray-700"
                >
                  Analyst
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
                <button
                  onClick={() => handleSort('tier')}
                  className="text-left flex items-center hover:text-gray-700"
                >
                  Tier & Score
                  {sortBy === 'tier' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
                <span>Health</span>
                <span>Last Briefing</span>
                <button
                  onClick={() => handleSort('overdue')}
                  className="text-left flex items-center hover:text-gray-700"
                >
                  Days Overdue
                  {sortBy === 'overdue' && (
                    sortOrder === 'asc' ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />
                  )}
                </button>
                <span>Actions</span>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {analysts.map((analyst) => (
              <div key={analyst.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedAnalysts.includes(analyst.id)}
                    onChange={() => handleSelectAnalyst(analyst.id)}
                    className="mr-3"
                  />
                  <div className="flex-1 grid grid-cols-6 gap-4 items-center">
                    {/* Analyst Info */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {analyst.firstName} {analyst.lastName}
                        </div>
                        <div className="text-sm text-gray-600">
                          {analyst.title} {analyst.company}
                        </div>
                      </div>
                    </div>

                    {/* Tier & Score */}
                    <div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">
                        {analyst.tier.name}
                      </span>

                    </div>

                    {/* Health */}
                    <div>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        healthColors[analyst.relationshipHealth] || 'bg-gray-100 text-gray-800'
                      )}>
                        {analyst.relationshipHealth}
                      </span>
                    </div>

                    {/* Last Briefing */}
                    <div className="text-sm">
                      {analyst.lastBriefing ? (
                        <div>
                          <div className="text-gray-900">
                            {formatDate(analyst.lastBriefing.scheduledAt)}
                          </div>
                          <div className="text-gray-600">
                            {analyst.daysSinceLastBriefing} days ago
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">Never</span>
                      )}
                    </div>

                    {/* Days Overdue */}
                    <div>
                      <span className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                        analyst.overdueDays > 30
                          ? 'bg-red-100 text-red-800'
                          : analyst.overdueDays > 7
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      )}>
                        +{analyst.overdueDays} days
                      </span>
                      <div className="text-xs text-gray-600 mt-1">
                        Due every {analyst.tier.briefingFrequency} days
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleStartScheduling(analyst.id, analyst.firstName, analyst.lastName)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Start Scheduling"
                      >
                        <CalendarIcon className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {analysts.length === 0 && !loading && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">
                {searchTerm || selectedTier !== 'ALL'
                  ? 'No analysts match your current filters'
                  : 'No analysts currently need briefings'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        selectedAnalysts={selectedAnalystsData}
        onAction={handleBulkAction}
      />
    </div>
  )
}
