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
  X,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  Upload,
  Mic,
  Bot,
  Eye,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  aiSummary?: string
  followUpSummary?: string
  duration?: number
  attendeeEmails?: string[]
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
  const [drawerTab, setDrawerTab] = useState<'overview' | 'transcript'>('overview')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Fetch briefings on component mount and when filters change
  useEffect(() => {
    fetchBriefings()
  }, [page, selectedStatus, searchTerm])

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
      
      const response = await fetch(`/api/briefings?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setBriefings(data.data)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching briefings:', error)
    } finally {
      setLoading(false)
    }
  }

  const syncCalendarMeetings = async () => {
    try {
      const response = await fetch('/api/briefings/sync-calendar', {
        method: 'POST'
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
              <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

          {/* Empty State */}
          {!loading && filteredBriefings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">No briefings found matching your criteria.</div>
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
          <BriefingDrawer
            briefing={selectedBriefing}
            activeTab={drawerTab}
            onTabChange={setDrawerTab}
            onClose={() => setSelectedBriefing(null)}
            onUpdate={fetchBriefings}
          />
        </div>
      )}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
              {briefing.title}
            </h3>
            <div className="flex items-center text-sm text-gray-600 space-x-4 mb-3">
              <div className="flex items-center">
                <CalendarIcon className="w-4 h-4 mr-1" />
                {date}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {time}
                {briefing.duration && ` (${briefing.duration} min)`}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {briefing.analysts.length} analyst{briefing.analysts.length !== 1 ? 's' : ''}
              </div>
            </div>
            {/* Analyst chips */}
            <div className="flex flex-wrap gap-2">
              {briefing.analysts.slice(0, 3).map((analyst) => (
                <div key={analyst.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs">
                  <span className="font-medium">
                    {analyst.firstName} {analyst.lastName}
                  </span>
                  {analyst.company && (
                    <span className="text-gray-500 ml-1">• {analyst.company}</span>
                  )}
                </div>
              ))}
              {briefing.analysts.length > 3 && (
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500">
                  +{briefing.analysts.length - 3} more
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2">
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
          {briefing.aiSummary && (
            <div className="flex items-center text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
              <Bot className="w-3 h-3 mr-1" />
              AI Summary
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// BriefingDrawer Component
function BriefingDrawer({ 
  briefing, 
  activeTab, 
  onTabChange, 
  onClose, 
  onUpdate 
}: {
  briefing: Briefing
  activeTab: 'overview' | 'transcript'
  onTabChange: (tab: 'overview' | 'transcript') => void
  onClose: () => void
  onUpdate: () => void
}) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [transcript, setTranscript] = useState(briefing.transcript || '')
  const [notes, setNotes] = useState(briefing.notes || '')
  
  const { date, time } = formatDateTime(briefing.scheduledAt)
  
  const handleSaveTranscript = async () => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/briefings/${briefing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript,
          notes,
          status: briefing.status === 'SCHEDULED' ? 'COMPLETED' : briefing.status
        })
      })
      
      if (response.ok) {
        onUpdate()
      }
    } catch (error) {
      console.error('Error updating briefing:', error)
    } finally {
      setIsUpdating(false)
    }
  }
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-gray-900 truncate">
            {briefing.title}
          </h2>
          <div className="flex items-center text-sm text-gray-600 mt-1">
            <CalendarIcon className="w-4 h-4 mr-1" />
            {date} at {time}
          </div>
        </div>
        <button
          onClick={onClose}
          className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => onTabChange('overview')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'overview'
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <div className="flex items-center justify-center">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </div>
        </button>
        <button
          onClick={() => onTabChange('transcript')}
          className={cn(
            "flex-1 py-3 px-4 text-sm font-medium border-b-2 transition-colors",
            activeTab === 'transcript'
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          )}
        >
          <div className="flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" />
            Transcript
          </div>
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'overview' && (
          <OverviewTab briefing={briefing} />
        )}
        
        {activeTab === 'transcript' && (
          <TranscriptTab 
            briefing={briefing}
            transcript={transcript}
            setTranscript={setTranscript}
            notes={notes}
            setNotes={setNotes}
            isUpdating={isUpdating}
            onSave={handleSaveTranscript}
          />
        )}
      </div>
    </div>
  )
}

// OverviewTab Component
function OverviewTab({ briefing }: { briefing: Briefing }) {
  return (
    <div className="p-6 space-y-6">
      {/* AI Summary */}
      {briefing.aiSummary && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center mb-3">
            <Bot className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="font-semibold text-gray-900">AI Summary</h3>
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {briefing.aiSummary}
          </div>
        </div>
      )}
      
      {/* Follow-ups */}
      {briefing.followUpSummary && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Follow-up Actions</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
            {briefing.followUpSummary}
          </div>
        </div>
      )}
      
      {/* Analysts */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Analysts</h3>
        <div className="space-y-3">
          {briefing.analysts.map((analyst) => (
            <div key={analyst.id} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {analyst.firstName[0]}{analyst.lastName[0]}
                </span>
              </div>
              <div className="flex-1">
                <div className="font-medium text-gray-900">
                  {analyst.firstName} {analyst.lastName}
                  {analyst.role && (
                    <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {analyst.role}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {analyst.title}{analyst.company && ` • ${analyst.company}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Agenda */}
      {briefing.agenda && briefing.agenda.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Agenda</h3>
          <ul className="space-y-2">
            {briefing.agenda.map((item, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <span className="w-4 h-4 mt-0.5 mr-2 text-gray-400">•</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Notes */}
      {briefing.notes && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Notes</h3>
          <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
            {briefing.notes}
          </div>
        </div>
      )}
      
      {/* Outcomes */}
      {briefing.outcomes && briefing.outcomes.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Outcomes</h3>
          <ul className="space-y-2">
            {briefing.outcomes.map((outcome, index) => (
              <li key={index} className="flex items-start text-sm text-gray-700">
                <CheckCircle className="w-4 h-4 mt-0.5 mr-2 text-green-500" />
                {outcome}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Actions */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-wrap gap-2">
          {briefing.recordingUrl && (
            <a
              href={briefing.recordingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
            >
              <Video className="w-4 h-4 mr-2" />
              View Recording
            </a>
          )}
          <button className="flex items-center px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors">
            <Edit3 className="w-4 h-4 mr-2" />
            Edit Details
          </button>
        </div>
      </div>
    </div>
  )
}

// TranscriptTab Component
function TranscriptTab({ 
  briefing, 
  transcript, 
  setTranscript, 
  notes, 
  setNotes, 
  isUpdating, 
  onSave 
}: {
  briefing: Briefing
  transcript: string
  setTranscript: (value: string) => void
  notes: string
  setNotes: (value: string) => void
  isUpdating: boolean
  onSave: () => void
}) {
  return (
    <div className="p-6 space-y-6">
      {/* Upload Options */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">Transcript Management</h3>
          <div className="flex items-center space-x-2">
            <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              <Upload className="w-4 h-4 mr-1" />
              Upload File
            </button>
            <button className="flex items-center px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
              <Mic className="w-4 h-4 mr-1" />
              Record
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Upload a transcript file, record audio, or manually enter the transcript below.
        </p>
      </div>
      
      {/* Transcript Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Transcript
        </label>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Enter or paste the meeting transcript here..."
          className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
      
      {/* Notes Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Notes
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add any additional notes or observations..."
          className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        />
      </div>
      
      {/* Save Button */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          {briefing.transcript ? 'Last updated: ' + new Date(briefing.updatedAt).toLocaleDateString() : 'No transcript saved yet'}
        </div>
        <button
          onClick={onSave}
          disabled={isUpdating}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isUpdating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Bot className="w-4 h-4 mr-2" />
              Save & Generate AI Summary
            </>
          )}
        </button>
      </div>
    </div>
  )
}
