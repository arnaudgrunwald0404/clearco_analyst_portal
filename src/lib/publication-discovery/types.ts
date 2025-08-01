export interface SearchQuery {
  analystId: string
  analystName: string
  company: string
  searchTerms: string[]
  timeRange: 'last_week' | 'last_month' | 'last_3_months' | 'last_year'
}

export interface RawSearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
  source: string
  domain: string
  searchEngine: 'google' | 'bing' | 'linkedin' | 'twitter' | 'duckduckgo' | 'linkedin-public'
}

export interface PublicationAnalysis {
  isRelevant: boolean
  relevanceScore: number // 0-100
  publicationType: PublicationType
  significance: 'low' | 'medium' | 'high' | 'critical'
  themes: string[]
  keyTopics: string[]
  estimatedImpact: number // 0-100
  reason?: string // why it was filtered out
}

export enum PublicationType {
  RESEARCH_REPORT = 'RESEARCH_REPORT',
  MAGIC_QUADRANT = 'MAGIC_QUADRANT',
  FORRESTER_WAVE = 'FORRESTER_WAVE',
  MARKET_ANALYSIS = 'MARKET_ANALYSIS',
  SURVEY_RESULTS = 'SURVEY_RESULTS',
  TOP_LIST = 'TOP_LIST',
  INDUSTRY_RANKING = 'INDUSTRY_RANKING',
  WHITEPAPER = 'WHITEPAPER',
  WEBINAR = 'WEBINAR',
  CONFERENCE_PRESENTATION = 'CONFERENCE_PRESENTATION',
  BLOG_POST = 'BLOG_POST',
  LINKEDIN_POST = 'LINKEDIN_POST',
  PRESS_RELEASE = 'PRESS_RELEASE',
  INTERVIEW = 'INTERVIEW',
  PODCAST = 'PODCAST',
  OTHER = 'OTHER'
}

export interface ProcessedPublication {
  id?: string
  analystId: string
  title: string
  url: string
  content?: string
  summary: string
  type: PublicationType
  publishedAt: Date
  discoveredAt: Date
  source: string
  domain: string
  relevanceScore: number
  significance: 'low' | 'medium' | 'high' | 'critical'
  themes: string[]
  keyTopics: string[]
  estimatedImpact: number
  isProcessed: boolean
  isArchived: boolean
  searchQuery: string
  rawData?: any
}

export interface DiscoveryJob {
  id: string
  analystId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  startedAt?: Date
  completedAt?: Date
  searchQueries: SearchQuery[]
  resultsFound: number
  publicationsCreated: number
  error?: string
  summary?: {
    criticalFindings: number
    highSignificance: number
    mediumSignificance: number
    lowSignificance: number
    totalProcessed: number
    duplicatesFiltered: number
  }
}

export interface DiscoveryStats {
  totalJobs: number
  activeJobs: number
  publicationsFound: number
  publicationsToday: number
  lastSuccessfulRun: Date
  failedJobs: number
  averageRelevanceScore: number
  topSources: Array<{ domain: string; count: number }>
}

export interface SearchConfig {
  maxResultsPerQuery: number
  minRelevanceScore: number
  enabledSources: string[]
  searchDepthDays: number
  duplicateThresholdHours: number
}

export interface NewsFeedItem {
  id: string
  type: 'publication_discovered' | 'high_impact_content' | 'analyst_mentioned'
  title: string
  description: string
  analystId: string
  analystName: string
  publicationId?: string
  publishedAt: Date
  discoveredAt: Date
  significance: 'low' | 'medium' | 'high' | 'critical'
  isRead: boolean
  url?: string
  source?: string
}
