import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth-utils'

interface PerplexityNewsItem {
  title: string
  url: string
  published_date: string
  author: string
  text: string
}

interface PerplexityResponse {
  results: PerplexityNewsItem[]
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const { searchParams } = new URL(request.url)
    const vendor = searchParams.get('vendor') || 'ClearCompany'
    const limit = parseInt(searchParams.get('limit') || '10')

    // Check if Perplexity API key is configured
    if (!process.env.PERPLEXITY_API_KEY) {
      console.warn('Perplexity API key not configured')
      return NextResponse.json({
        success: false,
        error: 'Newsfeed service is not configured. Please contact your administrator to set up the Perplexity API key.',
        source: 'unconfigured'
      })
    }

    // Construct search query for the vendor
    const searchQuery = `${vendor} news announcements product updates funding acquisitions 2024`
    
    console.log(`🔍 Searching Perplexity for: ${searchQuery}`)

    // Build the shared messages for the request
    const messages = [
      {
        role: 'system',
        content: `You are a news aggregation assistant. Search for recent news, announcements, product updates, funding rounds, and acquisitions related to the specified company. Return the results in a structured JSON format with the following fields for each news item:
        - title: The headline of the news
        - url: The source URL (if available)
        - published_date: The publication date
        - author: The author or publication name
        - text: A brief summary of the news (2-3 sentences)
        
        Focus on recent news from the last 30 days. Return up to ${limit} items.`
      },
      {
        role: 'user',
        content: `Find recent news about ${vendor}`
      }
    ] as const

    // Build candidate models dynamically by querying Perplexity for available models
    async function listPerplexityModels(): Promise<string[]> {
      try {
        const res = await fetch('https://api.perplexity.ai/models', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
            'Accept': 'application/json',
          },
        })
        if (!res.ok) {
          const txt = await res.text().catch(() => '')
          console.warn('Perplexity models list request failed:', res.status, res.statusText, txt)
          return []
        }
        const json = await res.json().catch(() => null)
        if (!json) return []
        // Support both OpenAI-like { data: [{id: string}]} and plain arrays
        if (Array.isArray(json)) {
          if (json.length && typeof json[0] === 'string') return json as string[]
          if (json.length && typeof json[0] === 'object' && json[0]?.id) return json.map((m: any) => m.id)
          return []
        }
        if (Array.isArray(json.data)) {
          return json.data.map((m: any) => (typeof m === 'string' ? m : m.id)).filter(Boolean)
        }
        return []
      } catch (e) {
        console.warn('Error listing Perplexity models:', e)
        return []
      }
    }

    function prioritizeModels(models: string[]): string[] {
      // Prefer online/search-backed models, then other sonar models, then anything else
      const online = models.filter(m => /online/i.test(m))
      const sonar = models.filter(m => /sonar/i.test(m) && !online.includes(m))
      const other = models.filter(m => !online.includes(m) && !sonar.includes(m))
      return [...online, ...sonar, ...other]
    }

    let candidateModels: string[] = []
    if (process.env.PERPLEXITY_MODEL) candidateModels.push(process.env.PERPLEXITY_MODEL)

    try {
      const models = await listPerplexityModels()
      const prioritized = prioritizeModels(models)
      for (const m of prioritized) {
        if (!candidateModels.includes(m)) candidateModels.push(m)
      }
    } catch (e) {
      console.warn('Could not list Perplexity models:', e)
    }

    // As a last resort, include some common guesses (kept last so discovered models win)
    for (const guess of ['sonar-medium-online', 'sonar-small-online', 'sonar-medium', 'sonar-small']) {
      if (!candidateModels.includes(guess)) candidateModels.push(guess)
    }

    let perplexityResponse: Response | null = null
    let lastErrorText = ''
    let lastStatus = 0

    for (const model of candidateModels) {
      const payload: any = {
        model,
        messages,
        max_tokens: 2000,
        temperature: 0.2,
        top_p: 0.9,
      }
      // Only request citations for online/search-backed models
      if (model.includes('online')) {
        payload.return_citations = true
      }

      const resp = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (resp.ok) {
        perplexityResponse = resp
        break
      } else {
        lastStatus = resp.status
        lastErrorText = await resp.text().catch(() => '')
        // If model is invalid, try the next one; otherwise stop early
        if (!(lastStatus === 400 && /invalid_model/i.test(lastErrorText))) {
          perplexityResponse = resp
          break
        }
      }
    }

    if (!perplexityResponse || !perplexityResponse.ok) {
      const status = lastStatus || (perplexityResponse ? perplexityResponse.status : 0)
      const statusText = perplexityResponse ? perplexityResponse.statusText : 'No response from Perplexity'
      console.error('Perplexity API error:', status, statusText, lastErrorText)
      throw new Error(`Perplexity API error ${status}: ${lastErrorText || statusText}`)
    }

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text().catch(() => '')
      console.error('Perplexity API error:', perplexityResponse.status, perplexityResponse.statusText, errorText)
      throw new Error(`Perplexity API error ${perplexityResponse.status}: ${errorText || perplexityResponse.statusText}`)
    }

    const perplexityData = await perplexityResponse.json()
    console.log('✅ Perplexity API response received')

    // Parse the response and extract news items
    let newsItems = []
    
    if (perplexityData.choices && perplexityData.choices[0]?.message?.content) {
      const content = perplexityData.choices[0].message.content
      
      try {
        // Try to parse as JSON first
        const parsedContent = JSON.parse(content)
        if (Array.isArray(parsedContent)) {
          newsItems = parsedContent
        } else if (parsedContent.results && Array.isArray(parsedContent.results)) {
          newsItems = parsedContent.results
        }
      } catch (parseError) {
        // If JSON parsing fails, try to extract structured data from text
        newsItems = extractNewsFromText(content, vendor)
      }
    }

    // If no news items found, return empty result
    if (newsItems.length === 0) {
      console.warn('No news items found from Perplexity')
      return NextResponse.json({
        success: true,
        data: [],
        source: 'perplexity',
        query: searchQuery,
        message: `No recent news found for ${vendor}`
      })
    }

    // Transform and format the data
    const formattedNews = newsItems.slice(0, limit).map((item: any, index: number) => ({
      id: `news-${Date.now()}-${index}`,
      vendor: vendor,
      title: item.title || item.headline || 'News Update',
      text: item.text || item.summary || item.description || 'Latest news from the company',
      url: item.url || item.source_url || '#',
      publishedDate: item.published_date || item.date || new Date().toISOString(),
      author: item.author || item.publication || 'Various Sources',
      type: categorizeNewsType(item.title || item.text || ''),
      timeAgo: getTimeAgo(item.published_date || item.date || new Date().toISOString())
    }))

    console.log(`✅ Returning ${formattedNews.length} news items for ${vendor}`)

    return NextResponse.json({
      success: true,
      data: formattedNews,
      source: 'perplexity',
      query: searchQuery
    })

  } catch (error) {
    console.error('Error fetching vendor newsfeed:', error)
    
    // Return honest error message instead of mock data
    const vendor = new URL(request.url).searchParams.get('vendor') || 'ClearCompany'
    return NextResponse.json({
      success: false,
      error: `Failed to fetch news for ${vendor}. ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
      source: 'error'
    })
  }
}

// Helper function to extract news items from unstructured text
function extractNewsFromText(content: string, vendor: string): any[] {
  const lines = content.split('\n').filter(line => line.trim())
  const newsItems = []
  
  let currentItem: any = {}
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    if (trimmedLine.includes('Title:') || trimmedLine.includes('Headline:')) {
      if (currentItem.title) newsItems.push(currentItem)
      currentItem = { title: trimmedLine.replace(/^(Title|Headline):\s*/, '') }
    } else if (trimmedLine.includes('URL:') || trimmedLine.includes('Link:')) {
      currentItem.url = trimmedLine.replace(/^(URL|Link):\s*/, '')
    } else if (trimmedLine.includes('Date:') || trimmedLine.includes('Published:')) {
      currentItem.published_date = trimmedLine.replace(/^(Date|Published):\s*/, '')
    } else if (trimmedLine.includes('Author:') || trimmedLine.includes('Source:')) {
      currentItem.author = trimmedLine.replace(/^(Author|Source):\s*/, '')
    } else if (trimmedLine.includes('Summary:') || trimmedLine.includes('Text:')) {
      currentItem.text = trimmedLine.replace(/^(Summary|Text):\s*/, '')
    } else if (trimmedLine.length > 20 && !trimmedLine.includes(':')) {
      // Likely a news item title
      if (!currentItem.title) {
        currentItem.title = trimmedLine
      } else {
        currentItem.text = (currentItem.text || '') + ' ' + trimmedLine
      }
    }
  }
  
  if (currentItem.title) newsItems.push(currentItem)
  
  return newsItems
}

// Helper function to categorize news type
function categorizeNewsType(title: string): string {
  const lowerTitle = title.toLowerCase()
  
  if (lowerTitle.includes('funding') || lowerTitle.includes('investment') || lowerTitle.includes('series')) {
    return 'Funding'
  } else if (lowerTitle.includes('acquisition') || lowerTitle.includes('merger') || lowerTitle.includes('acquired')) {
    return 'Acquisition'
  } else if (lowerTitle.includes('product') || lowerTitle.includes('feature') || lowerTitle.includes('launch')) {
    return 'Product Update'
  } else if (lowerTitle.includes('partnership') || lowerTitle.includes('collaboration')) {
    return 'Partnership'
  } else if (lowerTitle.includes('award') || lowerTitle.includes('recognition')) {
    return 'Award'
  } else if (lowerTitle.includes('report') || lowerTitle.includes('study') || lowerTitle.includes('research')) {
    return 'Report'
  } else {
    return 'News'
  }
}

// Helper function to get time ago
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours}h ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths}mo ago`
}

