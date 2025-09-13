#!/usr/bin/env tsx

/*
 * GPT-based Twitter handle lookup and conditional save
 * - Iterates analysts from Supabase
 * - Uses OpenAI to find social URLs (website/linkedin/twitter)
 * - Extracts Twitter handle from URL
 * - Saves ONLY when confidence >= threshold (default 0.95)
 *
 * Usage examples:
 *   npx tsx scripts/gpt-twitter-handle-lookup.ts
 *   npx tsx scripts/gpt-twitter-handle-lookup.ts --threshold 0.98
 *   npx tsx scripts/gpt-twitter-handle-lookup.ts --all              # include analysts who already have a handle
 *   npx tsx scripts/gpt-twitter-handle-lookup.ts --dry-run          # do not save, just report
 *   npx tsx scripts/gpt-twitter-handle-lookup.ts --limit 50         # process first 50
 */

import 'dotenv/config'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

// ---------- Config via CLI args ----------
const argv = process.argv.slice(2)
function getFlag(name: string, defaultValue?: string): string | undefined {
  const i = argv.findIndex(a => a === `--${name}`)
  if (i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1]
  const kv = argv.find(a => a.startsWith(`--${name}=`))
  if (kv) return kv.split('=')[1]
  return defaultValue
}

const threshold = Math.min(1, Math.max(0, parseFloat(getFlag('threshold', '0.95')!)))
const includeAll = argv.includes('--all') || argv.includes('-a')
const dryRun = argv.includes('--dry-run')
const limit = (() => {
  const v = getFlag('limit')
  if (!v) return undefined
  const n = parseInt(v, 10)
  return Number.isFinite(n) && n > 0 ? n : undefined
})()

// ---------- Env / Clients ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase env vars. Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
if (!OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const openai = new OpenAI({ apiKey: OPENAI_API_KEY })

// ---------- Types ----------
type Analyst = {
  id: string
  firstName: string | null
  lastName: string | null
  company: string | null
  title: string | null
  twitterHandle: string | null
}

type ChatResult = {
  website?: string | null
  linkedin?: string | null
  twitter?: string | null
  confidence: number
  reasoning: string
}

// ---------- Helpers ----------
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

function extractTwitterHandleFromUrl(url: string): string | null {
  try {
    const m = url.match(/(?:https?:\/\/(?:www\.)?)?(?:twitter\.com|x\.com)\/([^/?#]+)/i)
    if (!m) return null
    const username = m[1].split('/')[0]
    if (!username) return null
    return username.startsWith('@') ? username : `@${username}`
  } catch {
    return null
  }
}

function stripCodeFences(s: string): string {
  return s.replace(/^```(?:json)?\n([\s\S]*)\n```$/m, '$1').trim()
}

async function chatSearch(analystName: string, company: string, title?: string): Promise<ChatResult> {
  const prompt = `You are an expert at finding professional social media profiles and websites for industry analysts.

Find the website, LinkedIn, and Twitter/X profiles for:
Name: ${analystName}
Company: ${company || ''}${title ? `\nTitle: ${title}` : ''}

Please provide:
1. Their professional website URL (personal or company profile page)
2. Their LinkedIn profile URL
3. Their Twitter/X profile URL

Important:
- Only provide URLs that you are confident exist
- Use standard URL formats (https://linkedin.com/in/username, https://twitter.com/username, etc.)
- If you're not confident about a specific platform, don't include it
- Provide a confidence score (0-100) based on how certain you are
- Explain your reasoning

Respond in this exact JSON format:
{
  "website": "https://example.com/profile" or null,
  "linkedin": "https://linkedin.com/in/username" or null,
  "twitter": "https://twitter.com/username" or null,
  "confidence": 85,
  "reasoning": "Explanation of findings and confidence level"
}`

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    temperature: 0.1,
    messages: [
      {
        role: 'system',
        content: 'You are an expert researcher who finds accurate professional social media profiles and websites. Always respond with valid JSON in the exact format requested. Only include URLs you are confident exist.'
      },
      { role: 'user', content: prompt }
    ]
  })

  const content = completion.choices?.[0]?.message?.content
  if (!content) throw new Error('No response content from OpenAI')

  const cleaned = stripCodeFences(content)
  let parsed: any
  try {
    parsed = JSON.parse(cleaned)
  } catch (e) {
    // Sometimes the model adds trailing commentary; try to find JSON block
    const match = cleaned.match(/[\{\[][\s\S]*[\}\]]/)
    if (!match) throw new Error('Failed to parse OpenAI JSON response')
    parsed = JSON.parse(match[0])
  }

  return {
    website: parsed.website ?? null,
    linkedin: parsed.linkedin ?? null,
    twitter: parsed.twitter ?? null,
    confidence: Number(parsed.confidence ?? 0),
    reasoning: String(parsed.reasoning ?? '')
  }
}

async function main() {
  console.log('🎯 GPT Twitter handle lookup — will save only when confidence >=', threshold)
  if (dryRun) console.log('🔎 Running in DRY RUN mode — no changes will be saved')
  console.log(includeAll ? '🧮 Processing all analysts' : '🧮 Processing analysts missing a Twitter handle')

  // Fetch analysts
  const selectCols = 'id, firstName, lastName, company, title, twitterHandle'
  let query = supabase.from('analysts').select(selectCols)
  if (!includeAll) {
    // Only those with no twitterHandle or empty
    query = query.or('twitterHandle.is.null,twitterHandle.eq.')
  }
  if (limit) {
    query = query.limit(limit)
  }

  const { data: analysts, error } = await query
  if (error) {
    console.error('❌ Failed to fetch analysts:', error)
    process.exit(1)
  }
  if (!analysts || analysts.length === 0) {
    console.log('✅ No analysts to process')
    return
  }

  console.log(`📊 Found ${analysts.length} analysts to process`)

  let processed = 0
  let updated = 0
  let skippedLowConfidence = 0
  let skippedNoTwitter = 0
  let alreadyHadHandle = 0
  let errors = 0

  for (const a of analysts as Analyst[]) {
    processed++
    const name = `${a.firstName || ''} ${a.lastName || ''}`.trim()
    console.log(`\n${processed}. ${name || a.id} — company: ${a.company || 'n/a'}${a.twitterHandle ? ` (existing: ${a.twitterHandle})` : ''}`)

    try {
      const result = await chatSearch(name || 'Unknown', a.company || '', a.title || undefined)
      const handle = result.twitter ? extractTwitterHandleFromUrl(result.twitter) : null
      const conf01 = Math.max(0, Math.min(1, result.confidence / 100))

      if (!handle) {
        console.log('   ⚠️  No Twitter URL returned')
        skippedNoTwitter++
        continue
      }

      console.log(`   🔍 Found ${result.twitter} → handle ${handle} (confidence ${(result.confidence).toFixed(0)}%)`)
      if (conf01 < threshold) {
        console.log('   ⏭️  Skipping — below threshold')
        skippedLowConfidence++
        continue
      }

      if (!dryRun) {
        // Only write if: missing OR (includeAll and value differs)
        const shouldUpdate = !a.twitterHandle || a.twitterHandle.trim() === '' || (includeAll && a.twitterHandle !== handle)
        if (!shouldUpdate) {
          console.log('   ⏭️  Skipping save — already has same handle')
          alreadyHadHandle++
        } else {
          const { error: updateError } = await supabase
            .from('analysts')
            .update({ twitterHandle: handle, updatedAt: new Date().toISOString() })
            .eq('id', a.id)
          if (updateError) throw updateError
          console.log('   ✅ Saved handle', handle)
          updated++
        }
      } else {
        console.log('   📝 DRY RUN — would save handle', handle)
      }

      // Be polite to APIs
      await sleep(1000)
    } catch (e: any) {
      console.error('   ❌ Error:', e?.message || e)
      errors++
      await sleep(500)
    }
  }

  console.log('\n===== Summary =====')
  console.log('Processed:', processed)
  console.log('Updated:', updated)
  console.log('Skipped (below threshold):', skippedLowConfidence)
  console.log('Skipped (no twitter found):', skippedNoTwitter)
  console.log('Skipped (already had same):', alreadyHadHandle)
  console.log('Errors:', errors)

  if (dryRun) {
    console.log('\nNote: Run again without --dry-run to save approved handles.')
  }
}

main().catch(err => {
  console.error('💥 Script failed:', err)
  process.exit(1)
})
