import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as cheerio from 'cheerio'

interface Publication {
  title: string
  summary?: string
  url: string
  publishedAt: string
  type: 'RESEARCH_REPORT' | 'BLOG_POST' | 'WHITEPAPER' | 'WEBINAR' | 'PODCAST' | 'ARTICLE' | 'OTHER'
}

interface AnalystSource {
  analyst: any
  sources: string[]
}

interface ProgressUpdate {
  type: 'progress' | 'analyst_start' | 'analyst_complete' | 'complete' | 'error'
  data: any
}

// Known domain mappings for analysts
const knownDomains: Record<string, string[]> = {
  'Aptitude Research': ['aptituderesearch.com'],
  'Bersin & Associates': ['joshbersin.com', 'bersinpartners.com'],
  'LaRocque Inc.': ['larocqueinc.com'],
  'Apps Run The World': ['appsruntheworld.com']
}

function generatePotentialUrls(domain: string): string[] {
  const baseUrls = [
    `https://www.${domain}`,
    `https://www.${domain}/research`,
    `https://www.${domain}/insights`, 
    `https://www.${domain}/publications`,
    `https://research.${domain}`,
    `https://blog.${domain}`
  ]
  return baseUrls
}

// Parser for Aptitude Research
function aptitudeResearchParser(html: string, baseUrl: string): Publication[] {
  const $ = cheerio.load(html)
  const publications: Publication[] = []

  $('.research-item, .post-item, article').each((_, element) => {
    const $el = $(element)
    const title = $el.find('h2, h3, .title').first().text().trim()
    const link = $el.find('a').first().attr('href')
    const summary = $el.find('p, .excerpt, .summary').first().text().trim()

    if (title && link) {
      const fullUrl = link.startsWith('http') ? link : new URL(link, baseUrl).href
      publications.push({
        title,
        summary,
        url: fullUrl,
        publishedAt: new Date().toISOString(),
        type: 'RESEARCH_REPORT'
      })
    }
  })

  return publications
}

// Parser for Josh Bersin
function joshBersinParser(html: string, baseUrl: string): Publication[] {
  const $ = cheerio.load(html)
  const publications: Publication[] = []

  $('.post, .research-item, article, .content-item').each((_, element) => {
    const $el = $(element)
    const title = $el.find('h1, h2, h3, .post-title, .title').first().text().trim()
    const link = $el.find('a').first().attr('href')
    const summary = $el.find('p, .excerpt, .summary').first().text().trim()

    if (title && link) {
      const fullUrl = link.startsWith('http') ? link : new URL(link, baseUrl).href
      publications.push({
        title,
        summary,
        url: fullUrl,
        publishedAt: new Date().toISOString(),
        type: 'BLOG_POST'
      })
    }
  })

  return publications
}

async function discoverPublications(source: AnalystSource, sendProgress: (update: ProgressUpdate) => void): Promise<Publication[]> {
  const publications: Publication[] = []
  
  for (const url of source.sources) {
    try {
      sendProgress({
        type: 'progress',
        data: { 
          analyst: `${source.analyst.firstName} ${source.analyst.lastName}`,
          url,
          message: `Checking ${url}...`
        }
      })

      // Try to fetch the webpage
      const response = await fetch(url)
      if (!response.ok) continue
      const html = await response.text()

      // Use appropriate parser based on domain
      let foundPublications: Publication[] = []
      if (url.includes('aptituderesearch.com')) {
        foundPublications = aptitudeResearchParser(html, url)
      } else if (url.includes('joshbersin.com') || url.includes('bersinpartners.com')) {
        foundPublications = joshBersinParser(html, url)
      } else {
        // Generic parser
        const $ = cheerio.load(html)
        $('article, .post, .research-item').each((_, element) => {
          const $el = $(element)
          const title = $el.find('h1, h2, h3').first().text().trim()
          const link = $el.find('a').first().attr('href')
          
          if (title && link) {
            const fullUrl = link.startsWith('http') ? link : new URL(link, url).href
            foundPublications.push({
              title,
              url: fullUrl,
              publishedAt: new Date().toISOString(),
              type: 'ARTICLE'
            })
          }
        })
      }

      publications.push(...foundPublications)
      
      if (foundPublications.length > 0) {
        sendProgress({
          type: 'progress',
          data: { 
            analyst: `${source.analyst.firstName} ${source.analyst.lastName}`,
            url,
            message: `Found ${foundPublications.length} publications`
          }
        })
      }

    } catch (error) {
      sendProgress({
        type: 'progress',
        data: { 
          analyst: `${source.analyst.firstName} ${source.analyst.lastName}`,
          url,
          message: `Error checking ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
        }
      })
    }
  }

  return publications
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Set up SSE headers
    const responseStream = new TransformStream()
    const writer = responseStream.writable.getWriter()
    const encoder = new TextEncoder()

    const sendProgress = (update: ProgressUpdate) => {
      const data = `data: ${JSON.stringify(update)}\n\n`
      writer.write(encoder.encode(data))
    }

    // Start processing in the background
    ;(async () => {
      try {
        // Get all analysts
        const { data: analysts, error } = await supabase
          .from('analysts')
          .select('*')

        if (error) {
          sendProgress({
            type: 'error',
            data: { message: 'Failed to fetch analysts', error: error.message }
          })
          return
        }

        if (!analysts || analysts.length === 0) {
          sendProgress({
            type: 'complete',
            data: { publications: [], message: 'No analysts found' }
          })
          return
        }

        sendProgress({
          type: 'progress',
          data: { 
            message: `Starting discovery for ${analysts.length} analysts...`,
            totalAnalysts: analysts.length,
            currentAnalyst: 0
          }
        })

        // Create sources for each analyst
        const analystSources: AnalystSource[] = analysts
          .map(analyst => {
            const sources = new Set<string>()

            // Extract domain from email
            if (analyst.email) {
              const emailDomain = analyst.email.split('@')[1]
              if (emailDomain) {
                generatePotentialUrls(emailDomain).forEach(url => sources.add(url))
              }
            }

            // Extract domain from personal website
            if (analyst.personalWebsite) {
              try {
                const websiteUrl = new URL(analyst.personalWebsite)
                generatePotentialUrls(websiteUrl.hostname).forEach(url => sources.add(url))
              } catch (e) {
                // Invalid URL, skip
              }
            }

            // Add known domains for this company
            if (analyst.company && analyst.company in knownDomains) {
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
        let processedAnalysts = 0

        for (const source of analystSources) {
          sendProgress({
            type: 'analyst_start',
            data: { 
              analyst: `${source.analyst.firstName} ${source.analyst.lastName}`,
              company: source.analyst.company,
              progress: Math.round((processedAnalysts / analystSources.length) * 100),
              currentAnalyst: processedAnalysts + 1,
              totalAnalysts: analystSources.length
            }
          })

          const publications = await discoverPublications(source, sendProgress)
          publications.forEach(pub => {
            allPublications.push({
              ...pub,
              analyst: source.analyst
            })
          })

          processedAnalysts++

          sendProgress({
            type: 'analyst_complete',
            data: { 
              analyst: `${source.analyst.firstName} ${source.analyst.lastName}`,
              publicationsFound: publications.length,
              progress: Math.round((processedAnalysts / analystSources.length) * 100),
              currentAnalyst: processedAnalysts,
              totalAnalysts: analystSources.length
            }
          })
        }

        // Send completion
        sendProgress({
          type: 'complete',
          data: { 
            publications: allPublications,
            totalFound: allPublications.length,
            analystsProcessed: processedAnalysts
          }
        })

      } catch (error) {
        sendProgress({
          type: 'error',
          data: { 
            message: 'Discovery failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        })
      } finally {
        writer.close()
      }
    })()

    return new Response(responseStream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error in publication discovery with progress:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to start discovery with progress',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}