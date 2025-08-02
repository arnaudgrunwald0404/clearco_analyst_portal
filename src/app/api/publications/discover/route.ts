import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface AnalystSource {
  analyst: {
    id: string
    firstName: string
    lastName: string
    company: string
    email: string
    personalWebsite?: string
  }
  sources: string[] // Array of potential URLs to check
}

interface Publication {
  title: string
  summary?: string
  url: string
  publishedAt: string
  type: 'RESEARCH_REPORT' | 'BLOG_POST' | 'WHITEPAPER' | 'WEBINAR' | 'PODCAST' | 'ARTICLE' | 'OTHER'
}

function extractDomain(email: string): string | null {
  const match = email.match(/@([^@]+)$/)
  return match ? match[1] : null
}

function generatePotentialUrls(domain: string): string[] {
  return [
    `https://www.${domain}`,
    `https://www.${domain}/research`,
    `https://www.${domain}/insights`,
    `https://www.${domain}/publications`,
    `https://research.${domain}`,
    `https://blog.${domain}`
  ]
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok
  } catch {
    return false
  }
}

async function discoverPublications(source: AnalystSource): Promise<Publication[]> {
  const publications: Publication[] = []

  for (const url of source.sources) {
    try {
      console.log(`Checking ${url} for ${source.analyst.firstName} ${source.analyst.lastName}...`)
      
      // Try to fetch the webpage
      const response = await fetch(url)
      if (!response.ok) continue
      const html = await response.text()

      // Example: Extract publications from common patterns
      const patterns = [
        // Research report pattern
        {
          regex: /<h[1-3][^>]*>([^<]+Research\s+Report[^<]*)<\/h[1-3]>/gi,
          type: 'RESEARCH_REPORT' as const
        },
        // Blog post pattern
        {
          regex: /<article[^>]*>[\s\S]*?<h[1-3][^>]*>([^<]+)<\/h[1-3]>[\s\S]*?<\/article>/gi,
          type: 'BLOG_POST' as const
        },
        // Whitepaper pattern
        {
          regex: /<h[1-3][^>]*>([^<]+White\s*paper[^<]*)<\/h[1-3]>/gi,
          type: 'WHITEPAPER' as const
        }
      ]

      // Try each pattern
      for (const pattern of patterns) {
        const matches = html.matchAll(pattern.regex)
        for (const match of matches) {
          const title = match[1].trim()
          
          // Extract date - look for nearby date patterns
          const datePattern = /(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})|(\w+ \d{1,2},? \d{4})/
          const contextAround = html.substring(Math.max(0, match.index! - 100), match.index! + match.length + 100)
          const dateMatch = contextAround.match(datePattern)
          const publishedAt = dateMatch ? new Date(dateMatch[0]).toISOString() : new Date().toISOString()

          // Extract summary - look for first paragraph after title
          const summaryMatch = contextAround.match(/<p[^>]*>([^<]+)<\/p>/)
          const summary = summaryMatch ? summaryMatch[1].trim() : undefined

          publications.push({
            title,
            summary,
            url,
            publishedAt,
            type: pattern.type
          })
        }
      }

      // Special case: Aptitude Research format
      if (url.includes('aptituderesearch.com')) {
        const publicationBlocks = html.match(/<h3>([^<]+)<\/h3>[\s\S]*?Read More/g) || []
        for (const block of publicationBlocks) {
          const titleMatch = block.match(/<h3>([^<]+)<\/h3>/)
          if (!titleMatch) continue
          
          const title = titleMatch[1].trim()
          const dateMatch = block.match(/(\w+ \d+, \d{4})/)
          const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
          const summaryMatch = block.match(/<h3>[^<]+<\/h3>\s*([^<]+)/)
          const summary = summaryMatch ? summaryMatch[1].trim() : undefined
          
          publications.push({
            title,
            summary,
            url,
            publishedAt,
            type: title.toLowerCase().includes('index') ? 'WHITEPAPER' : 'RESEARCH_REPORT'
          })
        }
      }

      // Special case: Josh Bersin format
      if (url.includes('joshbersin.com')) {
        const articleBlocks = html.match(/<article[^>]*>[\s\S]*?<\/article>/g) || []
        for (const block of articleBlocks) {
          const titleMatch = block.match(/<h2[^>]*>([^<]+)<\/h2>/)
          if (!titleMatch) continue
          
          const title = titleMatch[1].trim()
          const dateMatch = block.match(/(\w+ \d+, \d{4})/)
          const publishedAt = dateMatch ? new Date(dateMatch[1]).toISOString() : new Date().toISOString()
          const summaryMatch = block.match(/<p[^>]*>([^<]+)<\/p>/)
          const summary = summaryMatch ? summaryMatch[1].trim() : undefined
          
          publications.push({
            title,
            summary,
            url,
            publishedAt,
            type: title.toLowerCase().includes('research') ? 'RESEARCH_REPORT' : 'BLOG_POST'
          })
        }
      }

    } catch (error) {
      console.error(`Error fetching ${url}:`, error)
      continue
    }
  }

  return publications
}

export async function GET() {
  try {
    const supabase = createClient()
    
    // Get all analysts
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, company, email, personalWebsite')
    
    if (analystsError) {
      throw analystsError
    }

    // Process each analyst to get their potential content sources
    const analystSources: AnalystSource[] = analysts
      .map(analyst => {
        const sources = new Set<string>()

        // Add personal website if available
        if (analyst.personalWebsite) {
          sources.add(analyst.personalWebsite)
        }

        // Add domain from email
        const emailDomain = extractDomain(analyst.email)
        if (emailDomain) {
          generatePotentialUrls(emailDomain).forEach(url => sources.add(url))
        }

        // Add known company domains
        const knownDomains: Record<string, string[]> = {
          'Aptitude Research': ['aptituderesearch.com'],
          'Josh Bersin Academy': ['joshbersin.com'],
          '3Sixty Insights': ['3sixtyinsights.com'],
          'RedThread Research': ['redthreadresearch.com'],
          'Fosway Group': ['fosway.com'],
          'Sapient Insights': ['sapientinsights.com']
          // Add more known company domains
        }

        if (analyst.company in knownDomains) {
          knownDomains[analyst.company].forEach(domain => {
            generatePotentialUrls(domain).forEach(url => sources.add(url))
          })
        }

        return {
          analyst,
          sources: Array.from(sources)
        }
      })
      .filter(source => source.sources.length > 0)

    // Discover publications from each source
    const allPublications: Array<Publication & { analyst: any }> = []
    
    for (const source of analystSources) {
      console.log(`Checking sources for ${source.analyst.firstName} ${source.analyst.lastName}:`, source.sources)
      const publications = await discoverPublications(source)
      publications.forEach(pub => {
        allPublications.push({
          ...pub,
          analyst: source.analyst
        })
      })
    }

    // Return discovered publications
    return NextResponse.json({
      success: true,
      data: allPublications,
      sources: analystSources.map(source => ({
        analyst: `${source.analyst.firstName} ${source.analyst.lastName}`,
        sources: source.sources
      }))
    })

  } catch (error) {
    console.error('Error in publication discovery:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to discover publications'
    }, { status: 500 })
  }
}