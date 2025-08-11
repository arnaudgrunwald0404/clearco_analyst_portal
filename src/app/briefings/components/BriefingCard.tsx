'use client'

import { Briefing } from '../../types'
import { cn } from '@/lib/utils'
import { Calendar as CalendarIcon, Clock, Users, Calendar, FileText, Mic } from 'lucide-react'

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

  return (
    <div
      className={cn(
        "rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer",
        hasTranscript 
          ? "bg-orange-50 border-orange-200 hover:border-orange-300" 
          : "bg-white border-gray-200"
      )}
      onClick={() => onSelect(briefing)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4 flex-1">
          <div
            className={cn(
              'flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center relative',
              hasTranscript 
                ? 'bg-orange-100' 
                : isUpcoming 
                  ? 'bg-blue-100' 
                  : 'bg-gray-100'
            )}
          >
            {hasTranscript ? (
              <Mic className="w-6 h-6 text-orange-600" />
            ) : (
              <Calendar className={cn('w-6 h-6', isUpcoming ? 'text-blue-600' : 'text-gray-600')} />
            )}
            
            {/* Transcript Badge */}
            {hasTranscript && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
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
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {briefing.analysts.length} analyst{briefing.analysts.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

