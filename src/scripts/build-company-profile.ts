#!/usr/bin/env tsx
/*
  Build a company profile with one click.
  Input: website domain (e.g., example.com or https://www.example.com)
  - Resolves base URL (tries https://www.<domain> then https://<domain>)
  - Fetches homepage JSON-LD to extract Organization logo URL and social links
  - Attempts to find a leadership/why/about page and parses mission + leadership
  - If WordPress team_members API exists, enriches leadership with profile links and modified timestamps
  Output: structured JSON to stdout or to a file if --out <path> is provided
*/

import fs from 'node:fs/promises'
import path from 'node:path'
import cheerio from 'cheerio'

// Minimal fetch wrapper with timeout
async function fetchText(url: string, timeoutMs = 20000): Promise<string> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'analyst-portal-company-profile/1.0' } })
    if (!res.ok) throw new Error(`Request failed ${res.status} ${res.statusText} for ${url}`)
    return await res.text()
  } finally {
    clearTimeout(id)
  }
}

async function fetchJSON<T = any>(url: string, timeoutMs = 20000): Promise<T> {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'analyst-portal-company-profile/1.0' } })
    if (!res.ok) throw new Error(`Request failed ${res.status} ${res.statusText} for ${url}`)
    return await res.json() as T
  } finally {
    clearTimeout(id)
  }
}

function normalizeWhitespace(s: string): string {
  return s.replace(/\s+/g, ' ').trim()
}

// Resolve base URL from a domain (prefers https://www.)
async function resolveBaseFromDomain(domainOrUrl: string): Promise<string> {
  const clean = domainOrUrl.replace(/\/$/, '')
  if (/^https?:\/\//i.test(clean)) return clean
  const candidates = [
    `https://www.${clean}`,
    `https://${clean}`,
  ]
  for (const c of candidates) {
    try {
      await fetchText(c)
      return c
    } catch {
      // try next
    }
  }
  return `https://${clean}`
}

// Parse Organization JSON-LD from homepage to get logo and social links
function extractOrgFromSchema($: cheerio.CheerioAPI): { logoUrl: string | null, sameAs: string[] } {
  const result = { logoUrl: null as string | null, sameAs: [] as string[] }
  const scripts = $('script[type="application/ld+json"]')
  scripts.each((_, el) => {
    const raw = $(el).contents().text()
    try {
      const data = JSON.parse(raw)
      const graphs: any[] = Array.isArray(data?.['@graph']) ? data['@graph'] : []
      const org = graphs.find(g => (g?.['@type'] === 'Organization'))
      if (org) {
        const logo = org.logo
        if (logo) {
          if (typeof logo === 'string') result.logoUrl = logo
          else if (typeof logo === 'object') result.logoUrl = logo.contentUrl || logo.url || result.logoUrl
        }
        if (Array.isArray(org.sameAs)) result.sameAs = org.sameAs
      }
    } catch {
      // ignore parse errors
    }
  })
  return result
}

// Extract mission statement heuristically
function extractMission($: cheerio.CheerioAPI): string | null {
  // Look for headings containing Mission and take the next paragraph
  let mission: string | null = null
  $('h1,h2,h3,h4,h5').each((_, el) => {
    const txt = normalizeWhitespace($(el).text())
    if (/mission/i.test(txt)) {
      const pNext = $(el).nextAll('p').first().text()
      if (pNext && pNext.length > 20) {
        mission = normalizeWhitespace(pNext)
        return false
      }
    }
  })

  if (mission) return mission

  // Fallback: scan all paragraphs for a sentence that includes the word "mission"
  let best: string | null = null
  $('p').each((_, el) => {
    const text = normalizeWhitespace($(el).text())
    if (/\bmission\b/i.test(text) && text.length > 40) {
      best = text
      return false
    }
  })
  return best
}

// Extract leadership with multiple heuristics
function extractLeadershipGeneric($: cheerio.CheerioAPI): { name: string, title: string }[] {
  const leaders: { name: string, title: string }[] = []

  // Heuristic A: common patterns name/title classes
  const nameSelectors = ['.l_name', '.leader-name', '.team-member-name', '.member-name', '[class*="name"]']
  const titleSelectors = ['.l_title', '.leader-title', '.team-member-title', '.member-title', '[class*="title"]', '[class*="role"]']

  $(nameSelectors.join(',')).each((_, el) => {
    const name = normalizeWhitespace($(el).text())
    if (!name || name.length < 3) return
    // find closest title in siblings or parent
    let title = ''
    const sibTitle = $(el).siblings(titleSelectors.join(',')).first().text()
    if (sibTitle) title = normalizeWhitespace(sibTitle)
    if (!title) {
      const parentTitle = $(el).parent().find(titleSelectors.join(',')).first().text()
      if (parentTitle) title = normalizeWhitespace(parentTitle)
    }
    if (title && /chief|officer|vp|president|founder|head|cto|cfo|coo|cmo|cpo|ceo/i.test(title)) {
      leaders.push({ name, title })
    }
  })

  // Deduplicate by name+title
  const dedupMap = new Map<string, { name: string, title: string }>()
  for (const l of leaders) {
    const key = `${l.name.toLowerCase()}|${l.title.toLowerCase()}`
    if (!dedupMap.has(key)) dedupMap.set(key, l)
  }
  return Array.from(dedupMap.values())
}

// Extract people from JSON-LD (Person entries)
function extractPeopleFromSchema($: cheerio.CheerioAPI): { name: string, title: string }[] {
  const people: { name: string, title: string }[] = []
  const scripts = $('script[type="application/ld+json"]')
  scripts.each((_, el) => {
    const raw = $(el).contents().text()
    try {
      const data = JSON.parse(raw)
      const graphs: any[] = Array.isArray(data?.['@graph']) ? data['@graph'] : []
      for (const g of graphs) {
        if (g?.['@type'] === 'Person') {
          const name = normalizeWhitespace(g.name || '')
          const title = normalizeWhitespace(g.jobTitle || '')
          if (name && title) people.push({ name, title })
        }
      }
    } catch {
      // ignore parse errors
    }
  })
  return people
}

function extractFounderHints($: cheerio.CheerioAPI): string[] {
  const hints: string[] = []
  // Look for common founder indicators near names
  $('[class*="name"], h2, h3, h4, h5').each((_, el) => {
    const name = normalizeWhitespace($(el).text()).replace(/,$/, '')
    const title = normalizeWhitespace($(el).nextAll('p,span,div').first().text())
    if (name && /founder/i.test(title)) hints.push(name)
  })
  return Array.from(new Set(hints))
}

async function pickBestProfilePage(base: string): Promise<{ url: string, html: string } | null> {
  const candidates = [
    `${base}/leadership`,
    `${base}/executive-team`,
    `${base}/our-leadership`,
    `${base}/team`,
    `${base}/our-team`,
    `${base}/about`,
    `${base}/about-us`,
    `${base}/company`,
  ]
  for (const url of candidates) {
    try {
      const html = await fetchText(url)
      if (html && html.length > 0) return { url, html }
    } catch {
      // try next
    }
  }
  return null
}

async function buildProfile(domainOrUrl?: string) {
  if (!domainOrUrl) {
    throw new Error('Domain is required. Usage: tsx src/scripts/build-company-profile.ts <domain> [--out <path>]')
  }
  const base = await resolveBaseFromDomain(domainOrUrl)

  // Homepage org schema for logo and social links
  const homeHtml = await fetchText(base)
  const $home = cheerio.load(homeHtml)
  const orgSchema = extractOrgFromSchema($home)

  // Pick the best page to parse for leadership/mission
  const chosen = await pickBestProfilePage(base)
  if (!chosen) throw new Error('Could not find a suitable page for leadership/mission parsing')

  const $ = cheerio.load(chosen.html)
  const mission = extractMission($)
  let leadership = extractLeadershipGeneric($)
  if (leadership.length === 0) {
    // fallback to JSON-LD person entries if present
    leadership = extractPeopleFromSchema($)
  }
  const founderHints = extractFounderHints($)

  // Fetch team members index to help add links + most recent modified dates (WordPress-only)
  let teamMembers: { slug: string, link: string, title: { rendered: string }, modified: string }[] = []
  try {
    teamMembers = await fetchJSON(`${base}/wp-json/wp/v2/team_members?per_page=100&_fields=slug,link,title,modified`)
  } catch {
    teamMembers = []
  }

  const teamMapByName = new Map<string, { link?: string, modified?: string }>()
  for (const m of teamMembers) {
    const name = normalizeWhitespace(m.title?.rendered || '')
    if (!name) continue
    teamMapByName.set(name.toLowerCase(), { link: m.link, modified: m.modified })
  }

  const leadershipOut = leadership.map(l => {
    const key = l.name.toLowerCase()
    const tm = teamMapByName.get(key)
    return { name: l.name, title: l.title, url: tm?.link || null, modified: tm?.modified || null }
  })

  const ceoEntry = leadershipOut.find(l => /Chief\s+Executive\s+Officer|\bCEO\b/i.test(l.title)) || null

  const companyName = $home('meta[property="og:site_name"]').attr('content')
    || normalizeWhitespace(($home('title').first().text() || '').replace(/[-|·].*$/, ''))
    || 'Unknown'

  const profile = {
    company: {
      name: companyName,
      website: base,
      logoUrl: orgSchema.logoUrl || null,
      mission: mission || null,
      foundingYear: null as number | null,
      founders: founderHints.length ? founderHints : null,
      social: orgSchema.sameAs,
    },
    leadership: leadershipOut,
    ceo: ceoEntry ? { name: ceoEntry.name, title: ceoEntry.title, url: ceoEntry.url } : null,
    sources: [
      base,
      chosen.url,
      ...(teamMembers.length ? [`${base}/wp-json/wp/v2/team_members?per_page=100&_fields=slug,link,title,modified`] : []),
    ],
    generatedAt: new Date().toISOString(),
    notes: [
      'Leadership parsed from common patterns on leadership/about/team pages; JSON-LD Person jobTitle is used as fallback.',
      'If conflicting CEO names appear, the most recent/structured source takes precedence when available.',
      'Founding year not guaranteed by schema; only included if found explicitly.',
    ],
  }

  return profile
}

async function main() {
  try {
    // Args: <domain> [--out <path>] or --domain <value>
    const args = process.argv.slice(2)
    let domainArg: string | undefined
    let outPath: string | undefined
    for (let i = 0; i < args.length; i++) {
      const a = args[i]
      if (a === '--out') {
        outPath = args[i + 1]
        i++
      } else if (a === '--domain') {
        domainArg = args[i + 1]
        i++
      } else if (!a.startsWith('-') && !domainArg) {
        domainArg = a
      }
    }

    if (!domainArg) {
      throw new Error('Domain is required. Usage: npm run company:profile:build -- <domain> [-- --out <path>]')
    }

    const profile = await buildProfile(domainArg)
    const json = JSON.stringify(profile, null, 2)

    if (outPath) {
      const abs = path.isAbsolute(outPath) ? outPath : path.join(process.cwd(), outPath)
      await fs.mkdir(path.dirname(abs), { recursive: true })
      await fs.writeFile(abs, json, 'utf8')
      console.log(`Wrote profile to ${abs}`)
    } else {
      console.log(json)
    }
  } catch (err: any) {
    console.error(err?.message || err)
    process.exitCode = 1
  }
}

main()
