'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Video, FileText, FileSearch, MessageSquareText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { AnalystBriefing } from '@/types/analyst-portal'

interface AnalystBriefingCardProps {
  type: 'last' | 'next'
  briefing: AnalystBriefing | null
  className?: string
}

export function AnalystBriefingCard({ type, briefing, className }: AnalystBriefingCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), 'MMM d, yyyy')
    } catch (error) {
      return 'Date TBD'
    }
  }

  const renderContent = () => {
    if (type === 'last' && briefing) {
      return (
        <>
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <Calendar className="h-4 w-4" />
            <span>{formatDate(briefing.scheduledAt)}</span>
          </div>
          
          {isExpanded && (
            <div className="space-y-4 mt-4 border-t pt-4">
              {/* Recording */}
              {briefing.recordingUrl && (
                <a
                  href={briefing.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <Video className="h-5 w-5" />
                  <span>Watch Briefing Recording</span>
                </a>
              )}

              {/* Transcript */}
              {briefing.transcriptUrl && (
                <a
                  href={briefing.transcriptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FileText className="h-5 w-5" />
                  <span>View Briefing Transcript</span>
                </a>
              )}

              {/* Summary */}
              {briefing.summaryUrl && (
                <a
                  href={briefing.summaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <FileSearch className="h-5 w-5" />
                  <span>Read Briefing Summary</span>
                </a>
              )}

              {/* Notes */}
              {briefing.notes && (
                <div className="flex items-start gap-3 text-gray-600">
                  <MessageSquareText className="h-5 w-5 flex-shrink-0 mt-1" />
                  <p className="text-sm">{briefing.notes}</p>
                </div>
              )}
            </div>
          )}
        </>
      )
    }

    if (type === 'next') {
      return (
        <>
          <div className="flex items-center gap-2 text-gray-600 mb-4">
            <Calendar className="h-4 w-4" />
            <span className="flex items-center gap-2">
              {briefing?.scheduledAt ? (
                formatDate(briefing.scheduledAt)
              ) : (
                'Date to be determined'
              )}
              {!briefing?.isConfirmed && (
                <span className="flex items-center text-amber-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Tentative
                </span>
              )}
            </span>
          </div>

          {isExpanded && briefing && (
            <div className="space-y-4 mt-4 border-t pt-4">
              {briefing.proposedTopics && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-700">Proposed Briefing Topics:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {briefing.proposedTopics.map((topic: string, index: number) => (
                      <li key={index}>{topic}</li>
                    ))}
                  </ul>
                </div>
              )}

              {briefing.notes && (
                <div className="flex items-start gap-3 text-gray-600">
                  <MessageSquareText className="h-5 w-5 flex-shrink-0 mt-1" />
                  <p className="text-sm">{briefing.notes}</p>
                </div>
              )}
            </div>
          )}
        </>
      )
    }

    return null
  }

  return (
    <div className={cn('p-6', className)}>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {type === 'last' ? 'Last Analyst Briefing' : 'Next Analyst Briefing'}
      </h2>

      {briefing ? (
        <>
          {renderContent()}
          <Button
            variant="ghost"
            className="mt-4"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </Button>
        </>
      ) : (
        <p className="text-gray-500 italic">
          {type === 'last' 
            ? 'No previous analyst briefing found'
            : 'No upcoming analyst briefing scheduled yet'
          }
        </p>
      )}
    </div>
  )
}