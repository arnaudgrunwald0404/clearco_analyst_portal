import { PostAnalysis, RawSocialPost } from './types'
import { 
  INDUSTRY_KEYWORDS, 
  THEME_CATEGORIES, 
  SENTIMENT_KEYWORDS,
  MIN_RELEVANCE_SCORE 
} from './config'

export class PostAnalyzer {
  /**
   * Analyzes a social media post for relevance, sentiment, and themes
   */
  async analyzePost(post: RawSocialPost): Promise<PostAnalysis> {
    const content = post.content.toLowerCase()
    
    const analysis: PostAnalysis = {
      sentiment: this.analyzeSentiment(content),
      themes: this.extractThemes(content),
      relevanceScore: this.calculateRelevanceScore(content, post),
      keyEntities: this.extractEntities(content),
      topicCategories: this.categorizeTopics(content),
      language: this.detectLanguage(content)
    }

    return analysis
  }

  /**
   * Determines if a post should be stored based on relevance score
   */
  shouldStorePost(analysis: PostAnalysis): boolean {
    return analysis.relevanceScore >= MIN_RELEVANCE_SCORE
  }

  /**
   * Analyzes sentiment using keyword matching
   */
  private analyzeSentiment(content: string): 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' {
    const positiveCount = SENTIMENT_KEYWORDS.positive.filter(keyword => 
      content.includes(keyword)
    ).length

    const negativeCount = SENTIMENT_KEYWORDS.negative.filter(keyword => 
      content.includes(keyword)
    ).length

    if (positiveCount > negativeCount) return 'POSITIVE'
    if (negativeCount > positiveCount) return 'NEGATIVE'
    return 'NEUTRAL'
  }

  /**
   * Extracts relevant themes from the content
   */
  private extractThemes(content: string): string[] {
    const themes: string[] = []
    
    // Check for AI and automation themes
    if (this.containsKeywords(content, ['ai', 'artificial intelligence', 'machine learning', 'automation', 'bot'])) {
      themes.push('AI and Automation')
    }

    // Check for employee experience themes
    if (this.containsKeywords(content, ['employee experience', 'engagement', 'satisfaction', 'culture', 'workplace'])) {
      themes.push('Employee Experience')
    }

    // Check for talent acquisition themes
    if (this.containsKeywords(content, ['recruiting', 'recruitment', 'hiring', 'talent acquisition', 'candidate'])) {
      themes.push('Talent Acquisition')
    }

    // Check for future of work themes
    if (this.containsKeywords(content, ['future of work', 'remote work', 'hybrid', 'flexible work', 'digital nomad'])) {
      themes.push('Future of Work')
    }

    // Check for analytics themes
    if (this.containsKeywords(content, ['analytics', 'data', 'insights', 'metrics', 'dashboard', 'reporting'])) {
      themes.push('Analytics and Insights')
    }

    // Check for diversity and inclusion themes
    if (this.containsKeywords(content, ['diversity', 'inclusion', 'dei', 'bias', 'equity', 'belonging'])) {
      themes.push('Diversity and Inclusion')
    }

    // Check for performance management themes
    if (this.containsKeywords(content, ['performance', 'review', 'feedback', 'goal', 'okr', 'appraisal'])) {
      themes.push('Performance Management')
    }

    // Check for learning and development themes
    if (this.containsKeywords(content, ['learning', 'training', 'development', 'upskilling', 'reskilling', 'lms'])) {
      themes.push('Learning and Development')
    }

    return themes
  }

  /**
   * Calculates relevance score based on industry keywords and context
   */
  private calculateRelevanceScore(content: string, post: RawSocialPost): number {
    let score = 0

    // Base score for industry keywords
    const keywordMatches = INDUSTRY_KEYWORDS.filter(keyword => 
      content.includes(keyword.toLowerCase())
    ).length
    score += keywordMatches * 10

    // Bonus for hashtags related to HR/Tech
    if (post.hashtags) {
      const relevantHashtags = post.hashtags.filter(tag => 
        this.isRelevantHashtag(tag.toLowerCase())
      ).length
      score += relevantHashtags * 5
    }

    // Bonus for mentions of known companies/platforms
    const companyMentions = this.countCompanyMentions(content)
    score += companyMentions * 8

    // Bonus for engagement (indicates the post resonated)
    if (post.engagements > 100) score += 10
    if (post.engagements > 500) score += 15
    if (post.engagements > 1000) score += 20

    // Penalty for very short posts (likely not substantive)
    if (content.length < 50) score -= 10

    // Bonus for longer, more detailed posts
    if (content.length > 500) score += 10

    return Math.min(100, Math.max(0, score))
  }

  /**
   * Extracts key entities (companies, products, technologies)
   */
  private extractEntities(content: string): string[] {
    const entities: string[] = []
    
    // Common HR tech companies
    const companies = [
      'workday', 'successfactors', 'sap', 'oracle', 'adp', 'paychex',
      'bamboohr', 'zenefits', 'greenhouse', 'lever', 'indeed',
      'linkedin', 'microsoft', 'google', 'salesforce', 'zoom',
      'slack', 'teams', 'cornerstone', 'talentsoft'
    ]

    companies.forEach(company => {
      if (content.includes(company.toLowerCase())) {
        entities.push(company)
      }
    })

    // Technologies
    const technologies = [
      'artificial intelligence', 'machine learning', 'cloud computing',
      'saas', 'api', 'mobile app', 'analytics', 'blockchain'
    ]

    technologies.forEach(tech => {
      if (content.includes(tech.toLowerCase())) {
        entities.push(tech)
      }
    })

    return entities
  }

  /**
   * Categorizes content into topic areas
   */
  private categorizeTopics(content: string): string[] {
    const categories: string[] = []

    const categoryKeywords = {
      'HR Technology Platforms': ['platform', 'software', 'system', 'tool', 'solution'],
      'Digital Transformation': ['digital', 'transformation', 'modernization', 'cloud', 'digitization'],
      'Compliance and Legal': ['compliance', 'gdpr', 'regulation', 'legal', 'privacy', 'audit'],
      'Compensation and Benefits': ['compensation', 'benefits', 'salary', 'bonus', 'equity', 'stock'],
      'Data Privacy and Security': ['security', 'privacy', 'encryption', 'breach', 'cybersecurity']
    }

    Object.entries(categoryKeywords).forEach(([category, keywords]) => {
      if (this.containsKeywords(content, keywords)) {
        categories.push(category)
      }
    })

    return categories
  }

  /**
   * Simple language detection (English vs non-English)
   */
  private detectLanguage(content: string): string {
    // Simple heuristic: if it contains common English words, assume English
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']
    const englishWordCount = englishWords.filter(word => 
      content.toLowerCase().includes(` ${word} `)
    ).length

    return englishWordCount >= 2 ? 'en' : 'unknown'
  }

  /**
   * Helper method to check if content contains any of the given keywords
   */
  private containsKeywords(content: string, keywords: string[]): boolean {
    return keywords.some(keyword => content.includes(keyword.toLowerCase()))
  }

  /**
   * Checks if a hashtag is relevant to HR/Tech industry
   */
  private isRelevantHashtag(hashtag: string): boolean {
    const relevantTags = [
      'hrtech', 'hr', 'humanresources', 'futureofwork', 'ai', 'automation',
      'employeeexperience', 'talentmanagement', 'recruiting', 'diversity',
      'inclusion', 'remotework', 'hybridwork', 'digitalhr', 'peopleanalytics'
    ]
    
    return relevantTags.some(tag => hashtag.includes(tag))
  }

  /**
   * Counts mentions of known HR/Tech companies
   */
  private countCompanyMentions(content: string): number {
    const companies = [
      'workday', 'successfactors', 'adp', 'paychex', 'bamboohr',
      'zenefits', 'greenhouse', 'lever', 'cornerstone', 'oracle'
    ]
    
    return companies.filter(company => 
      content.includes(company.toLowerCase())
    ).length
  }
}
