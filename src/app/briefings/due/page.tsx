'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Filter,
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
// Avoid next/image for external hosts; use native img with onError fallback

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
    normalized?: string
  }
  lastBriefing?: {
    id: string
    scheduledAt: string
  } | null
  nextBriefing?: {
    id: string
    scheduledAt: string
  } | null
  daysSinceLastBriefing: number | null
  overdueDays: number | null
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

// Cache key and helper functions
const CACHE_KEY = 'briefings-due-cache'
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

interface CachedData {
  data: AnalystDue[]
  timestamp: number
  counts: Record<string, number>
}

const getCachedData = (): CachedData | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const parsedCache: CachedData = JSON.parse(cached)
    const now = Date.now()
    
    // Check if cache is still valid (same day)
    const cacheDate = new Date(parsedCache.timestamp)
    const today = new Date()
    const isSameDay = cacheDate.toDateString() === today.toDateString()
    
    if (isSameDay && (now - parsedCache.timestamp) < CACHE_DURATION) {
      console.log('📋 Using cached briefings due data')
      return parsedCache
    }
    
    // Cache expired, remove it
    localStorage.removeItem(CACHE_KEY)
    return null
  } catch (error) {
    console.error('Error reading cache:', error)
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}

const setCachedData = (data: AnalystDue[], counts: Record<string, number>) => {
  try {
    const cacheData: CachedData = {
      data,
      timestamp: Date.now(),
      counts
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
    console.log('💾 Cached briefings due data')
  } catch (error) {
    console.error('Error saving cache:', error)
  }
}

export default function BriefingsDuePage() {
  const [analysts, setAnalysts] = useState<AnalystDue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  // Multi-select tier filter (defaults to Very High + High)
  const [selectedTiers, setSelectedTiers] = useState<string[]>(['VERY_HIGH', 'HIGH'])
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>([])
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sortBy, setSortBy] = useState<'overdue' | 'tier' | 'name'>('overdue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [usingCache, setUsingCache] = useState(false)

  useEffect(() => {
    fetchAnalystsDue()
  }, [searchTerm, currentPage, sortBy, sortOrder])

  const fetchAnalystsDue = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setUsingCache(false)
      
      // Try to load from cache first if no search term and not forcing refresh
      if (!searchTerm && !forceRefresh) {
        const cachedData = getCachedData()
        if (cachedData) {
          setAnalysts(cachedData.data)
          setUsingCache(true)
          setLoading(false)
          console.log('📋 Loaded from cache:', cachedData.data.length, 'analysts')
          return
        }
      }
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm })
      })
      
      // Only force server cache bypass if searching or explicitly refreshing
      if (searchTerm || forceRefresh) {
        params.append('force', 'true')
      }
      
      console.log('🌐 Fetching fresh data from API...')
      const response = await fetch(`/api/briefings/due?${params}`)
      const data = await response.json()
      
      if (data.success) {
        let sortedAnalysts = [...data.data]
        
        // Cache the data if this is a full load (no search, no pagination)
        if (!searchTerm && currentPage === 1) {
          setCachedData(data.data, data.counts || {})
        }
        
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
        setTotalPages(1)
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
  const visibleAnalysts = useMemo(() => {
    const norm = (s: string | undefined) => (s || '').toUpperCase()
    return analysts.filter(a => selectedTiers.includes(norm(a.tier?.normalized || a.tier?.name)))
  }, [analysts, selectedTiers])

  function TierChip({ label }: { label: string }) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 border border-gray-200 text-gray-800">
        {label}
      </span>
    )
  }

  function TierMultiSelect({
    value,
    onChange,
  }: {
    value: string[]
    onChange: (v: string[]) => void
  }) {
    const [open, setOpen] = useState(false)
    const options = [
      { value: 'VERY_HIGH', label: 'Very High' },
      { value: 'HIGH', label: 'High' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'LOW', label: 'Low' },
    ]

    const toggle = (val: string) => {
      if (value.includes(val)) onChange(value.filter(v => v !== val))
      else onChange([...value, val])
    }

    const allLabels = new Map(options.map(o => [o.value, o.label]))
    const display = value.length > 0 ? value.map(v => allLabels.get(v) || v) : []

    return (
      <div className="relative w-64 sm:w-72">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          className="w-full h-9 flex items-center justify-between rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <div className="flex gap-1 flex-wrap items-center text-gray-700">
            {display.length === 0 ? (
              <span className="text-gray-400">Filter influence tiers</span>
            ) : (
              display.map(label => <TierChip key={label as string} label={label as string} />)
            )}
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 ml-2" />
        </button>

        {open && (
          <div
            role="listbox"
            aria-multiselectable="true"
            className="absolute z-30 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg"
          >
            <ul className="max-h-56 overflow-auto py-1">
              {options.map(opt => {
                const checked = value.includes(opt.value)
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={checked}
                      onClick={() => toggle(opt.value)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      <input type="checkbox" checked={checked} readOnly className="h-4 w-4" />
                      <span>{opt.label}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <div className="border-t p-2 flex items-center justify-between">
              <button
                type="button"
                className="text-xs text-gray-600 hover:text-gray-900 underline"
                onClick={() => onChange([])}
              >
                Clear all
              </button>
              <button
                type="button"
                className="text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setOpen(false)}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

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
          {/* Cache Status & Refresh */}
          <div className="flex items-center gap-2">
            {usingCache && (
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                📋 Cached
              </span>
            )}
            <button
              onClick={() => fetchAnalystsDue(true)}
              disabled={loading}
              className="flex items-center px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              title="Refresh data"
            >
              <svg className={cn("w-4 h-4 mr-1", loading && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          
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
        <div className="flex items-center gap-2 min-w-[260px]">
          <Filter className="w-4 h-4 text-gray-400" />
          <TierMultiSelect value={selectedTiers} onChange={setSelectedTiers} />
          {selectedTiers.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedTiers([])}
              className="text-xs text-gray-600 hover:text-gray-800 underline"
              aria-label="Clear all filters"
            >
              Clear all
            </button>
          )}
        </div>
      </div>



      {/* Removed redundant "Showing" chips for selected filters */}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading analysts...</span>
        </div>
      )}

      {/* Grouped Tables by Tier (Very High, High, Medium, Low) */}
      {!loading && (
        <div className="space-y-8">
          {(['VERY_HIGH','HIGH','MEDIUM','LOW'] as const).map(tier => {
            const show = selectedTiers.includes(tier)
            if (!show) return null
            const rows = analysts.filter(a => (a.tier?.normalized || a.tier?.name || '').toUpperCase() === tier)
            if (rows.length === 0) return null
            const label = tier === 'VERY_HIGH' ? 'Very High' : tier.charAt(0) + tier.slice(1).toLowerCase()
            return (
              <div key={tier} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 font-semibold">{label} Influence ({rows.length})</div>
                {/* Column headers */}
                <div className="px-4 py-2 bg-gray-50 border-b">
                  <div className="grid [grid-template-columns:40px_25%_1fr_1fr_2fr_1fr_1fr] gap-4 text-xs font-medium text-gray-500 uppercase tracking-wide items-center">
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        aria-label="Select all"
                        checked={rows.every(r => selectedAnalysts.includes(r.id)) && rows.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4"
                      />
                    </div>
                    <span className="text-left">Analyst</span>
                    <span className="text-left">Influence Tier</span>
                    <span className="text-left">Health</span>
                    <span className="text-left">Last Briefing</span>
                    <span className="text-left">Days Overdue</span>
                    <span className="text-left">Actions</span>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {rows.map(analyst => (
                    <div key={analyst.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="grid [grid-template-columns:40px_25%_1fr_1fr_2fr_1fr_1fr] gap-4 items-center">
                        {/* Select */}
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={selectedAnalysts.includes(analyst.id)}
                            onChange={() => handleSelectAnalyst(analyst.id)}
                            className="h-4 w-4"
                          />
                        </div>

                        {/* Analyst Info */}
                        <div className="flex items-center whitespace-normal break-words">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-100 mr-3 flex items-center justify-center relative">
                            {analyst.profileImageUrl ? (
                              <img
                                src={analyst.profileImageUrl}
                                alt={`${analyst.firstName} ${analyst.lastName}`}
                                width={40}
                                height={40}
                                className="object-cover w-10 h-10"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none'
                                }}
                                loading="lazy"
                                referrerPolicy="no-referrer"
                              />
                            ) : null}
                            {!analyst.profileImageUrl && (
                              <span className="text-sm font-medium text-blue-600">
                                {(analyst.firstName?.[0] || '').toUpperCase()}
                                {(analyst.lastName?.[0] || '').toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{analyst.firstName} {analyst.lastName}</div>
                            <div className="text-sm text-gray-600">{analyst.title} {analyst.company}</div>
                          </div>
                        </div>

                        {/* Tier */}
                        <div>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-800 border-gray-200">{analyst.tier.name}</span>
                        </div>

                        {/* Health */}
                        <div>
                          <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', healthColors[analyst.relationshipHealth] || 'bg-gray-100 text-gray-800')}>{analyst.relationshipHealth}</span>
                        </div>

                        {/* Last Briefing */}
                        <div className="text-sm">
                          {analyst.lastBriefing ? (
                            <div>
                              <div className="text-gray-900">{formatDate(analyst.lastBriefing.scheduledAt)}</div>
                              <div className="text-gray-600">{analyst.daysSinceLastBriefing ?? '—'} days ago</div>
                            </div>
                          ) : (
                            <span className="text-gray-500">Never</span>
                          )}
                        </div>

                        {/* Days Overdue */}
                        <div>
                          {analyst.lastBriefing ? (
                            <span className={cn('px-2.5 py-0.5 rounded-full text-xs font-medium', (analyst.overdueDays ?? 0) > 30 ? 'bg-red-100 text-red-800' : (analyst.overdueDays ?? 0) > 7 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800')}>+{Math.max(analyst.overdueDays ?? 0, 0)} days</span>
                          ) : null}
                          <div className="text-xs text-gray-600 mt-1">Due every {analyst.tier.briefingFrequency} days</div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 justify-start">
                          <button onClick={() => handleStartScheduling(analyst.id, analyst.firstName, analyst.lastName)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors" title="Start Scheduling">
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
                  ))}
                </div>
              </div>
            )
          })}

          {/* Empty State */}
          {analysts.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">
                {searchTerm || selectedTiers.length < 4
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
