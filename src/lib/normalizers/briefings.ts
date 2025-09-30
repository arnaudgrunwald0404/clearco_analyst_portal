import type { Briefing } from '@/app/briefings/types'

export function normalizeBriefing(raw: any): Briefing {
  return {
    id: raw.id,
    title: raw.title || 'Briefing',
    description: raw.description,
    scheduledAt: raw.scheduledAt,
    completedAt: raw.completedAt,
    status: (raw.status || (raw.completedAt ? 'COMPLETED' : 'SCHEDULED')) as Briefing['status'],
    agenda: Array.isArray(raw.agenda) ? raw.agenda : [],
    notes: raw.notes || '',
    outcomes: Array.isArray(raw.outcomes) ? raw.outcomes : [],
    followUpActions: Array.isArray(raw.followUpActions) ? raw.followUpActions : [],
    recordingUrl: raw.recordingUrl || null,
    transcript: raw.transcript || '',
    ai_summary: raw.ai_summary,
    duration: typeof raw.duration === 'number' ? raw.duration : undefined,
    attendeeEmails: Array.isArray(raw.attendeeEmails) ? raw.attendeeEmails : [],
    attendees: Array.isArray(raw.attendees) ? raw.attendees : [],
    analysts: Array.isArray(raw.analysts) ? raw.analysts : [],
    calendarMeeting: raw.calendarMeeting || undefined,
    createdAt: raw.createdAt || raw.scheduledAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || raw.scheduledAt || new Date().toISOString(),
    contentUrl: raw.contentUrl ?? null,
  }
}
