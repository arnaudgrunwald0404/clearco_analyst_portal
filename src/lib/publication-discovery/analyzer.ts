import { 
  RawSearchResult, 
  PublicationAnalysis, 
  PublicationType, 
  ProcessedPublication 
} from './types'
import { 
  SIGNIFICANCE_INDICATORS, 
  PUBLICATION_PATTERNS, 
  RELEVANT_TOPICS, 
  THRESHOLDS 
} from './config'
import { calculateCharacterSimilarity } from '../utils/similarity'

export class PublicationAnalyzer {
  /**
   * Analyzes a search result to determine if it's a relevant publication
   */
  async analyzeResult(
    result: RawSearchResult, 
    analystName: string, 
    analystCompany: string
  ): Promise<PublicationAnalysis> {
    const content = `${result.title} ${result.snippet}`.toLowerCase()
    
    const analysis: PublicationAnalysis = {
      isRelevant: false,
      relevanceScore: 0,
      publicationType: PublicationType.OTHER,
      significance: 'low',
      themes: [],
      keyTopics: [],
      estimatedImpact: 0
    }

    // Calculate relevance score
    analysis.relevanceScore = this.calculateRelevanceScore(content, analystName, analystCompany)
    
    // Determine if relevant based on threshold
    analysis.isRelevant = analysis.relevanceScore >= THRESHOLDS.minRelevanceScore
    
    if (!analysis.isRelevant) {
      analysis.reason = `Low relevance score: ${analysis.relevanceScore}`
      return analysis
    }

    // Identify publication type
    analysis.publicationType = this.identifyPublicationType(content, result.domain)
    
    // Determine significance level
    analysis.significance = this.determineSignificance(content, analysis.publicationType)
    
    // Extract themes and topics
    analysis.themes = this.extractThemes(content)
    analysis.keyTopics = this.extractKeyTopics(content)
    
    // Calculate estimated impact
    analysis.estimatedImpact = this.calculateImpactScore(
      analysis.publicationType,
      analysis.significance,
      result.domain,
      content
    )

    return analysis
  }

  /**
   * Processes a raw result into a structured publication
   */
  async processResult(
    result: RawSearchResult,
    analysis: PublicationAnalysis,
    analystId: string,
    searchQuery: string
  ): Promise<ProcessedPublication> {
    const publishedAt = result.publishedDate ? 
      new Date(result.publishedDate) : 
      this.estimatePublishDate(result.snippet)

    return {
      analystId,
      title: result.title,
      url: result.url,
      summary: this.generateSummary(result.snippet, analysis),
      type: analysis.publicationType,
      publishedAt,
      discoveredAt: new Date(),
      source: result.source,
      domain: result.domain,
      relevanceScore: analysis.relevanceScore,
      significance: analysis.significance,
      themes: analysis.themes,
      keyTopics: analysis.keyTopics,
      estimatedImpact: analysis.estimatedImpact,
      isProcessed: true,
      isArchived: false,
      searchQuery,
      rawData: result
    }
  }

  /**
   * Calculates relevance score based on multiple factors
   */
  private calculateRelevanceScore(
    content: string, 
    analystName: string, 
    analystCompany: string
  ): number {
    let score = 0
    const name = analystName.toLowerCase()
    const company = analystCompany.toLowerCase()

    // Exact name match (high weight)
    if (content.includes(`"${name}"`)) {
      score += 40
    } else if (content.includes(name)) {
      score += 25
    }

    // Company mention
    if (content.includes(company)) {
      score += 15
    }

    // HR/Talent topic relevance
    const topicMatches = RELEVANT_TOPICS.filter(topic => 
      content.includes(topic.toLowerCase())
    ).length
    score += Math.min(topicMatches * 3, 25)

    // Publication type indicators
    Object.values(PUBLICATION_PATTERNS).flat().forEach(pattern => {
      if (content.includes(pattern.toLowerCase())) {
        score += 5
      }
    })

    // Significance indicators
    Object.entries(SIGNIFICANCE_INDICATORS).forEach(([level, indicators]) => {
      indicators.forEach(indicator => {
        if (content.includes(indicator.toLowerCase())) {
          switch (level) {
            case 'critical': score += 15; break
            case 'high': score += 10; break
            case 'medium': score += 5; break
            case 'low': score += 2; break
          }
        }
      })
    })

    return Math.min(100, score)
  }

  /**
   * Identifies the type of publication based on content patterns
   */
  private identifyPublicationType(content: string, domain: string): PublicationType {
    // Check each publication type pattern
    for (const [type, patterns] of Object.entries(PUBLICATION_PATTERNS)) {
      for (const pattern of patterns) {
        if (content.includes(pattern.toLowerCase())) {
          return type as PublicationType
        }
      }
    }

    // Domain-based classification
    if (domain.includes('linkedin.com')) {
      return PublicationType.LINKEDIN_POST
    }
    if (domain.includes('twitter.com')) {
      return PublicationType.BLOG_POST
    }
    if (domain.includes('gartner.com') || domain.includes('forrester.com')) {
      return PublicationType.RESEARCH_REPORT
    }

    return PublicationType.OTHER
  }

  /**
   * Determines significance level based on content and type
   */
  private determineSignificance(
    content: string, 
    publicationType: PublicationType
  ): 'low' | 'medium' | 'high' | 'critical' {
    // Type-based significance
    switch (publicationType) {
      case PublicationType.MAGIC_QUADRANT:
      case PublicationType.FORRESTER_WAVE:
        return 'critical'
      
      case PublicationType.RESEARCH_REPORT:
      case PublicationType.SURVEY_RESULTS:
      case PublicationType.TOP_LIST:
        return 'high'
      
      case PublicationType.MARKET_ANALYSIS:
      case PublicationType.WHITEPAPER:
        return 'medium'
      
      default:
        break
    }

    // Content-based significance
    for (const [level, indicators] of Object.entries(SIGNIFICANCE_INDICATORS)) {
      for (const indicator of indicators) {
        if (content.includes(indicator.toLowerCase())) {
          return level as 'low' | 'medium' | 'high' | 'critical'
        }
      }
    }

    return 'low'
  }

  /**
   * Extracts themes from content
   */
  private extractThemes(content: string): string[] {
    const themes: string[] = []
    
    const themeKeywords = {
      'AI and Automation': ['ai', 'artificial intelligence', 'automation', 'machine learning'],
      'Digital Transformation': ['digital transformation', 'digitization', 'cloud'],
      'Employee Experience': ['employee experience', 'engagement', 'culture'],
      'Future of Work': ['future of work', 'remote work', 'hybrid work'],
      'Talent Management': ['talent management', 'recruitment', 'hiring'],
      'Analytics': ['analytics', 'data', 'insights', 'metrics'],
      'Performance Management': ['performance', 'review', 'feedback'],
      'Learning and Development': ['learning', 'training', 'development'],
      'Compensation': ['compensation', 'benefits', 'payroll'],
      'HR Technology': ['hr technology', 'hrtech', 'hris', 'hcm']
    }

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword.toLowerCase()))) {
        themes.push(theme)
      }
    })

    return themes
  }

  /**
   * Extracts key topics from content
   */
  private extractKeyTopics(content: string): string[] {
    return RELEVANT_TOPICS.filter(topic => 
      content.includes(topic.toLowerCase())
    ).slice(0, 10) // Limit to top 10 topics
  }

  /**
   * Calculates estimated impact score
   */
  private calculateImpactScore(
    type: PublicationType,
    significance: 'low' | 'medium' | 'high' | 'critical',
    domain: string,
    content: string
  ): number {
    let score = 0

    // Base score by type
    const typeScores = {
      [PublicationType.MAGIC_QUADRANT]: 90,
      [PublicationType.FORRESTER_WAVE]: 85,
      [PublicationType.RESEARCH_REPORT]: 70,
      [PublicationType.SURVEY_RESULTS]: 65,
      [PublicationType.TOP_LIST]: 60,
      [PublicationType.MARKET_ANALYSIS]: 55,
      [PublicationType.WHITEPAPER]: 45,
      [PublicationType.INTERVIEW]: 40,
      [PublicationType.LINKEDIN_POST]: 30,
      [PublicationType.BLOG_POST]: 25,
      [PublicationType.OTHER]: 20
    }

    score += typeScores[type] || 20

    // Significance multiplier
    const significanceMultipliers = {
      'critical': 1.2,
      'high': 1.1,
      'medium': 1.0,
      'low': 0.8
    }
    score *= significanceMultipliers[significance]

    // Domain authority bonus
    const authorityDomains = ['gartner.com', 'forrester.com', 'idc.com', 'harvard.edu']
    if (authorityDomains.some(d => domain.includes(d))) {
      score += 10
    }

    return Math.min(100, Math.round(score))
  }

  /**
   * Estimates publish date from content if not provided
   */
  private estimatePublishDate(snippet: string): Date {
    // Look for date patterns in snippet
    const datePatterns = [
      /(\d{4})/g, // Year
      /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),?\s+(\d{4})/gi,
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/g
    ]

    for (const pattern of datePatterns) {
      const match = snippet.match(pattern)
      if (match) {
        try {
          const date = new Date(match[0])
          if (date.getFullYear() >= 2020 && date.getFullYear() <= new Date().getFullYear()) {
            return date
          }
        } catch {
          continue
        }
      }
    }

    // Default to current date if no date found
    return new Date()
  }

  /**
   * Generates a concise summary of the publication
   */
  private generateSummary(snippet: string, analysis: PublicationAnalysis): string {
    const typeLabel = analysis.publicationType.replace('_', ' ').toLowerCase()
    const significanceLabel = analysis.significance
    
    let summary = `${significanceLabel.charAt(0).toUpperCase() + significanceLabel.slice(1)} significance ${typeLabel}`
    
    if (analysis.themes.length > 0) {
      summary += ` covering ${analysis.themes.slice(0, 3).join(', ')}`
    }
    
    // Add snippet excerpt
    const excerptLength = 150
    const cleanSnippet = snippet.replace(/[^\w\s.,!?]/g, '').trim()
    if (cleanSnippet.length > excerptLength) {
      summary += `. ${cleanSnippet.substring(0, excerptLength)}...`
    } else {
      summary += `. ${cleanSnippet}`
    }

    return summary
  }

  /**
   * Checks if a publication is a duplicate of existing ones
   */
  async isDuplicate(
    newPublication: ProcessedPublication,
    existingPublications: ProcessedPublication[]
  ): Promise<boolean> {
    for (const existing of existingPublications) {
      // URL match
      if (existing.url === newPublication.url) {
        return true
      }

      // Title similarity
      const titleSimilarity = calculateCharacterSimilarity(
        existing.title.toLowerCase(),
        newPublication.title.toLowerCase()
      )
      
      if (titleSimilarity > THRESHOLDS.maxDuplicateSimilarity) {
        // Check if published within threshold hours
        const hoursDiff = Math.abs(
          existing.publishedAt.getTime() - newPublication.publishedAt.getTime()
        ) / (1000 * 60 * 60)
        
        if (hoursDiff <= THRESHOLDS.minWordCount) {
          return true
        }
      }
    }

    return false
  }


}
