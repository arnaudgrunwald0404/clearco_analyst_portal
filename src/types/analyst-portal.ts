export interface AnalystQuote {
  text: string
  author: string
  role?: string
}

export interface AnalystBriefing {
  id: string
  scheduledAt: string
  isConfirmed: boolean
  recordingUrl?: string
  transcriptUrl?: string
  summaryUrl?: string
  notes?: string
  proposedTopics?: string[]
}

export interface AnalystTestimonial {
  id: string
  text: string
  author: string
  company: string
  rating: number
  date: string
}

export interface AnalystPublication {
  id: string
  title: string
  status: 'DRAFT' | 'PLANNED' | 'IN_PROGRESS' | 'PUBLISHED' | 'CANCELLED'
  expectedDate?: string
  publishedDate?: string
  url?: string
  notes?: string
  isValidated: boolean
}