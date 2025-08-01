import { useState, useEffect } from 'react'
import { Calendar, Clock, Users, Video, FileText, Bot, MessageSquare, Download } from 'lucide-react'
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
  createdAt: string
  updatedAt: string
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

export default function BriefingSummary() {
  const [latestBriefing, setLatestBriefing] = useState<Briefing | null>(null)
  const [nextBriefing, setNextBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBriefings()
  }, [])

  const fetchBriefings = async () => {
    try {
      setLoading(true)
      setError('')

      // Get latest completed briefing
      const latestResponse = await fetch('/api/briefings?status=COMPLETED&limit=1')
      const latestData = await latestResponse.json()

      // Get next scheduled briefing
      const nextResponse = await fetch('/api/briefings?status=SCHEDULED&upcoming=true&limit=1')
      const nextData = await nextResponse.json()

      if (latestData.length > 0) {
        setLatestBriefing(latestData[0])
      }

      if (nextData.length > 0) {
        setNextBriefing(nextData[0])
      }
    } catch (error) {
      console.error('Error fetching briefings:', error)
      setError('Failed to load briefings')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-lg">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Latest Briefing */}
      {latestBriefing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Latest Briefing</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{latestBriefing.title}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Completed
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(latestBriefing.scheduledAt)}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(latestBriefing.scheduledAt)}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {latestBriefing.analysts.length} analyst{latestBriefing.analysts.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Resources */}
            <div className="flex flex-wrap gap-2 mt-4">
              {latestBriefing.recordingUrl && (
                <a
                  href={latestBriefing.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Video className="w-4 h-4 mr-2" />
                  Recording
                </a>
              )}
              {latestBriefing.transcript && (
                <button className="flex items-center px-3 py-2 bg-purple-50 text-purple-700 text-sm rounded-lg hover:bg-purple-100 transition-colors">
                  <FileText className="w-4 h-4 mr-2" />
                  Transcript
                </button>
              )}
              {latestBriefing.aiSummary && (
                <button className="flex items-center px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition-colors">
                  <Bot className="w-4 h-4 mr-2" />
                  AI Summary
                </button>
              )}
            </div>

            {/* Action Items */}
            {latestBriefing.followUpActions && latestBriefing.followUpActions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Action Items</h4>
                <ul className="space-y-2">
                  {latestBriefing.followUpActions.map((action, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700">
                      <span className="w-4 h-4 mt-0.5 mr-2 text-gray-400">•</span>
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Next Scheduled Briefing */}
      {nextBriefing && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Next Scheduled Briefing</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">{nextBriefing.title}</h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Upcoming
              </span>
            </div>

            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {formatDate(nextBriefing.scheduledAt)}
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {formatTime(nextBriefing.scheduledAt)}
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {nextBriefing.analysts.length} analyst{nextBriefing.analysts.length !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Agenda */}
            {nextBriefing.agenda && nextBriefing.agenda.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Agenda</h4>
                <ul className="space-y-2">
                  {nextBriefing.agenda.map((item, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-700">
                      <span className="w-4 h-4 mt-0.5 mr-2 text-gray-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Analysts */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Participating Analysts</h4>
              <div className="flex flex-wrap gap-2">
                {nextBriefing.analysts.map((analyst) => (
                  <div key={analyst.id} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-xs">
                    <span className="font-medium">
                      {analyst.firstName} {analyst.lastName}
                    </span>
                    {analyst.company && (
                      <span className="text-gray-500 ml-1">• {analyst.company}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!latestBriefing && !nextBriefing && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500">No briefings found.</div>
        </div>
      )}
    </div>
  )
}