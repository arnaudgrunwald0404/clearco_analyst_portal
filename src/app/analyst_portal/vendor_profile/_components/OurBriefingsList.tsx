"use client"

import { useMemo, useState } from "react"
import { Calendar as CalendarIcon, Clock, Quote, FileText, Bot } from "lucide-react"
import Drawer from "@/app/briefings/components/drawer/Drawer"
import { cn } from "@/lib/utils"

interface Briefing {
  id: string
  title: string
  scheduledAt: string
  completedAt?: string | null
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED'
  duration?: number | null
  transcript?: string | null
  ai_summary?: any
  attendees?: string[][]
  analysts: { id: string; firstName?: string; lastName?: string; email?: string; company?: string }[]
  updatedAt?: string
}

export default function OurBriefingsList({ briefings }: { briefings: Briefing[] }) {
  const [selected, setSelected] = useState<Briefing | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'materials' | 'transcript'>('overview')

  const cards = useMemo(() => briefings || [], [briefings])

  const formatDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'TBD'
  const formatTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''

  const buildAttendeeMeta = (b: Briefing) => {
    const rows = Array.isArray(b.attendees) ? b.attendees : []
    const attendees = rows
      .filter((row) => Array.isArray(row) && row.length >= 1)
      .map((row) => ({ email: String(row[0] || ''), name: String(row[1] || ''), status: String(row[2] || '').toLowerCase() }))

    const invitedCount = attendees.length
    const attendingCount = attendees.filter(a => ['accepted', 'yes'].includes(a.status)).length

    const analystEmails = new Set((b.analysts || []).map(a => (a.email || '').toLowerCase()).filter(Boolean))
    const analystAttendees = attendees.filter(a => analystEmails.has(a.email.toLowerCase()))
    const analystsCount = analystAttendees.length || (b.analysts ? b.analysts.length : 0)

    const toNames = (list: { email: string; name: string }[]) => list.map(a => (a.name?.trim() ? a.name : a.email)).join(', ')

    const invitedTitle = attendees.length ? toNames(attendees) : 'No invitees'
    const attendingTitle = attendees.length ? (toNames(attendees.filter(a => ['accepted', 'yes'].includes(a.status))) || 'None confirmed') : 'None confirmed'
    const analystsTitle = analystAttendees.length
      ? toNames(analystAttendees)
      : (b.analysts || []).map(a => `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email || '').filter(Boolean).join(', ')

    return { invitedCount, attendingCount, analystsCount, invitedTitle, attendingTitle, analystsTitle }
  }

  return (
    <div className="space-y-3">
      {cards.map((b) => {
        const { invitedCount, attendingCount, analystsCount, invitedTitle, attendingTitle, analystsTitle } = buildAttendeeMeta(b)
        const hasArtifacts = Boolean(b.transcript) || Boolean(b.ai_summary)
        return (
          <button
            key={b.id}
            className={cn(
              'w-full text-left rounded-lg border border-2 bg-orange-50 p-4 hover:shadow-md transition-shadow border-orange-200'
            )}
            onClick={() => setSelected(b)}
          >
            {/* Date/time row with bold date */}
            <div className="text-lg font-semibold text-gray-700 mb-1 flex items-center">
              <CalendarIcon className="w-4 h-4 mr-1" />
              <span>{b.duration ? ` ${b.duration} minutes on ${formatDate(b.scheduledAt)}` : ''}</span>
              

              
            </div>
            {/* Title under date */}
            <div className="text-base text-gray-900 font-normal truncate mb-1">Meeting name: {b.title || 'Briefing'}</div>

            {/* Attendees summary */}
            <div className="flex items-center gap-1 text-sm text-gray-700">
              <span className="inline-flex items-center gap-1 py-0.5 " title={invitedTitle}>
                Invited: <strong>{invitedCount}</strong>
              </span>
              <span className="mx-1 text-gray-300">•</span>
              <span className="inline-flex items-center gap-1 py-0.5 text-green-700" title={attendingTitle}>
                Attending: <strong>{attendingCount}</strong>
              </span>
              <span className="mx-1 text-gray-300">•</span>
              <span className="inline-flex items-center gap-1 py-0.5 text-blue-700" title={analystsTitle}>
                Analysts: <strong>{analystsCount}</strong>
              </span>
            </div>

            {/* Badges */}
            {hasArtifacts && (
              <div className="mt-2 inline-flex items-center gap-2">
                {b.transcript && (
                  <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
                    <FileText className="w-3 h-3 mr-1" /> Transcript
                  </span>
                )}
                {b.ai_summary && (
                  <span className="inline-flex items-center text-xs text-purple-700 bg-purple-50 px-2 py-1 rounded">
                    <Bot className="w-3 h-3 mr-1" /> AI Summary
                  </span>
                )}
              </div>
            )}
          </button>
        )
      })}

      {selected && (
        <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl border-l border-gray-200 z-50">
            <Drawer
            key={`portal-briefing-drawer-${selected.id}-${selected.updatedAt}`}
            briefing={selected as any}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onClose={() => setSelected(null)}
            onUpdate={() => setSelected(null)}
          />
        </div>
      )}
    </div>
  )
}
