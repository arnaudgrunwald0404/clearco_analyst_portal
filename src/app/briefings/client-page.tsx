'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Clock,
  MapPin,
  Users,
  FileText,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import type { Briefing } from './types'
import BriefingCard from './components/BriefingCard'
import Drawer from './components/drawer/Drawer'
import CalendarSyncOptionsModal from '@/components/modals/calendar-sync-options-modal'
import SimpleSyncModal from './simplified-sync-modal'

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
  { value: 'RESCHEDULED', label: 'Rescheduled' },
]

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  })
}

function formatTime(dateString: string) {
  return new Intl.DateTimeFormat('en-US', {
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
  const [showSyncOptions, setShowSyncOptions] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress[]>([])
  const [isSyncInProgress, setIsSyncInProgress] = useState(false)
  const [connectionTitle, setConnectionTitle] = useState('')
  const [syncStatus, setSyncStatus] = useState({ isInProgress: false, timeElapsed: 0 })
  const [hasCalendarConnection, setHasCalendarConnection] = useState<boolean | null>(null)
  const [syncStarting, setSyncStarting] = useState(false)
  
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

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchBriefings(true)
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchTerm])

  // Fetch initial briefings when status changes (no debounce needed)
  useEffect(() => {
    fetchBriefings(true)
    checkSyncStatus()
    checkCalendarConnection()
  }, [selectedStatus])

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observerRef.current) observerRef.current.disconnect()
    }
  }, [])

  const fetchBriefings = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true)
        setCursor(null)
      } else {
        setLoadingMore(true)
      }

      const params = new URLSearchParams()
      if (selectedStatus !== 'ALL') params.append('status', selectedStatus)
      if (searchTerm.trim()) params.append('search', searchTerm.trim())
      if (!reset && cursor) params.append('cursor', cursor)
      params.append('limit', '20')

      const response = await fetch(`/api/briefings?${params.toString()}`)
      const result = await response.json()

      if (result.success) {
        if (reset) {
          setBriefings(result.data || [])
        } else {
          setBriefings(prev => [...prev, ...(result.data || [])])
        }
        setHasMore(result.hasMore || false)
        setCursor(result.nextCursor || null)
      } else {
        console.error('Failed to fetch briefings:', result.error)
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

      // Use the first active connection (API returns snake_case: is_active)
      const connection = connectionsData.data.find((conn: any) => conn.is_active) || connectionsData.data[0]
      setConnectionTitle(connection.title || connection.email)
      
      // Show the sync options modal instead of starting sync directly
      setShowSyncOptions(true)
    } catch (error) {
      console.error('Error preparing calendar sync:', error)
      alert('Failed to prepare calendar sync. Please try again.')
    }
  }

  const handleCancelSync = async () => {
    if (!isSyncInProgress) return
    
    const confirmed = confirm('Are you sure you want to cancel the calendar sync? This will stop the current sync operation.')
    if (!confirmed) return

    try {
      // Add cancel message to progress
      setSyncProgress(prev => [...prev, { type: 'error', message: 'Sync cancelled by user' } as any])
      
      // Reset sync state
      setIsSyncInProgress(false)
      setSyncStatus({ isInProgress: false, timeElapsed: 0 })
      
      // Close modal after a short delay
      setTimeout(() => {
        setShowSyncModal(false)
      }, 1500)
      
    } catch (error) {
      console.error('Error cancelling sync:', error)
      setSyncProgress(prev => [...prev, { type: 'error', message: 'Failed to cancel sync' } as any])
    }
  }

  const handleSyncWithOptions = async (timeWindowOptions: any) => {
    try {
      if (!user) {
        alert('You must be logged in to sync your calendar.')
        return
      }
      
      // Get the calendar connections
      const connectionsResponse = await fetch('/api/settings/calendar-connections')
      const connectionsData = await connectionsResponse.json()
      
      if (!connectionsData.success || connectionsData.data.length === 0) {
        alert('No calendar connections found. Please set up a calendar connection first.')
        return
      }

      // Use the first active connection (API returns snake_case: is_active)
      const connection = connectionsData.data.find((conn: any) => conn.is_active) || connectionsData.data[0]
      setConnectionTitle(connection.title || connection.email)
      
      // Prepare progress state (do not open modal yet)
      setSyncProgress([{ type: 'progress', message: 'Starting calendar sync...' } as any])
      setSyncStatus({ isInProgress: true, timeElapsed: 0 })
      setSyncStarting(true)

      // Remember baseline last_sync_at to detect completion
      const baselineLastSync: string | null = connection.last_sync_at || null
      
      // Start the sync process with time window options
      const syncResponse = await fetch(`/api/settings/calendar-connections/${connection.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeWindowOptions })
      })
      
      if (syncResponse.status === 409) {
        // Sync already in progress
        let details = 'already in progress'
        try {
          const errorData = await syncResponse.json()
          details = errorData?.error || details
        } catch {}
        alert(`Calendar sync ${details}.`)
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

      // Close options modal and open progress modal
      setShowSyncOptions(false)
      setShowSyncModal(true)
      setIsSyncInProgress(true)

      // Simplified sync monitoring - just wait for completion via last_sync_at
      setSyncProgress([{ type: 'progress', message: 'Calendar sync started...' }])

      const startTime = Date.now()
      const timeoutMs = 300_000 // 5 minutes timeout
      const intervalMs = 5000 // Check every 5 seconds instead of 2

      // Simple polling for completion
      const checkCompletion = async () => {
        try {
          const resp = await fetch('/api/settings/calendar-connections')
          const body = await resp.json()
          const list = Array.isArray(body.data) ? body.data : []
          const updated = list.find((c: any) => c.id === connection.id)
          
          if (updated && updated.last_sync_at && updated.last_sync_at !== baselineLastSync) {
            // Sync completed
            setSyncProgress([{ type: 'complete', message: 'Calendar sync completed successfully!' }])
            setIsSyncInProgress(false)
            setSyncStatus({ isInProgress: false, timeElapsed: Math.round((Date.now() - startTime) / 60000) })
            setTimeout(() => {
              setShowSyncModal(false)
              fetchBriefings(true)
            }, 1500)
            return
          }

          // Check for timeout
          if (Date.now() - startTime > timeoutMs) {
            const elapsedMinutes = Math.round((Date.now() - startTime) / 60000)
            throw new Error(`Calendar sync timed out after ${elapsedMinutes} minutes. This may happen with large calendars. Please try again or contact support if the issue persists.`)
          }

          // Continue polling
          setTimeout(checkCompletion, intervalMs)
        } catch (err) {
          console.error('Sync monitoring error:', err)
          setSyncProgress([{ type: 'error', message: err instanceof Error ? err.message : 'Sync monitoring failed' }])
          setIsSyncInProgress(false)
          setSyncStatus({ isInProgress: false, timeElapsed: 0 })
          setTimeout(() => setShowSyncModal(false), 3000)
        }
      }

      // Start monitoring
      setTimeout(checkCompletion, intervalMs)

    } catch (error) {
      console.error('Error syncing calendar meetings:', error)
      setIsSyncInProgress(false)
      setSyncStatus({ isInProgress: false, timeElapsed: 0 })
      setSyncStarting(false)
      alert('Failed to start calendar sync. Please try again.')
    }
  }

  const checkSyncStatus = async () => {
    try {
      const response = await fetch('/api/settings/calendar-connections')
      const result = await response.json()
      
      if (result.success && result.data.length > 0) {
        const connection = result.data.find((conn: any) => conn.is_active) || result.data[0]
        const isCurrentlyInProgress = connection.sync_in_progress || false
        
        if (isCurrentlyInProgress) {
          setIsSyncInProgress(true)
          setSyncStatus({ isInProgress: true, timeElapsed: 0 })
          setShowSyncModal(true)
          setSyncProgress([{ type: 'progress', message: 'Sync already in progress...' }])
        }
      }
    } catch (error) {
      console.error('Error checking sync status:', error)
    }
  }

  const checkCalendarConnection = async () => {
    try {
      const response = await fetch('/api/settings/calendar-connections')
      const result = await response.json()
      
      if (result.success) {
        setHasCalendarConnection(result.data.length > 0)
      }
    } catch (error) {
      console.error('Error checking calendar connection:', error)
      setHasCalendarConnection(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Briefings
          </h1>
          <p className="mt-2 text-gray-600">Manage your analyst briefings</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {hasCalendarConnection && (
            <button
              onClick={syncCalendarMeetings}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isSyncInProgress}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isSyncInProgress && "animate-spin")} />
              {isSyncInProgress ? 'Syncing...' : 'Sync Calendar'}
            </button>
          )}
          
          <Link
            href="/briefings/create"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Briefing
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search briefings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              {briefingStatuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Briefings Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading briefings...</span>
          </div>
        ) : briefings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No briefings found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'Try adjusting your search terms.' : 'Get started by creating your first briefing.'}
            </p>
            <Link
              href="/briefings/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Briefing
            </Link>
          </div>
        ) : (() => {
          // Separate briefings into upcoming and past
          const now = new Date()
          const upcomingBriefings = briefings.filter(briefing => new Date(briefing.scheduledAt) > now)
          const pastBriefings = briefings.filter(briefing => new Date(briefing.scheduledAt) <= now)
          
          return (
            <div className="space-y-8">
              {/* Upcoming Briefings */}
              {upcomingBriefings.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-blue-600" />
                    Upcoming Briefings ({upcomingBriefings.length})
                  </h2>
                  <div className="space-y-4">
                    {upcomingBriefings.map((briefing, index) => (
                      <div
                        key={briefing.id}
                        ref={index === briefings.length - 1 ? lastElementRef : undefined}
                      >
                        <BriefingCard
                          briefing={briefing}
                          onSelect={() => setSelectedBriefing(briefing)}
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
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-gray-600" />
                    Past Briefings ({pastBriefings.length})
                  </h2>
                  <div className="space-y-4">
                    {pastBriefings.map((briefing, index) => (
                      <div
                        key={briefing.id}
                        ref={index === briefings.length - 1 ? lastElementRef : undefined}
                      >
                        <BriefingCard
                          briefing={briefing}
                          onSelect={() => setSelectedBriefing(briefing)}
                          isUpcoming={false}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  <span className="ml-2 text-gray-600">Loading more briefings...</span>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Briefing Drawer */}
      {selectedBriefing && (
        <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 z-50">
          <Drawer
            key={`client-briefing-drawer-${selectedBriefing.id}-${selectedBriefing.updatedAt}`}
            briefing={selectedBriefing}
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            onClose={() => setSelectedBriefing(null)}
            onUpdate={() => fetchBriefings(true)}
          />
        </div>
      )}

      {/* Sync Progress Modal */}
      <SimpleSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        connectionTitle={connectionTitle}
        onCancel={isSyncInProgress ? handleCancelSync : undefined}
        isSyncInProgress={isSyncInProgress}
        hasError={syncProgress.some(p => p.type === 'error')}
        isComplete={syncProgress.some(p => p.type === 'complete')}
      />

      {/* Calendar Sync Options Modal */}
      <CalendarSyncOptionsModal
        isOpen={showSyncOptions}
        onClose={() => setShowSyncOptions(false)}
        onConfirm={handleSyncWithOptions}
        isStarting={syncStarting}
      />
    </div>
  )
}
