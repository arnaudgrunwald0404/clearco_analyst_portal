export interface Briefing {
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
  contentUrl?: string | null
}

