'use client'

import { Briefing } from '@/app/briefings/types'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, Clock, Users, Calendar, FileText, Mic, CheckSquare } from 'lucide-react'

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(dateString: string) {
  return new Date(dateString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return {
    date: formatDate(dateString),
    time: formatTime(dateString),
    isUpcoming: date > new Date(),
  }
}

export default function BriefingCard({
  briefing,
  onSelect,
  isUpcoming,
}: {
  briefing: Briefing
  onSelect: (briefing: Briefing) => void
  isUpcoming: boolean
}) {
  const { date, time } = formatDateTime(briefing.scheduledAt)
  const hasTranscript = !!(briefing.transcript && briefing.transcript.trim())

  // Calculate follow-up status
  const getFollowUpState = (followUpId: string) => {
    if (typeof window === 'undefined') return { isCompleted: false }
    const saved = localStorage.getItem(`followup-${followUpId}`)
    return saved ? JSON.parse(saved) : { isCompleted: false }
  }

  const followUpActions = briefing.followUpActions || []
  const totalFollowUps = followUpActions.length
const completedFollowUps = followUpActions.filter((_: any, index: number) =>
    getFollowUpState(`${briefing.id}-${index}`).isCompleted
  ).length

  const hasFollowUps = totalFollowUps > 0
  const hasOverdueFollowUps = hasFollowUps && completedFollowUps < totalFollowUps

  // Prepare attendees breakdown
  const attendeeRows = Array.isArray(briefing.attendees) ? briefing.attendees : []
  const attendees = attendeeRows
    .filter((row: any) => Array.isArray(row) && row.length >= 1)
    .map((row: any) => {
      const email = (row[0] || '').toString()
      const name = (row[1] || '').toString()
      const status = (row[2] || '').toString().toLowerCase()
      return { email, name, status }
    })

  const invitedCount = attendees.length
const attendingCount = attendees.filter((a: any) => ['accepted', 'yes'].includes(a.status)).length

  const analystEmails = new Set(
    Array.isArray(briefing.analysts)
      ? briefing.analysts.map((a: any) => (a?.email || '').toLowerCase()).filter(Boolean)
      : []
  )
const analystAttendees = attendees.filter((a: any) => analystEmails.has(a.email.toLowerCase()))
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
      className={cn(
        "rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer",
        hasTranscript 
          ? "bg-pink-100 border-pink-200 hover:border-pink-400" 
          : "bg-white border-pink-200"
      )}
      onClick={() => onSelect(briefing)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center relative',
              hasTranscript 
                ? 'bg-pink-100 border border-pink-400' 
                : isUpcoming 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100'
            )}
          >
            {hasTranscript ? (
              <Calendar className="w-6 h-6 text-pink-600" />
            ) : (
              <Calendar className={cn('w-6 h-6', isUpcoming ? 'text-blue-600' : 'text-gray-600')} />
            )}
            
            {/* Transcript Badge */}
            {hasTranscript && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-600 rounded-full flex items-center justify-center">
                <FileText className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{briefing.title}</h3>
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
            </div>

            {/* Attendees summary row */}
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

        {/* Follow-up Indicator */}
        {hasFollowUps && (
          <div className="flex-shrink-0 flex items-center space-x-2">
            <div className={cn(
              'flex items-center px-3 py-1.5 rounded-lg text-sm font-medium',
              hasOverdueFollowUps 
                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            )}>
              <CheckSquare className={cn(
                'w-4 h-4 mr-2',
                hasOverdueFollowUps ? 'text-amber-600' : 'text-green-600'
              )} />
              <span>
                {completedFollowUps} of {totalFollowUps} follow-ups {completedFollowUps < totalFollowUps ? 'due' : 'done'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

