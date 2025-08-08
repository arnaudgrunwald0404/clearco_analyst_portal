#!/usr/bin/env node

/**
 * AI-Powered Publication Discovery Script
 * 
 * This script automatically discovers new publications from industry analysts
 * using OpenAI's GPT-4 to intelligently search and analyze content.
 * 
 * Usage:
 *   node scripts/cron/ai-publication-discovery.js [options]
 * 
 * Options:
 *   --analyst-id <id>     Process specific analyst only
 *   --limit <number>      Limit number of analysts to process (default: 5)
 *   --dry-run            Show what would be discovered without saving
 *   --save-immediately   Save all discoveries without requiring review
 *   --quiet              Reduce output verbosity
 * 
 * Environment Variables Required:
 *   - OPENAI_API_KEY: OpenAI API key
 *   - GOOGLE_SEARCH_API_KEY: Google Custom Search API key
 *   - GOOGLE_SEARCH_ENGINE_ID: Google Custom Search Engine ID
 *   - NEXT_PUBLIC_SUPABASE_URL: Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
 */

const { createClient } = require('@supabase/supabase-js')
const OpenAI = require('openai')

// Configuration
const CONFIG = {
  maxAnalystsPerRun: parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1]) || 5,
  targetAnalystId: process.argv.find(arg => arg.startsWith('--analyst-id='))?.split('=')[1],
  dryRun: process.argv.includes('--dry-run'),
  saveImmediately: process.argv.includes('--save-immediately'),
  quiet: process.argv.includes('--quiet'),
  minDaysSinceLastDiscovery: 7, // Only process analysts who haven't been processed in the last 7 days
  maxPublicationsPerAnalyst: 10
}

// Global clients (initialized in main function)
let supabase
let openai

// Logging utility
function log(message, level = 'info') {
  if (CONFIG.quiet && level === 'info') return
  
  const timestamp = new Date().toISOString()
  const prefix = {
    info: '📊',
    success: '✅',
    error: '❌',
    warn: '⚠️',
    debug: '🔍'
  }[level] || 'ℹ️'
  
  console.log(`${timestamp} ${prefix} ${message}`)
}

async function validateEnvironment() {
  const required = [
    'OPENAI_API_KEY',
    'GOOGLE_SEARCH_API_KEY', 
    'GOOGLE_SEARCH_ENGINE_ID',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY'
  ]

  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  // Test Supabase connection
  const { error } = await supabase.from('analysts').select('count', { count: 'exact', head: true })
  if (error) {
    throw new Error(`Supabase connection failed: ${error.message}`)
  }

  // Test OpenAI connection
  try {
    await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1
    })
  } catch (error) {
    throw new Error(`OpenAI connection failed: ${error.message}`)
  }

  log('Environment validation passed')
}

async function getAnalystsToProcess() {
  let query = supabase
    .from('analysts')
    .select('id, firstName, lastName, company, email, personalWebsite, linkedinUrl, twitterHandle, lastDiscoveryRun')
    .order('lastDiscoveryRun', { ascending: true, nullsFirst: true })

  if (CONFIG.targetAnalystId) {
    query = query.eq('id', CONFIG.targetAnalystId)
  } else {
    // Only get analysts who haven't been processed recently
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - CONFIG.minDaysSinceLastDiscovery)
    
    query = query.or(`lastDiscoveryRun.is.null,lastDiscoveryRun.lt.${cutoffDate.toISOString()}`)
  }

  query = query.limit(CONFIG.maxAnalystsPerRun)

  const { data: analysts, error } = await query

  if (error) {
    throw new Error(`Failed to fetch analysts: ${error.message}`)
  }

  return analysts || []
}

async function generateSearchQueries(analyst) {
  const prompt = `Generate 4 highly specific Google search queries to find recent publications by this industry analyst:

Name: ${analyst.firstName} ${analyst.lastName}
Company: ${analyst.company}
Email Domain: ${analyst.email.split('@')[1]}
Website: ${analyst.personalWebsite || 'Not provided'}

Focus on finding:
1. Recent research reports (2024-2025)
2. Blog posts and thought leadership
3. Whitepapers and analysis
4. Speaking content that was published

Be very specific and include their exact name in quotes. Format as JSON array:
["query1", "query2", "query3", "query4"]`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 300
    })

    const content = response.choices[0]?.message?.content?.trim()
    const queries = JSON.parse(content)
    return Array.isArray(queries) ? queries : []

  } catch (error) {
    log(`Error generating search queries for ${analyst.firstName} ${analyst.lastName}: ${error.message}`, 'warn')
    
    // Fallback queries
    return [
      `"${analyst.firstName} ${analyst.lastName}" ${analyst.company} research report 2024`,
      `"${analyst.firstName} ${analyst.lastName}" blog post analysis`,
      `site:${analyst.email.split('@')[1]} "${analyst.firstName} ${analyst.lastName}"`,
      `"${analyst.firstName} ${analyst.lastName}" whitepaper 2024 2025`
    ]
  }
}

async function performGoogleSearch(query) {
  const url = `https://customsearch.googleapis.com/customsearch/v1?` +
    `key=${process.env.GOOGLE_SEARCH_API_KEY}&` +
    `cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&` +
    `q=${encodeURIComponent(query)}&` +
    `num=8&` +
    `fields=items(title,link,snippet)`

  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`)
    }

    const data = await response.json()
    return (data.items || []).map(item => ({
      title: item.title,
      url: item.link,
      snippet: item.snippet
    }))

  } catch (error) {
    log(`Google search error: ${error.message}`, 'warn')
    return []
  }
}

async function analyzeSearchResults(analyst, searchResults) {
  if (searchResults.length === 0) return []

  const prompt = `Analyze these search results to find genuine publications BY ${analyst.firstName} ${analyst.lastName} from ${analyst.company}.

SEARCH RESULTS:
${searchResults.map((result, idx) => `
${idx + 1}. ${result.title}
   URL: ${result.url}
   SNIPPET: ${result.snippet}
`).join('\n')}

STRICT CRITERIA:
- Must be authored BY this specific analyst (not just mentioned)
- Must be substantial content (reports, articles, blogs, whitepapers)
- Exclude: News about them, social posts, directory listings
- Must be from 2023-2025
- Only include if you're reasonably confident they authored it

Return JSON array of publications:
[
  {
    "title": "exact title",
    "summary": "brief summary of content",
    "url": "full URL",
    "publishedAt": "YYYY-MM-DD",
    "type": "RESEARCH_REPORT|BLOG_POST|WHITEPAPER|ARTICLE|OTHER",
    "relevanceScore": 80,
    "keyTopics": ["topic1", "topic2"],
    "confidenceLevel": "HIGH|MEDIUM|LOW"
  }
]

If no valid publications found, return []`

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500
    })

    const content = response.choices[0]?.message?.content?.trim()
    const publications = JSON.parse(content)
    return Array.isArray(publications) ? publications : []

  } catch (error) {
    log(`Error analyzing results for ${analyst.firstName} ${analyst.lastName}: ${error.message}`, 'warn')
    return []
  }
}

async function discoverPublicationsForAnalyst(analyst) {
  log(`🔍 Processing ${analyst.firstName} ${analyst.lastName} (${analyst.company})`)

  try {
    // Generate search queries
    const queries = await generateSearchQueries(analyst)
    log(`Generated ${queries.length} search queries`, 'debug')

    // Perform searches
    const allResults = []
    for (const query of queries.slice(0, 3)) { // Limit to avoid rate limits
      const results = await performGoogleSearch(query)
      allResults.push(...results)
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    log(`Found ${allResults.length} search results`, 'debug')

    // Analyze results with AI
    const publications = await analyzeSearchResults(analyst, allResults)
    
    log(`Discovered ${publications.length} publications for ${analyst.firstName} ${analyst.lastName}`)

    return publications.slice(0, CONFIG.maxPublicationsPerAnalyst)

  } catch (error) {
    log(`Error processing ${analyst.firstName} ${analyst.lastName}: ${error.message}`, 'error')
    return []
  }
}

async function savePublications(publications, analystId) {
  if (publications.length === 0) return 0

  const publicationsToSave = publications.map(pub => ({
    id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: pub.title,
    summary: pub.summary,
    url: pub.url,
    type: pub.type,
    publishedAt: pub.publishedAt,
    analystId: analystId,
    status: CONFIG.saveImmediately ? 'PUBLISHED' : 'PENDING_REVIEW',
    relevanceScore: pub.relevanceScore,
    keyTopics: pub.keyTopics,
    confidenceLevel: pub.confidenceLevel,
    discoveredViaAI: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }))

  const { error } = await supabase
    .from('publications')
    .insert(publicationsToSave)

  if (error) {
    throw new Error(`Failed to save publications: ${error.message}`)
  }

  return publicationsToSave.length
}

async function updateAnalystDiscoveryTime(analystId) {
  const { error } = await supabase
    .from('analysts')
    .update({ lastDiscoveryRun: new Date().toISOString() })
    .eq('id', analystId)

  if (error) {
    log(`Warning: Failed to update discovery time for analyst ${analystId}: ${error.message}`, 'warn')
  }
}

async function main() {
  const startTime = Date.now()
  
  try {
    log('🚀 Starting AI-powered publication discovery')
    
    if (CONFIG.dryRun) {
      log('🧪 DRY RUN MODE - No data will be saved', 'warn')
    }

    // Initialize clients
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })

    // Validate environment
    await validateEnvironment()

    // Get analysts to process
    const analysts = await getAnalystsToProcess()
    
    if (analysts.length === 0) {
      log('No analysts need processing at this time')
      return
    }

    log(`Processing ${analysts.length} analysts`)

    // Process each analyst
    let totalPublications = 0
    let successfulAnalysts = 0

    for (const analyst of analysts) {
      try {
        const publications = await discoverPublicationsForAnalyst(analyst)
        
        if (!CONFIG.dryRun && publications.length > 0) {
          const savedCount = await savePublications(publications, analyst.id)
          totalPublications += savedCount
          log(`💾 Saved ${savedCount} publications for ${analyst.firstName} ${analyst.lastName}`)
        } else if (CONFIG.dryRun && publications.length > 0) {
          log(`📋 Would save ${publications.length} publications for ${analyst.firstName} ${analyst.lastName}`)
          totalPublications += publications.length
        }

        if (!CONFIG.dryRun) {
          await updateAnalystDiscoveryTime(analyst.id)
        }

        successfulAnalysts++

        // Rate limiting between analysts
        await new Promise(resolve => setTimeout(resolve, 2000))

      } catch (error) {
        log(`Failed to process ${analyst.firstName} ${analyst.lastName}: ${error.message}`, 'error')
      }
    }

    const duration = Math.round((Date.now() - startTime) / 1000)
    
    log(`✅ Discovery complete!`)
    log(`   Processed: ${successfulAnalysts}/${analysts.length} analysts`)
    log(`   Publications found: ${totalPublications}`)
    log(`   Duration: ${duration} seconds`)

  } catch (error) {
    log(`Script failed: ${error.message}`, 'error')
    process.exit(1)
  }
}

// Help text
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
AI-Powered Publication Discovery Script

Usage:
  node scripts/cron/ai-publication-discovery.js [options]

Options:
  --analyst-id <id>     Process specific analyst only
  --limit <number>      Limit number of analysts to process (default: 5)
  --dry-run            Show what would be discovered without saving
  --save-immediately   Save all discoveries without requiring review
  --quiet              Reduce output verbosity
  --help, -h           Show this help message

Environment Variables Required:
  OPENAI_API_KEY              OpenAI API key
  GOOGLE_SEARCH_API_KEY       Google Custom Search API key  
  GOOGLE_SEARCH_ENGINE_ID     Google Custom Search Engine ID
  NEXT_PUBLIC_SUPABASE_URL    Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY   Supabase service role key

Examples:
  # Process 3 analysts in dry-run mode
  node scripts/cron/ai-publication-discovery.js --limit=3 --dry-run

  # Process specific analyst and save immediately
  node scripts/cron/ai-publication-discovery.js --analyst-id=cl_analyst_001 --save-immediately

  # Run quietly for cron
  node scripts/cron/ai-publication-discovery.js --quiet
`)
  process.exit(0)
}

// Run the script
main().catch(error => {
  log(`Unhandled error: ${error.message}`, 'error')
  process.exit(1)
})