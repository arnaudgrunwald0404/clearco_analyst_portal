import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audienceDescription } = body

    if (!audienceDescription || !audienceDescription.trim()) {
      return NextResponse.json(
        { success: false, error: 'Audience description is required' },
        { status: 400 }
      )
    }

    console.log('🤖 AI Audience Selection:', audienceDescription)

    const supabase = createServiceClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Parse the natural language query into database filters
    const filters = parseAudienceDescription(audienceDescription)
    console.log('🔍 Parsed filters:', filters)

    // Start with base query
    let query = supabase
      .from('analysts')
      .select('*')
      .eq('status', 'ACTIVE') // Only active analysts by default

    // Apply influence filters
    if (filters.influences.length > 0) {
      query = query.in('influence', filters.influences)
    }

    // Apply company filters
    if (filters.companies.length > 0) {
      // Use ilike for partial matching on company names
      const companyConditions = filters.companies.map(company => 
        `company.ilike.%${company}%`
      ).join(',')
      query = query.or(companyConditions)
    }

    // Apply type filters
    if (filters.types.length > 0) {
      query = query.in('type', filters.types)
    }

    // Apply explicit first-name filters
    if (filters.firstNames.length > 0) {
      const orParts = filters.firstNames.map(n => `firstName.ilike.%${n}%`).join(',')
      query = query.or(orParts)
    }

    // Apply explicit last-name filters
    if (filters.lastNames.length > 0) {
      const orParts = filters.lastNames.map(n => `lastName.ilike.%${n}%`).join(',')
      query = query.or(orParts)
    }

    // Apply search terms (for names, titles, etc.) — only if not already narrowed by explicit name filters
    if (filters.searchTerms.length > 0 && filters.firstNames.length === 0 && filters.lastNames.length === 0) {
      const searchConditions = filters.searchTerms.map(term => 
        `firstName.ilike.%${term}%,lastName.ilike.%${term}%,title.ilike.%${term}%,keyThemes.ilike.%${term}%`
      ).join(',')
      query = query.or(searchConditions)
    }

    const { data: analysts, error } = await query
      .order('influence', { ascending: false }) // Prioritize higher influence
      .order('firstName', { ascending: true })
      .limit(50) // Reasonable limit for newsletter audiences

    if (error) {
      console.error('Error fetching analysts with AI filters:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to find analysts' },
        { status: 500 }
      )
    }

    console.log(`🎯 AI Audience Selection found ${analysts?.length || 0} analysts`)

    return NextResponse.json({
      success: true,
      data: analysts || [],
      filters: filters, // Return parsed filters for debugging
      query: audienceDescription
    })

  } catch (error) {
    console.error('Error in AI audience selection:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

interface ParsedFilters {
  influences: string[]
  companies: string[]
  types: string[]
  searchTerms: string[]
  firstNames: string[]
  lastNames: string[]
}

function parseAudienceDescription(description: string): ParsedFilters {
  const desc = description.toLowerCase()
  const filters: ParsedFilters = {
    influences: [],
    companies: [],
    types: [],
    searchTerms: [],
    firstNames: [],
    lastNames: [],
  }

  // Parse influence levels
  if (desc.includes('tier 1') || desc.includes('very high') || desc.includes('top tier')) {
    filters.influences.push('VERY_HIGH')
  }
  if (desc.includes('high influence') || desc.includes('high tier') || desc.includes('tier 2')) {
    filters.influences.push('HIGH')
  }
  if (desc.includes('medium influence') || desc.includes('medium tier')) {
    filters.influences.push('MEDIUM')
  }
  if (desc.includes('low influence') || desc.includes('low tier')) {
    filters.influences.push('LOW')
  }

  // Parse company names
  const companyKeywords = [
    'gartner', 'forrester', 'idc', 'omdia', 'frost', 'sullivan',
    'constellation', 'everest', 'nelson hall', 'hfs', 'ovum',
    'bersin', 'deloitte', 'accenture', 'mckinsey', 'pwc', 'kpmg'
  ]
  
  companyKeywords.forEach(company => {
    if (desc.includes(company)) {
      filters.companies.push(company)
    }
  })

  // Parse analyst types
  if (desc.includes('analyst')) {
    filters.types.push('Analyst')
  }
  if (desc.includes('press') || desc.includes('journalist')) {
    filters.types.push('Press')
  }
  if (desc.includes('investor')) {
    filters.types.push('Investor')
  }
  if (desc.includes('practitioner')) {
    filters.types.push('Practitioner')
  }
  if (desc.includes('influencer')) {
    filters.types.push('Influencer')
  }

  // Parse explicit first/last-name intents
  const firstNameRegexes = [
    /first\s+name\s*(?:is|=|equals)\s*([a-zA-Z'\-]+)/i,
    /whose\s+first\s+name\s*(?:is|=|equals)?\s*([a-zA-Z'\-]+)/i,
    /named\s+([a-zA-Z'\-]+)/i,
  ]
  for (const rx of firstNameRegexes) {
    const m = rx.exec(description)
    if (m && m[1]) {
      filters.firstNames.push(m[1])
      break
    }
  }
  const lastNameRegexes = [
    /last\s+name\s*(?:is|=|equals)\s*([a-zA-Z'\-]+)/i,
    /surname\s*(?:is|=|equals)\s*([a-zA-Z'\-]+)/i,
  ]
  for (const rx of lastNameRegexes) {
    const m = rx.exec(description)
    if (m && m[1]) {
      filters.lastNames.push(m[1])
      break
    }
  }

  // Parse technology/domain terms for search
  const techTerms = [
    'hr technology', 'hr tech', 'human resources', 'talent management',
    'crm', 'customer relationship', 'sales', 'marketing',
    'erp', 'enterprise resource', 'supply chain', 'logistics',
    'security', 'cybersecurity', 'cloud', 'saas', 'ai', 'artificial intelligence',
    'data analytics', 'business intelligence', 'fintech', 'financial services'
  ]

  techTerms.forEach(term => {
    if (desc.includes(term)) {
      filters.searchTerms.push(term)
    }
  })

  // If no specific filters were parsed, add some general search terms
  if (
    filters.influences.length === 0 &&
    filters.companies.length === 0 &&
    filters.types.length === 0 &&
    filters.searchTerms.length === 0 &&
    filters.firstNames.length === 0 &&
    filters.lastNames.length === 0
  ) {
    // Extract potential keywords from the description (avoid generic words like 'analyst(s)')
    const stop = new Set(['the','and','with','from','that','this','they','have','been','will','analyst','analysts','whose','name','first','last'])
    const words = description
      .split(/\s+/)
      .map(w => w.replace(/[^a-zA-Z'-]/g, ''))
      .filter(w => w.length > 3 && !stop.has(w.toLowerCase()))
    filters.searchTerms = words.slice(0, 3)
  }

  return filters
}
