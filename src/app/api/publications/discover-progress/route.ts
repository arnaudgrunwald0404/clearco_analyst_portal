import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'
import { isAbortLike } from '@/lib/utils/abort-error-handler'

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

function guessDomainsFromCompany(company?: string): string[] {
  if (!company) return []
  const cleaned = company.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim()
  if (!cleaned) return []
  const parts = cleaned.split(/\s+/)
  const primary = parts[0]
  const joined = parts.join('')
  const candidates = new Set<string>()
  ;['.com', '.io', '.co'].forEach(tld => {
    candidates.add(`${primary}${tld}`)
    candidates.add(`${joined}${tld}`)
  })
  return Array.from(candidates)
}

// Lightweight XML helpers for sitemaps and RSS/Atom feeds
function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = []
  const locRegex = /<loc>\s*([^<]+?)\s*<\/loc>/gi
  let m: RegExpExecArray | null
  while ((m = locRegex.exec(xml)) !== null) {
    urls.push(m[1].trim())
  }
  return Array.from(new Set(urls))
}

function extractRssLinks(xml: string): { title?: string; link: string }[] {
  const items: { title?: string; link: string }[] = []
  const itemRegex = /<item[\s\S]*?<\/item>/gi
  const titleRegex = /<title>([\s\S]*?)<\/title>/i
  const linkRegex = /<link>([\s\S]*?)<\/link>/i
  const guidLinkRegex = /<guid[^>]*>([\s\S]*?)<\/guid>/i
  const atomEntryRegex = /<entry[\s\S]*?<\/entry>/gi
  const atomLinkRegex = /<link[^>]*href=["']([^"']+)["']/i

  const pushItem = (block: string) => {
    const linkMatch = block.match(linkRegex) || block.match(guidLinkRegex) || block.match(atomLinkRegex)
    const titleMatch = block.match(titleRegex)
    const link = linkMatch ? (linkMatch[1] || linkMatch[0]?.replace(/.*href=["']/, '').replace(/["'].*/, '')) : ''
    if (link) items.push({ title: titleMatch?.[1]?.trim(), link: link.trim() })
  }

  let mItem: RegExpExecArray | null
  while ((mItem = itemRegex.exec(xml)) !== null) pushItem(mItem[0])
  let mEntry: RegExpExecArray | null
  while ((mEntry = atomEntryRegex.exec(xml)) !== null) pushItem(mEntry[0])
  return items
}

function scoreUrl(url: string): number {
  const u = url.toLowerCase()
  let score = 0
  if (/research|insights|publications|reports|whitepaper|library|resources/.test(u)) score += 5
  if (/blog|news|article/.test(u)) score += 3
  if (/pdf$/.test(u)) score += 2
  const depth = (u.match(/\//g) || []).length
  score -= Math.max(0, depth - 3) * 0.5
  return score
}

async function fetchTextWithTimeout(url: string, timeoutMs = 10000): Promise<string | null> {
  try {
    const controller = new AbortController()
    const to = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(to)
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

async function discoverFromSitemapAndFeeds(baseDomain: string): Promise<string[]> {
  const bases = [
    `https://${baseDomain}`,
    `https://www.${baseDomain}`
  ]
  const candidateRoots = new Set<string>()
  for (const base of bases) {
    // sitemaps
    for (const path of ['/sitemap.xml', '/sitemap_index.xml']) {
      const xml = await fetchTextWithTimeout(base + path, 8000)
      if (xml) extractSitemapUrls(xml).forEach(u => candidateRoots.add(u))
    }
    // common feeds
    for (const path of ['/rss.xml', '/feed', '/blog/feed', '/insights/feed', '/publications/feed', '/atom.xml']) {
      const xml = await fetchTextWithTimeout(base + path, 6000)
      if (xml) extractRssLinks(xml).forEach(item => candidateRoots.add(item.link))
    }
  }
  return Array.from(candidateRoots).sort((a, b) => scoreUrl(b) - scoreUrl(a)).slice(0, 25)
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
    // Prefer service role for write operations to bypass RLS if configured
    const adminSupabase = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null
    const supabase = adminSupabase || createClient()

    // Set up SSE headers
    const responseStream = new TransformStream()
    const writer = responseStream.writable.getWriter()
    const encoder = new TextEncoder()

    // Guarded writer helpers to ignore aborts
    const safeWrite = async (chunk: string) => {
      try {
        await writer.write(encoder.encode(chunk))
      } catch (e) {
        if (isAbortLike(e)) {
          // Client disconnected; ignore further writes
          return
        }
        throw e
      }
    }

    const sendProgress = async (update: ProgressUpdate) => {
      const data = `data: ${JSON.stringify(update)}\n\n`
      await safeWrite(data)
    }

    // If the client disconnects, close the writer gracefully
    try {
      (request as any).signal?.addEventListener?.('abort', async () => {
        try { await writer.close() } catch {}
      })
    } catch {}

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

            // Fallback: guess common domains from company name
            guessDomainsFromCompany(analyst.company).forEach(domain => {
              generatePotentialUrls(domain).forEach(url => sources.add(url))
            })

            return {
              analyst,
              sources: Array.from(sources)
            }
          })
          .filter(source => source.sources.length > 0)

        // Expand with sitemap/feed URLs per analyst (sequential to respect rate limits)
        for (const source of analystSources) {
          const domains: string[] = []
          try {
            if (source.analyst.email) {
              const emailDomain = source.analyst.email.split('@')[1]
              if (emailDomain) domains.push(emailDomain)
            }
          } catch {}
          if (source.analyst.personalWebsite) {
            try {
              const d = new URL(source.analyst.personalWebsite).hostname.replace(/^www\./, '')
              domains.push(d)
            } catch {}
          }
          if (source.analyst.company) {
            guessDomainsFromCompany(source.analyst.company).forEach(d => domains.push(d))
          }
          const uniqueDomains = Array.from(new Set(domains))
          for (const d of uniqueDomains) {
            const smartUrls = await discoverFromSitemapAndFeeds(d)
            smartUrls.forEach(u => source.sources.push(u))
          }
          // Deduplicate and sort by score, cap per analyst
          source.sources = Array.from(new Set(source.sources))
            .sort((a, b) => scoreUrl(b) - scoreUrl(a))
            .slice(0, 30)
        }

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

          // Persist publications (dedupe by analystId + url)
          let inserted = 0
          for (const pub of publications) {
            try {
              // Check existence by count to avoid data roundtrip
              const { count } = await supabase
                .from('Publication')
                .select('id', { count: 'exact', head: true })
                .eq('analystId', source.analyst.id)
                .eq('url', pub.url)

              if (!count || count === 0) {
                const { error: insertError } = await supabase
                  .from('Publication')
                  .insert({
                    analystId: source.analyst.id,
                    title: pub.title,
                    url: pub.url,
                    summary: pub.summary || null,
                    type: pub.type,
                    publishedAt: pub.publishedAt || new Date().toISOString(),
                    isTracked: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  })
                if (!insertError) inserted += 1
              }
            } catch (e) {
              // non-fatal; continue
            }
          }

          processedAnalysts++

          sendProgress({
            type: 'analyst_complete',
            data: { 
              analyst: `${source.analyst.firstName} ${source.analyst.lastName}`,
              publicationsFound: publications.length,
              publicationsInserted: inserted,
              topTitles: publications.slice(0, 3).map(p => p.title).filter(Boolean),
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
          await sendProgress({
            type: 'error',
            data: { 
              message: 'Discovery failed',
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          })
        } finally {
          try { await writer.close() } catch (e) {
            if (!isAbortLike(e)) throw e
          }
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