import OpenAI from 'openai'

interface AnalystProfile {
  id: string
  firstName: string
  lastName: string
  company: string
  email: string
  personalWebsite?: string
  expertise?: string[]
  linkedinUrl?: string
  twitterHandle?: string
}

interface DiscoveredPublication {
  title: string
  summary: string
  url: string
  publishedAt: string
  type: 'RESEARCH_REPORT' | 'BLOG_POST' | 'WHITEPAPER' | 'WEBINAR' | 'PODCAST' | 'ARTICLE' | 'OTHER'
  relevanceScore: number
  keyTopics: string[]
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW'
  extractedMetadata?: {
    author?: string
    publicationVenue?: string
    readingTime?: string
    downloadUrl?: string
  }
}

interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export class OpenAIPublicationDiscovery {
  private openai: OpenAI
  private googleApiKey: string
  private googleCseId: string

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required')
    }

    this.openai = new OpenAI({ apiKey })
    this.googleApiKey = process.env.GOOGLE_SEARCH_API_KEY || ''
    this.googleCseId = process.env.GOOGLE_SEARCH_ENGINE_ID || ''
  }

  /**
   * Discover publications for a specific analyst using AI-powered analysis
   */
  async discoverPublications(analyst: AnalystProfile): Promise<DiscoveredPublication[]> {
    try {
      console.log(`🔍 Starting AI-powered discovery for ${analyst.firstName} ${analyst.lastName}`)

      // Step 1: Generate intelligent search queries
      const searchQueries = await this.generateSearchQueries(analyst)
      console.log(`📝 Generated ${searchQueries.length} search queries`)

      // Step 2: Perform targeted searches
      const allSearchResults: SearchResult[] = []
      for (const query of searchQueries.slice(0, 3)) { // Limit to top 3 queries to avoid rate limits
        const results = await this.performGoogleSearch(query)
        allSearchResults.push(...results)
        
        // Add delay between searches to be respectful
        await new Promise(resolve => setTimeout(resolve, 1000))
      }

      console.log(`🔍 Found ${allSearchResults.length} total search results`)

      // Step 3: AI-powered content analysis and extraction
      const publications = await this.analyzeSearchResults(analyst, allSearchResults)
      
      console.log(`📚 Extracted ${publications.length} publications`)
      
      return publications

    } catch (error) {
      console.error(`Error discovering publications for ${analyst.firstName} ${analyst.lastName}:`, error)
      return []
    }
  }

  /**
   * Generate intelligent search queries tailored to the analyst
   */
  private async generateSearchQueries(analyst: AnalystProfile): Promise<string[]> {
    const prompt = `You are an expert research assistant. Generate 5 highly specific and effective Google search queries to find recent publications, research reports, blog posts, and thought leadership content by this industry analyst:

Name: ${analyst.firstName} ${analyst.lastName}
Company: ${analyst.company}
Email Domain: ${analyst.email.split('@')[1]}
Personal Website: ${analyst.personalWebsite || 'Not provided'}
LinkedIn: ${analyst.linkedinUrl || 'Not provided'}
Twitter: ${analyst.twitterHandle || 'Not provided'}

IMPORTANT GUIDELINES:
1. Focus on finding their WRITTEN CONTENT (reports, blogs, articles, whitepapers)
2. Use specific industry terminology and their company name
3. Include time-based modifiers (2024, 2025, "latest", "recent")
4. Avoid generic terms - be highly specific to their expertise area
5. Consider both their personal brand and company publications

Format your response as a JSON array of strings, nothing else:
["query1", "query2", "query3", "query4", "query5"]`

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 500
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      const queries = JSON.parse(content)
      return Array.isArray(queries) ? queries : []

    } catch (error) {
      console.error('Error generating search queries:', error)
      
      // Fallback to basic queries
      return [
        `"${analyst.firstName} ${analyst.lastName}" ${analyst.company} research report 2024`,
        `"${analyst.firstName} ${analyst.lastName}" blog post thought leadership`,
        `site:${analyst.email.split('@')[1]} "${analyst.firstName} ${analyst.lastName}"`,
        `"${analyst.firstName} ${analyst.lastName}" whitepaper analysis`,
        `${analyst.company} "${analyst.firstName} ${analyst.lastName}" publication`
      ]
    }
  }

  /**
   * Perform Google Custom Search
   */
  private async performGoogleSearch(query: string): Promise<SearchResult[]> {
    if (!this.googleApiKey || !this.googleCseId) {
      console.warn('Google Search API not configured, skipping search')
      return []
    }

    try {
      const url = `https://customsearch.googleapis.com/customsearch/v1?` +
        `key=${this.googleApiKey}&` +
        `cx=${this.googleCseId}&` +
        `q=${encodeURIComponent(query)}&` +
        `num=10&` +
        `fields=items(title,link,snippet)`

      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Google Search API error: ${response.status}`)
      }

      const data = await response.json()
      
      return (data.items || []).map((item: any) => ({
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'google'
      }))

    } catch (error) {
      console.error('Error performing Google search:', error)
      return []
    }
  }

  /**
   * Analyze search results using AI to extract publication information
   */
  private async analyzeSearchResults(
    analyst: AnalystProfile, 
    searchResults: SearchResult[]
  ): Promise<DiscoveredPublication[]> {
    if (searchResults.length === 0) {
      return []
    }

    // Group results to avoid hitting token limits
    const chunks = this.chunkArray(searchResults, 8)
    const allPublications: DiscoveredPublication[] = []

    for (const chunk of chunks) {
      try {
        const publications = await this.analyzeResultChunk(analyst, chunk)
        allPublications.push(...publications)
        
        // Add delay between API calls
        await new Promise(resolve => setTimeout(resolve, 500))
      } catch (error) {
        console.error('Error analyzing result chunk:', error)
        continue
      }
    }

    return allPublications
  }

  /**
   * Analyze a chunk of search results
   */
  private async analyzeResultChunk(
    analyst: AnalystProfile, 
    results: SearchResult[]
  ): Promise<DiscoveredPublication[]> {
    const prompt = `You are an expert content analyst. Analyze these search results to identify genuine publications (research reports, blog posts, articles, whitepapers, etc.) written BY this specific analyst:

ANALYST PROFILE:
Name: ${analyst.firstName} ${analyst.lastName}
Company: ${analyst.company}
Email: ${analyst.email}

SEARCH RESULTS TO ANALYZE:
${results.map((result, idx) => `
${idx + 1}. TITLE: ${result.title}
   URL: ${result.url}
   SNIPPET: ${result.snippet}
`).join('\n')}

TASK: For each result that represents a GENUINE PUBLICATION by this analyst, extract the information. 

STRICT FILTERING CRITERIA:
- Must be authored BY the specific analyst (not just mentions of them)
- Must be substantial content (reports, articles, blogs, whitepapers)
- Exclude: News articles ABOUT them, social media posts, directory listings, bios
- Exclude: Other people with similar names
- Must be from 2023-2025 (estimate if date not clear)

For valid publications, determine:
1. Publication type (RESEARCH_REPORT, BLOG_POST, WHITEPAPER, WEBINAR, PODCAST, ARTICLE, OTHER)
2. Key topics/themes (3-5 keywords)
3. Confidence level (HIGH: definitely by them, MEDIUM: likely, LOW: uncertain)
4. Relevance score (1-100 based on how significant the publication appears)

Respond with a JSON array of publications. If no valid publications found, return empty array [].

Format:
[
  {
    "title": "Exact title",
    "summary": "2-3 sentence summary of what this publication covers",
    "url": "full URL",
    "publishedAt": "YYYY-MM-DD or YYYY-MM-01 if only month/year known",
    "type": "RESEARCH_REPORT",
    "relevanceScore": 85,
    "keyTopics": ["topic1", "topic2", "topic3"],
    "confidenceLevel": "HIGH",
    "extractedMetadata": {
      "author": "FirstName LastName",
      "publicationVenue": "Company/Platform name"
    }
  }
]`

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 2000
      })

      const content = response.choices[0]?.message?.content?.trim()
      if (!content) {
        return []
      }

      // Parse the JSON response
      const publications = JSON.parse(content)
      return Array.isArray(publications) ? publications : []

    } catch (error) {
      console.error('Error analyzing search results with OpenAI:', error)
      return []
    }
  }

  /**
   * Batch discovery for multiple analysts
   */
  async discoverPublicationsForAnalysts(analysts: AnalystProfile[]): Promise<Array<{
    analyst: AnalystProfile
    publications: DiscoveredPublication[]
    error?: string
  }>> {
    const results = []

    for (const analyst of analysts) {
      try {
        console.log(`\n🔄 Processing ${analyst.firstName} ${analyst.lastName}...`)
        
        const publications = await this.discoverPublications(analyst)
        results.push({
          analyst,
          publications,
        })

        // Rate limiting - wait between analysts
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        console.error(`Error processing ${analyst.firstName} ${analyst.lastName}:`, error)
        results.push({
          analyst,
          publications: [],
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Utility function to chunk arrays
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}