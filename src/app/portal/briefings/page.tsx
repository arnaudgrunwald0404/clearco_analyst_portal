'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Clock,
  Users,
  Video,
  FileText,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit3,
  CheckCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  User,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Bot,
  Settings,
  CheckSquare,
  Star
} from 'lucide-react'
import { cn } from '@/lib/utils'
import CalendarSyncOptionsModal from '@/components/modals/calendar-sync-options-modal'
import Drawer from '@/app/briefings/components/drawer/Drawer'

interface Briefing {
  id: string
  title: string
  description?: string
  scheduledAt: string
  completedAt?: string
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  agenda?: string[]
  notes?: string
  outcomes?: string[]
  followUpActions?: string[]
  recordingUrl?: string
  transcript?: string
  ai_summary?: any
  duration?: number
  attendeeEmails?: string[]
  attendees?: string[][]
  analysts: {
    id: string
    firstName: string
    lastName: string
    email: string
    company?: string
    title?: string
    profileImageUrl?: string
    role?: string
  }[]
  calendarMeeting?: {
    id: string
    title: string
    startTime: string
    endTime: string
    attendees?: string[]
  }
  createdAt: string
  updatedAt: string
}

const briefingStatuses = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' }
]

const statusColors = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  RESCHEDULED: 'bg-yellow-100 text-yellow-800'
}

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

export default function PortalBriefingsPage() {
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedBriefing, setSelectedBriefing] = useState<Briefing | null>(null)
  const [drawerTab, setDrawerTab] = useState<'overview' | 'materials' | 'transcript'>('overview')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showSyncOptions, setShowSyncOptions] = useState(false)
  
  // Security: Get analyst context for impersonation
  const [analystContext, setAnalystContext] = useState<{analystId: string | null, analystEmail: string | null}>({
    analystId: null,
    analystEmail: null
  })

  // Security: Detect analyst impersonation context
  useEffect(() => {
    const detectAnalystContext = async () => {
      // Get analystId from URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const analystId = urlParams.get('analystId')
      
      if (analystId) {
        try {
          // Fetch analyst data to get email
          const analystResp = await fetch(`/api/analysts/${analystId}`)
          if (analystResp.ok) {
            const analystData = await analystResp.json()
            if (analystData.email) {
              setAnalystContext({
                analystId,
                analystEmail: analystData.email
              })
            }
          }
        } catch (error) {
          console.error('Failed to fetch analyst data for impersonation:', error)
        }
      }
    }
    
    detectAnalystContext()
  }, [])

  // Fetch briefings on component mount and when filters change
  useEffect(() => {
    // Don't fetch until we've attempted to detect analyst context
    // This prevents race conditions where API calls happen before analyst headers are set
    const urlParams = new URLSearchParams(window.location.search)
    const hasAnalystId = urlParams.get('analystId')
    
    if (hasAnalystId && !analystContext.analystId) {
      // Wait for analyst context to be detected
      return
    }
    
    fetchBriefings()
  }, [page, selectedStatus, searchTerm, analystContext.analystId, analystContext.analystEmail])

  const fetchBriefings = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      })
      
      if (selectedStatus !== 'ALL') {
        params.append('status', selectedStatus)
      }
      
      if (searchTerm) {
        params.append('search', searchTerm)
      }
      
      // Security: Add analyst headers for impersonation
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (analystContext.analystId && analystContext.analystEmail) {
        headers['x-analyst-email'] = analystContext.analystEmail
        headers['x-analyst-id'] = analystContext.analystId
      }
      
      const response = await fetch(`/api/briefings?${params}`, {
        headers
      })
      const data = await response.json()
      
      if (data.success) {
        setBriefings(data.data)
        // Handle pagination safely
        setTotalPages(data.pagination?.pages || 1)
      } else {
        console.error('Failed to fetch briefings:', data.error)
      }
    } catch (error) {
      console.error('Error fetching briefings:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncCalendarMeetings = async () => {
    // Show the sync options modal instead of starting sync directly
    setShowSyncOptions(true)
  }

  const handleSyncWithOptions = async (timeWindowOptions: any) => {
    try {
      const response = await fetch('/api/briefings/sync-calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ timeWindowOptions })
      })
      const data = await response.json()
      
      if (data.success) {
        fetchBriefings() // Refresh the list
      }
    } catch (error) {
      console.error('Error syncing calendar meetings:', error)
    }
  }

  const filteredBriefings = briefings
  const upcomingBriefings = filteredBriefings.filter(b => {
    const { isUpcoming } = formatDateTime(b.scheduledAt)
    return isUpcoming
  })
  const pastBriefings = filteredBriefings.filter(b => {
    const { isUpcoming } = formatDateTime(b.scheduledAt)
    return !isUpcoming
  })

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
                className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Calendar
              </button>
              <button className="flex items-center px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />
                Schedule Briefing
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search briefings..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent bg-white"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {briefingStatuses.map(status => (
                  <option key={status.value} value={status.value}>{status.label}</option>
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

          {/* Briefings List */}
          {!loading && (
            <div className="space-y-6">
              {/* Upcoming Briefings */}
              {upcomingBriefings.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Briefings</h2>
                  <div className="space-y-4">
                    {upcomingBriefings.map((briefing) => (
                      <BriefingCard 
                        key={briefing.id} 
                        briefing={briefing} 
                        onSelect={setSelectedBriefing}
                        isUpcoming={true}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Past Briefings */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Past Briefings</h2>
                <div className="space-y-4">
                  {pastBriefings.map((briefing) => (
                    <BriefingCard 
                      key={briefing.id} 
                      briefing={briefing} 
                      onSelect={setSelectedBriefing}
                      isUpcoming={false}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing page {page} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="flex items-center px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Briefing Drawer */}
      {selectedBriefing && (
        <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 z-50">
          <Drawer
            key={`briefing-drawer-${selectedBriefing.id}-${selectedBriefing.updatedAt}`}
            briefing={selectedBriefing}
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            onClose={() => setSelectedBriefing(null)}
            onUpdate={fetchBriefings}
          />
        </div>
      )}

      {/* Calendar Sync Options Modal */}
      <CalendarSyncOptionsModal
        isOpen={showSyncOptions}
        onClose={() => setShowSyncOptions(false)}
        onConfirm={handleSyncWithOptions}
        isStarting={false}
      />
    </div>
  )
}

// BriefingCard Component
function BriefingCard({ 
  briefing, 
  onSelect, 
  isUpcoming 
}: { 
  briefing: Briefing
  onSelect: (briefing: Briefing) => void
  isUpcoming: boolean 
}) {
  const { date, time } = formatDateTime(briefing.scheduledAt)

  // Vendor rating badge loader (show only if ratings exist)
  const [rating, setRating] = useState<{ avg: number | null, count: number }>({ avg: null, count: 0 })
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const r = await fetch(`/api/briefings/${encodeURIComponent(briefing.id)}/ratings`)
        if (!r.ok) return
        const j = await r.json().catch(() => null as any)
        if (!cancelled && j?.success && j?.stats) {
          setRating({ avg: j.stats.averageOverall ?? null, count: j.stats.count || 0 })
        }
      } catch {}
    })()
    return () => { cancelled = true }
  }, [briefing.id])

  // Calculate follow-up status
  const getFollowUpState = (followUpId: string) => {
    if (typeof window === 'undefined') return { isCompleted: false }
    const saved = localStorage.getItem(`followup-${followUpId}`)
    return saved ? JSON.parse(saved) : { isCompleted: false }
  }

  const followUpActions = briefing.followUpActions || []
  const totalFollowUps = followUpActions.length
  const completedFollowUps = followUpActions.filter((_, index) => 
    getFollowUpState(`${briefing.id}-${index}`).isCompleted
  ).length

  const hasFollowUps = totalFollowUps > 0
  const hasOverdueFollowUps = hasFollowUps && completedFollowUps < totalFollowUps

  // Attendees breakdown (match admin section)
  const attendeeRows = Array.isArray(briefing.attendees) ? briefing.attendees : []
  const attendees = attendeeRows
    .filter((row) => Array.isArray(row) && row.length >= 1)
    .map((row) => {
      const email = (row[0] || '').toString()
      const name = (row[1] || '').toString()
      const status = (row[2] || '').toString().toLowerCase()
      return { email, name, status }
    })

  const invitedCount = attendees.length
  const attendingCount = attendees.filter(a => ['accepted', 'yes'].includes(a.status)).length

  const analystEmails = new Set(
    Array.isArray(briefing.analysts)
      ? briefing.analysts.map((a: any) => (a?.email || '').toLowerCase()).filter(Boolean)
      : []
  )
  const analystAttendees = attendees.filter(a => analystEmails.has(a.email.toLowerCase()))
  const analystsCount = analystAttendees.length || briefing.analysts.length || 0

  const toNamesList = (list: { email: string; name: string }[]) =>
    list.map(a => (a.name && a.name.trim() ? a.name : a.email)).join(', ')

  const invitedTitle = attendees.length ? toNamesList(attendees) : 'No invitees'
  const attendingTitle = attendees.length
    ? toNamesList(attendees.filter(a => ['accepted', 'yes'].includes(a.status))) || 'None confirmed'
    : 'None confirmed'
  const analystsTitle = analystAttendees.length
    ? toNamesList(analystAttendees)
    : (briefing.analysts || []).map((a: any) => a?.firstName || a?.lastName ? `${a.firstName || ''} ${a.lastName || ''}`.trim() || a?.email || '' : a?.email || '').filter(Boolean).join(', ')
  
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onSelect(briefing)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div className={cn(
            "flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center",
            isUpcoming ? "bg-blue-100" : "bg-gray-100"
          )}>
            <Calendar className={cn(
              "w-6 h-6",
              isUpcoming ? "text-blue-600" : "text-gray-600"
            )} />
          </div>
          <div className="flex-1 min-w-0">
            {/* Date and time first (date emphasized), then title below */}
            <div className="text-sm text-gray-700 mb-1">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                <span className="font-semibold">{date}</span>
                <span className="mx-2 text-gray-300">•</span>
                <Clock className="w-4 h-4 mr-1" />
                <span>{time}{briefing.duration && ` (${briefing.duration} min)`}</span>
              </div>
            </div>
            <div className="text-base text-gray-900 font-medium truncate mb-3">{briefing.title}</div>

            {/* Attendees summary like admin */}
            <div className="flex items-center gap-3 text-xs text-gray-700">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-gray-100" title={invitedTitle}>
                Invited: <strong>{invitedCount}</strong>
              </span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 text-green-700" title={attendingTitle}>
                Attending: <strong>{attendingCount}</strong>
              </span>
              <span className="text-gray-300">|</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700" title={analystsTitle}>
                Analysts: <strong>{analystsCount}</strong>
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
          {/* Rating badge (only if exists) */}
          {rating.count > 0 && (
            <div className="flex items-center text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 px-2 py-1 rounded">
              <Star className="w-3 h-3 mr-1 text-yellow-600" />
              <span>{rating.avg?.toFixed(1)} / 5 ({rating.count})</span>
            </div>
          )}
          <span className={cn(
            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
            statusColors[briefing.status]
          )}>
            {briefing.status}
          </span>
          {briefing.transcript && (
            <div className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
              <FileText className="w-3 h-3 mr-1" />
              Transcript
            </div>
          )}
          {briefing.ai_summary && (
            <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              <Bot className="w-3 h-3 mr-1" />
              AI Summary
            </div>
          )}
          {/* Follow-up Indicator */}
          {hasFollowUps && (
            <div className={cn(
              'flex items-center px-2 py-1 rounded text-xs font-medium',
              hasOverdueFollowUps 
                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            )}>
              <CheckSquare className={cn(
                'w-3 h-3 mr-1',
                hasOverdueFollowUps ? 'text-amber-600' : 'text-green-600'
              )} />
              <span>
                {completedFollowUps} of {totalFollowUps} follow-ups {completedFollowUps < totalFollowUps ? 'due' : 'done'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

