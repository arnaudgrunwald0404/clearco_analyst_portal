'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { Briefing } from './types'
import BriefingCard from './components/BriefingCard'
import Drawer from './components/drawer/Drawer'


interface SyncProgress {
  type: string
  message?: string
  month?: string
  foundAnalystMeetings?: number
  totalEventsProcessed?: number
  relevantMeetingsCount?: number
  newMeetingsCount?: number
  existingMeetingsCount?: number
  lastAnalystFound?: string
  isComplete?: boolean
  error?: string
}

const briefingStatuses = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' }
]


function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return {
    date: formatDate(dateString),
    time: formatTime(dateString),
    isUpcoming: date > new Date()
  }
}

function SyncProgressModal({ 
  isOpen, 
  onClose, 
  progress, 
  connectionTitle 
}: { 
  isOpen: boolean
  onClose: () => void
  progress: SyncProgress[]
  connectionTitle: string
}) {
  // Guard before any hooks to keep hook order consistent across renders
  if (!isOpen) return null

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Bump animations when counters change
  const [bumpProcessed, setBumpProcessed] = useState(false)
  const [bumpRelevant, setBumpRelevant] = useState(false)
  const [bumpNew, setBumpNew] = useState(false)

  const latestProgress = progress[progress.length - 1]
  const isComplete = latestProgress?.isComplete
  const hasError = latestProgress?.error

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [progress])

  // Derive month completion and aggregates from progress events
  const completedMonthsSet = useMemo(() => {
    const set = new Set<string>()
    for (const item of progress) {
      if (item.type === 'month_result' && item.month) set.add(item.month)
    }
    return set
  }, [progress])

  const lastCompletedIdx = useMemo(() => {
    for (let i = progress.length - 1; i >= 0; i--) {
      if (progress[i]?.type === 'month_result') return i
    }
    return -1
  }, [progress])

  const meetingsParsed = useMemo(() => {
    if (lastCompletedIdx < 0) return 0
    let count = 0
    for (let i = 0; i <= lastCompletedIdx; i++) {
      if (progress[i]?.type === 'event_processed') count += 1
    }
    return count
  }, [progress, lastCompletedIdx])

  const analystMeetings = useMemo(() => {
    let sum = 0
    for (const item of progress) {
      if (item.type === 'month_result' && typeof item.foundAnalystMeetings === 'number') {
        sum += item.foundAnalystMeetings
      }
    }
    return sum
  }, [progress])

  const newMeetings = useMemo(() => {
    let sum = 0
    for (const item of progress) {
      // Prefer explicit per-month counts if provided
      if (item.type === 'month_result' && (item as any).newMeetingsCount) {
        sum += (item as any).newMeetingsCount as number
      }
      // Fallback to per-event signals if emitted
      if (item.type === 'new_meeting') sum += 1
    }
    return sum
  }, [progress])

  // Trigger bumps when derived totals change (update only on month completion)
  useEffect(() => {
    if (lastCompletedIdx >= 0) {
      setBumpProcessed(true)
      const t = setTimeout(() => setBumpProcessed(false), 200)
      return () => clearTimeout(t)
    }
  }, [meetingsParsed, lastCompletedIdx])

  useEffect(() => {
    if (lastCompletedIdx >= 0) {
      setBumpRelevant(true)
      const t = setTimeout(() => setBumpRelevant(false), 200)
      return () => clearTimeout(t)
    }
  }, [analystMeetings, lastCompletedIdx])

  useEffect(() => {
    if (lastCompletedIdx >= 0) {
      setBumpNew(true)
      const t = setTimeout(() => setBumpNew(false), 200)
      return () => clearTimeout(t)
    }
  }, [newMeetings, lastCompletedIdx])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <RefreshCw className={cn(
                "w-5 h-5 text-blue-600",
                !isComplete && !hasError && "animate-spin"
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Syncing Calendar
              </h3>
              <p className="text-sm text-gray-600">{connectionTitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className={cn("text-2xl font-bold text-blue-600 transition-transform duration-200", bumpProcessed && "scale-110")}>
                {meetingsParsed}
              </div>
              <div className="text-sm text-blue-700">Meetings Parsed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className={cn("text-2xl font-bold text-green-600 transition-transform duration-200", bumpRelevant && "scale-110")}>
                {analystMeetings}
              </div>
              <div className="text-sm text-green-700">Analyst Meetings</div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <div className={cn("text-2xl font-bold text-emerald-600 transition-transform duration-200", bumpNew && "scale-110")}>
                {newMeetings}
              </div>
              <div className="text-sm text-emerald-700">New Meetings</div>
            </div>
          </div>

          {/* Progress Messages */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 mb-3">Progress Log</h4>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              {progress.length === 0 ? (
                <div className="text-gray-500 text-center py-4">
                  Starting sync...
                </div>
              ) : (
                <div className="space-y-2">
                  {progress.map((item, index) => {
                    if (item.type === 'month_started') {
                      const isCompleted = item.month ? completedMonthsSet.has(item.month) : false
                      return (
                        <div key={index} className="flex items-center text-sm text-gray-700">
                          <span className="font-medium mr-2">Analyzing {item.month}...</span>
                          {!isCompleted && <span className="animate-pulse">•••</span>}
                        </div>
                      )
                    }
                    if (item.type === 'month_result') {
                      return (
                        <div key={index} className="flex items-center text-sm text-gray-900">
                          <span className="font-medium mr-2">{item.month}</span>
                          <span>→ Found {item.foundAnalystMeetings || 0} analyst meetings</span>
                        </div>
                      )
                    }
                    if (item.type === 'progress' && item.message) {
                      return (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          <div className="flex-1">
                            <div className="text-sm text-gray-900">{item.message}</div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6">
          {hasError ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Sync failed</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : isComplete ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Sync completed successfully!</span>
              </div>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                disabled
                aria-busy="true"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">Sync in progress...</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientBriefingsPage() {
  const { user } = useAuth()
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null)
  const [drawerTab, setDrawerTab] = useState<'overview' | 'transcript'>('overview')
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  
  // Sync progress modal state
  const [showSyncModal, setShowSyncModal] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([])
  const [connectionTitle, setConnectionTitle] = useState('')
  const [isSyncInProgress, setIsSyncInProgress] = useState(false)
  const [syncStatus, setSyncStatus] = useState<{ isInProgress: boolean; timeElapsed?: number }>({ isInProgress: false })
  const [hasCalendarConnection, setHasCalendarConnection] = useState<boolean | null>(null)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadingRef = useRef<HTMLDivElement>(null)

  // Intersection observer callback
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        loadMoreBriefings()
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [loading, hasMore, loadingMore])

  // Fetch initial briefings
  useEffect(() => {
    fetchBriefings(true)
    checkSyncStatus()
    checkCalendarConnection()
  }, [selectedStatus, searchTerm])

  const checkCalendarConnection = async () => {
    try {
      const connectionsResponse = await fetch('/api/settings/calendar-connections')
      const connectionsData = await connectionsResponse.json()
      if (connectionsData.success && connectionsData.data.length > 0) {
        const activeConnection = connectionsData.data.some((conn: any) => conn.is_active)
        setHasCalendarConnection(activeConnection)
      } else {
        setHasCalendarConnection(false)
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      setHasCalendarConnection(false)
    }
  }

  const checkSyncStatus = async () => {
    // Skip sync status check - remove hardcoded calendar connection ID
    // This was causing 400 Bad Request errors
    return
  }

  const fetchBriefings = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setBriefings([])
        setCursor(null)
        setHasMore(true)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams({
        limit: '25'
      })
      
      if (cursor && !reset) {
        params.append('cursor', cursor)
      }
      
      if (selectedStatus && selectedStatus !== 'ALL') {
        params.append('status', selectedStatus)
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      const response = await fetch(`/api/briefings?${params}`)
      const data = await response.json()
      
      if (data.success) {
        if (reset) {
          setBriefings(data.data)
        } else {
          setBriefings(prev => [...prev, ...data.data])
        }
        
        setCursor(data.nextCursor)
        setHasMore(data.hasMore)
      } else {
        console.error('API returned error:', data.error || 'Unknown error')
        // Set empty state if there's an error
        if (reset) {
          setBriefings([])
        }
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching briefings:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMoreBriefings = () => {
    if (!loadingMore && hasMore) {
      fetchBriefings(false)
    }
  }

  const syncCalendarMeetings = async () => {
    try {
      if (!user) {
        alert('You must be logged in to sync your calendar.')
        return
      }
      // First, get the calendar connections
      const connectionsResponse = await fetch('/api/settings/calendar-connections')
      const connectionsData = await connectionsResponse.json()
      
      if (!connectionsData.success || connectionsData.data.length === 0) {
        alert('No calendar connections found. Please set up a calendar connection first.')
        return
      }

      // Use the first active connection
      const connection = connectionsData.data.find((conn: any) => conn.isActive) || connectionsData.data[0]
      setConnectionTitle(connection.title || connection.email)
      
      // Reset progress and show modal
      setSyncProgress([])
      setShowSyncModal(true)
      setIsSyncInProgress(true)
      setSyncStatus({ isInProgress: true, timeElapsed: 0 })
      
      // First trigger the sync process
      const syncResponse = await fetch(`/api/settings/calendar-connections/${connection.id}/sync`, {
        method: 'POST'
      })
      
      if (syncResponse.status === 409) {
        // Sync already in progress
        const errorData = await syncResponse.json()
        alert(`Calendar sync already in progress: ${errorData.details}`)
        return
      }
      
      if (!syncResponse.ok) {
        let errorMessage = 'Failed to start calendar sync'
        try {
          const errorData = await syncResponse.json()
          if (errorData?.error) errorMessage = errorData.error
        } catch {}
        throw new Error(errorMessage)
      }

      // Create EventSource for real-time progress updates
      const eventSource = new EventSource(`/api/settings/calendar-connections/${connection.id}/sync`)
      
      eventSource.onmessage = (event) => {
        try {
          const raw = (event as MessageEvent).data
          // Some servers may send keepalive/heartbeat pings that aren't JSON
          if (typeof raw !== 'string' || raw.trim().length === 0 || raw.trim()[0] !== '{') {
            return
          }
          const data = JSON.parse(raw)
          setSyncProgress(prev => [...prev, data])
          
          // Close modal when sync is complete
          if (data.type === 'complete' || data.type === 'error') {
            eventSource.close()
            setIsSyncInProgress(false)
            setSyncStatus({ isInProgress: false })
            setTimeout(() => {
              setShowSyncModal(false)
              fetchBriefings(true) // Refresh the briefings list
            }, 2000)
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error)
        try { eventSource.close() } catch {}
        setIsSyncInProgress(false)
        setSyncStatus({ isInProgress: false })
        setSyncProgress(prev => [...prev, {
          type: 'sync_failed',
          message: 'Sync failed due to connection error',
          error: (error instanceof Error ? error.message : 'Connection error')
        }])
        // Auto-hide modal after showing the error briefly
        setTimeout(() => setShowSyncModal(false), 2000)
      }

    } catch (error) {
      console.error('Error syncing calendar meetings:', error)
      setIsSyncInProgress(false)
      setSyncStatus({ isInProgress: false })
      setSyncProgress(prev => [...prev, {
        type: 'sync_failed',
        message: 'Failed to start calendar sync',
        error: error instanceof Error ? error.message : 'Unknown error'
      }])
      setShowSyncModal(true)
      setTimeout(() => setShowSyncModal(false), 2000)
    }
  }

  const filteredBriefings = briefings
  const upcomingBriefings = filteredBriefings.filter(b => {
    const { isUpcoming } = formatDateTime(b.scheduledAt);
    return isUpcoming;
  });
  const pastBriefings = filteredBriefings.filter(b => {
    const { isUpcoming } = formatDateTime(b.scheduledAt);
    return !isUpcoming;
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content */}
      <div className={cn(
        "flex-1 flex flex-col transition-all duration-300",
        selectedBriefing ? "mr-96" : ""
      )}>
        <div className="p-6 space-y-6">
          {/* Page Header */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Briefings</h1>
              <p className="mt-2 text-gray-600">
                Manage your analyst briefings, view recordings, and track action items
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button 
                onClick={syncCalendarMeetings}
                disabled={isSyncInProgress || hasCalendarConnection !== true}
                className={cn(
                  "flex items-center px-4 py-2 border rounded-lg transition-colors",
                  (isSyncInProgress || !hasCalendarConnection)
                    ? "border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                )}
              >
                <RefreshCw className={cn(
                  "w-4 h-4 mr-2",
                  isSyncInProgress && "animate-spin"
                )} />
                {isSyncInProgress 
                  ? `Syncing... (${syncStatus.timeElapsed || 0}m)`
                  : "Sync Calendar"
                }
              </button>
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Briefing
              </button>
            </div>
          </div>

          {/* Conditional Banner */}
          {hasCalendarConnection === false && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    Connect your calendar in{' '}
                    <Link href="/settings" className="font-medium underline text-yellow-700 hover:text-yellow-600">
                      Settings
                    </Link>{' '}
                    to see all your briefings due, and be able to prioritize and schedule briefings.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search briefings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {briefingStatuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading briefings...</span>
            </div>
          )}

          {/* Briefings Content */}
          {!loading && (
            <div className="space-y-8">
              {/* Scheduled (Upcoming) Briefings */}
              {upcomingBriefings.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Scheduled Briefings ({upcomingBriefings.length})</h2>
                  <div className="space-y-4">
                    {upcomingBriefings.map((briefing, index) => (
                      <div key={briefing.id} ref={index === upcomingBriefings.length - 1 ? lastElementRef : null}>
                        <BriefingCard 
                          briefing={briefing} 
                          onSelect={setSelectedBriefing}
                          isUpcoming={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Past Briefings */}
              {pastBriefings.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Briefings ({pastBriefings.length})</h2>
                  <div className="space-y-4">
                    {pastBriefings.map((briefing, index) => (
                      <div key={briefing.id} ref={index === pastBriefings.length - 1 ? lastElementRef : null}>
                        <BriefingCard 
                          briefing={briefing} 
                          onSelect={setSelectedBriefing}
                          isUpcoming={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Briefings */}
              {filteredBriefings.length === 0 && !loading && (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No briefings found</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedStatus !== 'ALL' 
                      ? 'Try adjusting your search or filters'
                      : 'Get started by scheduling your first briefing'
                    }
                  </p>
                </div>
              )}

              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading more briefings...</span>
                </div>
              )}

              {/* End of Results */}
              {!hasMore && filteredBriefings.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">You've reached the end of all briefings</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Briefing Drawer */}
      {selectedBriefing && (
        <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 z-50">
          <Drawer
            briefing={selectedBriefing}
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            onClose={() => setSelectedBriefing(null)}
            onUpdate={() => fetchBriefings(true)}
          />
        </div>
      )}

      {/* Sync Progress Modal */}
      	<SyncProgressModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        progress={syncProgress}
        connectionTitle={connectionTitle}
      />
    </div>
  )
}
