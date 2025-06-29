import { SocialPlatformConfig } from './types'

export const PLATFORM_CONFIGS: Record<string, SocialPlatformConfig> = {
  twitter: {
    name: 'twitter',
    rateLimit: 180, // requests per 15-minute window
    searchDelay: 10000, // 10 seconds between requests (more conservative)
  },
  linkedin: {
    name: 'linkedin',
    rateLimit: 100, // requests per hour (conservative)
    searchDelay: 10000, // 10 seconds between requests
  }
}

// Keywords that indicate HR/Tech industry relevance
export const INDUSTRY_KEYWORDS = [
  // HR Technology
  'hr tech', 'hrtech', 'human resources', 'talent management', 'workforce',
  'employee experience', 'people analytics', 'hr analytics', 'payroll',
  'recruiting', 'recruitment', 'onboarding', 'performance management',
  'learning management', 'lms', 'succession planning', 'compensation',
  
  // AI and Future of Work
  'artificial intelligence', 'machine learning', 'ai in hr', 'automation',
  'future of work', 'remote work', 'hybrid work', 'digital transformation',
  'employee engagement', 'workplace culture', 'diversity', 'inclusion',
  
  // Company Technologies and Competitors
  'workday', 'successfactors', 'cornerstonecore', 'bamboohr', 'adp',
  'paychex', 'zenefits', 'greenhouse', 'lever', 'indeed', 'linkedin talent',
  'slack', 'microsoft teams', 'zoom', 'salesforce', 'oracle hcm',
  
  // Industry Trends
  'employee retention', 'great resignation', 'quiet quitting', 'upskilling',
  'reskilling', 'gig economy', 'contractor management', 'compliance',
  'gdpr', 'data privacy', 'security', 'cloud hr', 'mobile hr'
]

// Themes for categorization
export const THEME_CATEGORIES = [
  'AI and Automation',
  'Employee Experience',
  'Talent Acquisition',
  'Performance Management',
  'Learning and Development',
  'Analytics and Insights',
  'Future of Work',
  'Diversity and Inclusion',
  'Compensation and Benefits',
  'HR Technology Platforms',
  'Compliance and Legal',
  'Workplace Culture',
  'Remote and Hybrid Work',
  'Digital Transformation',
  'Data Privacy and Security'
]

// Minimum relevance score to store a post
export const MIN_RELEVANCE_SCORE = 30

// Maximum posts to fetch per analyst per day
export const MAX_POSTS_PER_ANALYST_PER_DAY = 50

// How far back to look for posts (in days)
export const LOOKBACK_DAYS = 7

// Sentiment analysis keywords
export const SENTIMENT_KEYWORDS = {
  positive: [
    'excellent', 'outstanding', 'innovative', 'breakthrough', 'impressive',
    'game-changer', 'revolutionary', 'excited', 'love', 'amazing',
    'fantastic', 'brilliant', 'perfect', 'successful', 'thrilled'
  ],
  negative: [
    'terrible', 'awful', 'disappointed', 'frustrated', 'broken', 'failed',
    'disaster', 'horrible', 'worst', 'hate', 'annoying', 'useless',
    'catastrophic', 'nightmare', 'concerning'
  ]
}
