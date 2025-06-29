import { SearchConfig, PublicationType } from './types'

export const DISCOVERY_CONFIG: SearchConfig = {
  maxResultsPerQuery: 20,
  minRelevanceScore: 60,
  enabledSources: [
    'gartner.com',
    'forrester.com',
    'idc.com',
    'nelsonhall.com',
    'linkedin.com',
    'twitter.com',
    'everestgrp.com',
    'hfsresearch.com',
    'researchgate.net',
    'arxiv.org'
  ],
  searchDepthDays: 30,
  duplicateThresholdHours: 24
}

// Search query templates for different types of content
export const SEARCH_TEMPLATES = {
  research_reports: [
    '"{name}" research report {year}',
    '"{name}" market analysis {year}',
    '"{name}" {company} report {year}',
    '"{name}" study survey {year}'
  ],
  analyst_pieces: [
    '"{name}" Magic Quadrant {year}',
    '"{name}" Forrester Wave {year}',
    '"{name}" market guide {year}',
    '"{name}" {company} analysis {year}'
  ],
  rankings_lists: [
    '"{name}" top companies list {year}',
    '"{name}" industry ranking {year}',
    '"{name}" best practices {year}',
    '"{name}" leaders report {year}'
  ],
  linkedin_significant: [
    'site:linkedin.com "{name}" "top 100" OR "top 50" OR "market leaders"',
    'site:linkedin.com "{name}" "survey results" OR "study findings"',
    'site:linkedin.com "{name}" "research shows" OR "analysis reveals"'
  ],
  general_mentions: [
    '"{name}" {company} HR technology',
    '"{name}" {company} talent management',
    '"{name}" {company} employee experience',
    '"{name}" {company} future of work'
  ]
}

// Keywords that indicate high-significance content
export const SIGNIFICANCE_INDICATORS = {
  critical: [
    'magic quadrant',
    'forrester wave',
    'market leader',
    'top 10',
    'top 20',
    'industry report',
    'market analysis',
    'survey results',
    'research findings'
  ],
  high: [
    'market guide',
    'analyst report',
    'research paper',
    'whitepaper',
    'study results',
    'industry insights',
    'market trends',
    'competitive landscape'
  ],
  medium: [
    'blog post',
    'article',
    'opinion piece',
    'interview',
    'webinar',
    'conference presentation',
    'panel discussion'
  ],
  low: [
    'social media post',
    'brief mention',
    'comment',
    'quote',
    'reference'
  ]
}

// Content patterns that help identify publication types
export const PUBLICATION_PATTERNS = {
  [PublicationType.MAGIC_QUADRANT]: [
    'magic quadrant',
    'gartner magic quadrant',
    'mq for',
    'leaders quadrant',
    'challengers quadrant'
  ],
  [PublicationType.FORRESTER_WAVE]: [
    'forrester wave',
    'wave report',
    'wave evaluation',
    'forrester wave report'
  ],
  [PublicationType.RESEARCH_REPORT]: [
    'research report',
    'market research',
    'industry report',
    'analysis report',
    'market study'
  ],
  [PublicationType.SURVEY_RESULTS]: [
    'survey results',
    'survey findings',
    'study results',
    'research findings',
    'poll results'
  ],
  [PublicationType.TOP_LIST]: [
    'top 10',
    'top 20',
    'top 50',
    'top 100',
    'best companies',
    'leading vendors',
    'top performers'
  ],
  [PublicationType.MARKET_ANALYSIS]: [
    'market analysis',
    'market overview',
    'market trends',
    'market insights',
    'competitive analysis'
  ],
  [PublicationType.WHITEPAPER]: [
    'white paper',
    'whitepaper',
    'technical paper',
    'research paper'
  ],
  [PublicationType.WEBINAR]: [
    'webinar',
    'online seminar',
    'virtual event',
    'live session'
  ],
  [PublicationType.INTERVIEW]: [
    'interview',
    'q&a',
    'conversation with',
    'speaks with',
    'discussion with'
  ],
  [PublicationType.LINKEDIN_POST]: [
    'linkedin.com',
    'linkedin post',
    'linkedin article'
  ]
}

// Topics relevant to HR/Talent Management space
export const RELEVANT_TOPICS = [
  'hr technology',
  'human resources',
  'talent management',
  'employee experience',
  'workforce analytics',
  'people analytics',
  'hr analytics',
  'talent acquisition',
  'recruitment',
  'onboarding',
  'performance management',
  'learning management',
  'succession planning',
  'compensation management',
  'benefits administration',
  'payroll',
  'hris',
  'hrms',
  'hcm',
  'ats',
  'lms',
  'employee engagement',
  'culture',
  'diversity',
  'inclusion',
  'dei',
  'remote work',
  'hybrid work',
  'future of work',
  'digital transformation',
  'ai in hr',
  'machine learning',
  'automation',
  'chatbots',
  'employee self-service',
  'mobile hr',
  'cloud hr'
]

// Domains to prioritize for searching
export const PRIORITY_DOMAINS = [
  'gartner.com',
  'forrester.com',
  'idc.com',
  'nelsonhall.com',
  'everestgrp.com',
  'hfsresearch.com',
  'linkedin.com',
  'twitter.com',
  'medium.com',
  'harvard.edu',
  'mit.edu',
  'stanford.edu',
  'wharton.upenn.edu',
  'kellogg.northwestern.edu'
]

// Rate limiting configuration
export const RATE_LIMITS = {
  google: {
    requestsPerDay: 100,
    requestsPerMinute: 10,
    delayBetweenRequests: 6000 // 6 seconds
  },
  bing: {
    requestsPerDay: 1000,
    requestsPerMinute: 20,
    delayBetweenRequests: 3000 // 3 seconds
  },
  linkedin: {
    requestsPerDay: 500,
    requestsPerMinute: 10,
    delayBetweenRequests: 6000 // 6 seconds
  }
}

// Minimum thresholds for content significance
export const THRESHOLDS = {
  minWordCount: 100,
  minRelevanceScore: 60,
  maxDuplicateSimilarity: 0.8,
  minImpactScore: 50
}
