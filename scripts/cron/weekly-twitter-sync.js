#!/usr/bin/env node

/**
 * Weekly Twitter Sync Script
 * 
 * This script runs once per week to refresh Twitter data for analysts.
 * It's designed to be very conservative with API usage (500 requests/month limit).
 * 
 * Usage: node scripts/cron/weekly-twitter-sync.js [--dry-run] [--max-analysts=N]
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const WEEKLY_BUDGET = 100 // Conservative weekly budget (leaving room for manual testing)
const TWEETS_PER_ANALYST = 10 // Reduced from 20 to conserve API calls
const MAX_ANALYSTS_PER_WEEK = 10 // Process max 10 analysts per week

// Parse command line arguments
const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const maxAnalystsArg = args.find(arg => arg.startsWith('--max-analysts='))
const maxAnalysts = maxAnalystsArg ? parseInt(maxAnalystsArg.split('=')[1]) : MAX_ANALYSTS_PER_WEEK

async function main() {
  console.log('🐦 Weekly Twitter Sync Starting...')
  console.log(`📊 Config: Max ${maxAnalysts} analysts, ${TWEETS_PER_ANALYST} tweets each`)
  console.log(`🧪 Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log('')

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Check current usage
  const usage = await checkCurrentUsage(supabase)
  console.log(`📈 Current Usage:`)
  console.log(`   This week: ${usage.thisWeek} requests`)
  console.log(`   Monthly total: ${usage.monthlyTotal} requests`)
  console.log(`   Remaining: ${500 - usage.monthlyTotal} requests`)
  console.log('')

  // Calculate how many requests this sync would use
  const estimatedRequests = Math.min(maxAnalysts, usage.availableAnalysts) * 1 // 1 request per analyst
  
  if (usage.thisWeek + estimatedRequests > WEEKLY_BUDGET) {
    console.log(`❌ Weekly budget exceeded. Would use ${estimatedRequests} requests but only ${WEEKLY_BUDGET - usage.thisWeek} remaining this week.`)
    process.exit(1)
  }

  if (usage.monthlyTotal + estimatedRequests > 500) {
    console.log(`❌ Monthly limit exceeded. Would use ${estimatedRequests} requests but only ${500 - usage.monthlyTotal} remaining this month.`)
    process.exit(1)
  }

  // Get analysts to process (prioritize those not updated recently)
  const analysts = await getAnalystsForSync(supabase, maxAnalysts)
  
  if (analysts.length === 0) {
    console.log('✅ No analysts need Twitter sync at this time.')
    process.exit(0)
  }

  console.log(`👥 Found ${analysts.length} analysts for sync:`)
  analysts.forEach(analyst => {
    console.log(`   - ${analyst.firstName} ${analyst.lastName} (${analyst.company}) - User ID: ${analyst.twitterUserId || 'MISSING'}`)
  })
  console.log('')

  if (isDryRun) {
    console.log('🧪 DRY RUN - Would process these analysts but not making actual API calls')
    console.log(`📊 Would use approximately ${estimatedRequests} API requests`)
    process.exit(0)
  }

  // Process each analyst
  let successCount = 0
  let errorCount = 0
  let totalTweets = 0

  for (const analyst of analysts) {
    if (!analyst.twitterUserId) {
      console.log(`⚠️  Skipping ${analyst.firstName} ${analyst.lastName} - no Twitter User ID`)
      errorCount++
      continue
    }

    try {
      console.log(`🔄 Processing ${analyst.firstName} ${analyst.lastName}...`)
      
      // Make API call to our Twitter fetch endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/social-media/twitter-fetch?userId=${analyst.twitterUserId}&count=${TWEETS_PER_ANALYST}&store=true&analystId=${analyst.id}`)
      
      const result = await response.json()
      
      if (result.success) {
        const tweetsFound = result.data.tweets?.length || 0
        const tweetsStored = result.data.stored || 0
        
        console.log(`✅ Success: ${tweetsFound} tweets found, ${tweetsStored} stored`)
        successCount++
        totalTweets += tweetsStored
        
        // Update last sync time
        await supabase
          .from('analysts')
          .update({ 
            lastTwitterSync: new Date().toISOString(),
            twitterSyncCount: analyst.twitterSyncCount ? analyst.twitterSyncCount + 1 : 1
          })
          .eq('id', analyst.id)
          
      } else {
        console.log(`❌ Failed: ${result.error}`)
        errorCount++
      }
      
      // Wait between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 2000))
      
    } catch (error) {
      console.log(`❌ Error processing ${analyst.firstName} ${analyst.lastName}:`, error.message)
      errorCount++
    }
  }

  // Summary
  console.log('')
  console.log('📊 Weekly Sync Summary:')
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  console.log(`   🐦 Total tweets stored: ${totalTweets}`)
  console.log(`   📈 API requests used: ${successCount}`)
  
  // Update final usage
  const finalUsage = await checkCurrentUsage(supabase)
  console.log(`   📊 Monthly usage now: ${finalUsage.monthlyTotal}/500`)
  console.log('')
  console.log('🎉 Weekly Twitter sync complete!')
}

async function checkCurrentUsage(supabase) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday

  // Get monthly usage
  const { data: monthlyRecords } = await supabase
    .from('twitter_api_usage')
    .select('requests_used')
    .gte('date', startOfMonth.toISOString().split('T')[0])

  // Get weekly usage
  const { data: weeklyRecords } = await supabase
    .from('twitter_api_usage')
    .select('requests_used')
    .gte('date', startOfWeek.toISOString().split('T')[0])

  // Count analysts with Twitter user IDs
  const { data: analysts } = await supabase
    .from('analysts')
    .select('id')
    .not('twitterUserId', 'is', null)
    .neq('twitterUserId', '')

  const monthlyTotal = monthlyRecords?.reduce((sum, r) => sum + r.requests_used, 0) || 0
  const thisWeek = weeklyRecords?.reduce((sum, r) => sum + r.requests_used, 0) || 0

  return {
    monthlyTotal,
    thisWeek,
    availableAnalysts: analysts?.length || 0
  }
}

async function getAnalystsForSync(supabase, maxAnalysts) {
  // Get analysts with Twitter user IDs, prioritizing those not synced recently
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  const { data: analysts } = await supabase
    .from('analysts')
    .select('id, firstName, lastName, company, twitterUserId, lastTwitterSync, twitterSyncCount')
    .not('twitterUserId', 'is', null)
    .neq('twitterUserId', '')
    .or(`lastTwitterSync.is.null,lastTwitterSync.lt.${oneWeekAgo.toISOString()}`)
    .order('lastTwitterSync', { ascending: true, nullsFirst: true })
    .limit(maxAnalysts)

  return analysts || []
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  console.error('💥 Unhandled rejection:', error)
  process.exit(1)
})

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught exception:', error)
  process.exit(1)
})

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}

module.exports = { main }
