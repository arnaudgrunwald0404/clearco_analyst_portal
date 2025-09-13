#!/usr/bin/env node

/**
 * Run Twitter API for All Analysts with Twitter Handles
 * 
 * This script finds all analysts with Twitter handles and attempts to fetch their tweets.
 * It will stop after 10 analysts if no results are found to conserve API usage.
 */

const { createClient } = require('@supabase/supabase-js')

const BASE_URL = 'http://localhost:3000'
const MAX_ANALYSTS_BEFORE_STOP = 10
const TWEETS_PER_ANALYST = 5

async function runTwitterForAllAnalysts() {
  console.log('🎯 Running Twitter API for All Analysts with Twitter Handles')
  console.log(`   Max attempts before stopping: ${MAX_ANALYSTS_BEFORE_STOP}`)
  console.log(`   Tweets per analyst: ${TWEETS_PER_ANALYST}\n`)

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Step 1: Check current usage
    console.log('📊 Step 1: Checking current API usage...')
    const usageResponse = await fetch(`${BASE_URL}/api/social-media/twitter-usage`)
    const usageResult = await usageResponse.json()
    
    if (usageResult.success) {
      const { monthly } = usageResult.data
      console.log(`   ✅ Current usage: ${monthly.totalRequests}/500 requests`)
      console.log(`   📈 Remaining: ${monthly.remainingRequests} requests`)
      
      if (monthly.remainingRequests < 50) {
        console.log('   ⚠️  WARNING: Less than 50 requests remaining - stopping')
        return
      }
    }

    // Step 2: Get analysts with Twitter handles
    console.log('\n👥 Step 2: Finding analysts with Twitter handles...')
    
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, company, twitterHandle, twitterUserId')
      .or('twitterHandle.neq.,twitterUserId.neq.')
      .not('twitterHandle', 'is', null)
      .neq('twitterHandle', '')
      .limit(20) // Get up to 20 analysts

    if (analystsError) {
      throw new Error(`Failed to fetch analysts: ${analystsError.message}`)
    }

    if (!analysts || analysts.length === 0) {
      console.log('   ❌ No analysts found with Twitter handles')
      return
    }

    console.log(`   ✅ Found ${analysts.length} analysts with Twitter handles:`)
    analysts.forEach((analyst, index) => {
      console.log(`      ${index + 1}. ${analyst.firstName} ${analyst.lastName} (${analyst.company}) - @${analyst.twitterHandle}`)
    })

    // Step 3: Process analysts one by one
    console.log('\n🐦 Step 3: Processing analysts...')
    
    let successCount = 0
    let totalTweets = 0
    let processedCount = 0
    const results = []

    for (const analyst of analysts) {
      processedCount++
      
      console.log(`\n   Processing ${processedCount}/${analysts.length}: ${analyst.firstName} ${analyst.lastName}`)
      
      // We need Twitter User ID, not handle - skip if we don't have it
      if (!analyst.twitterUserId) {
        console.log(`      ⚠️  Skipping - no Twitter User ID (only have handle: @${analyst.twitterHandle})`)
        results.push({
          analyst: `${analyst.firstName} ${analyst.lastName}`,
          status: 'skipped',
          reason: 'No Twitter User ID',
          tweets: 0
        })
        continue
      }

      try {
        // Make API call
        const response = await fetch(
          `${BASE_URL}/api/social-media/twitter-fetch?userId=${analyst.twitterUserId}&count=${TWEETS_PER_ANALYST}&store=true&analystId=${analyst.id}`
        )
        
        const result = await response.json()
        
        if (result.success) {
          const tweetsFound = result.data.tweets?.length || 0
          const tweetsStored = result.data.stored || 0
          
          console.log(`      ✅ Success: ${tweetsFound} tweets found, ${tweetsStored} stored`)
          
          if (tweetsFound > 0) {
            successCount++
            totalTweets += tweetsStored
            
            // Show sample tweets
            const sampleTweets = result.data.tweets.slice(0, 2)
            sampleTweets.forEach((tweet, idx) => {
              console.log(`         ${idx + 1}. "${tweet.content.substring(0, 60)}..."`)
              console.log(`            💖 ${tweet.engagement_metrics.likes} likes, 🔄 ${tweet.engagement_metrics.retweets} retweets`)
            })
          }
          
          results.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            status: 'success',
            tweets: tweetsFound,
            stored: tweetsStored
          })
          
        } else {
          console.log(`      ❌ Failed: ${result.error}`)
          results.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            status: 'failed',
            error: result.error,
            tweets: 0
          })
        }
        
        // Wait between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.log(`      💥 Error: ${error.message}`)
        results.push({
          analyst: `${analyst.firstName} ${analyst.lastName}`,
          status: 'error',
          error: error.message,
          tweets: 0
        })
      }

      // Stop if we've processed MAX_ANALYSTS_BEFORE_STOP and haven't found any tweets
      if (processedCount >= MAX_ANALYSTS_BEFORE_STOP && totalTweets === 0) {
        console.log(`\n   🛑 Stopping after ${processedCount} analysts - no tweets found yet`)
        console.log('      This suggests the Twitter API might need different handling or user IDs')
        break
      }
    }

    // Step 4: Summary
    console.log('\n📋 Step 4: Summary Report')
    console.log('=' .repeat(50))
    console.log(`   👥 Analysts processed: ${processedCount}`)
    console.log(`   ✅ Successful fetches: ${successCount}`)
    console.log(`   🐦 Total tweets found: ${totalTweets}`)
    console.log(`   📊 API requests used: ${processedCount}`)
    
    // Detailed results
    console.log('\n📊 Detailed Results:')
    results.forEach((result, index) => {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'failed' ? '❌' : 
                    result.status === 'skipped' ? '⚠️' : '💥'
      console.log(`   ${index + 1}. ${status} ${result.analyst}: ${result.tweets} tweets ${result.error ? `(${result.error})` : ''}`)
    })

    // Recommendations
    console.log('\n💡 Recommendations:')
    if (totalTweets === 0) {
      console.log('   • No tweets were extracted - the API response parsing may need adjustment')
      console.log('   • Consider checking the Twitter API response format')
      console.log('   • Some analysts may need Twitter User ID mapping')
    } else {
      console.log('   • Twitter API integration is working!')
      console.log('   • Consider setting up weekly automation for regular updates')
      console.log('   • Monitor API usage to stay within 500 requests/month limit')
    }

    // Final usage check
    const finalUsageResponse = await fetch(`${BASE_URL}/api/social-media/twitter-usage`)
    const finalUsageResult = await finalUsageResponse.json()
    
    if (finalUsageResult.success) {
      const { monthly } = finalUsageResult.data
      console.log(`\n📈 Final API Usage: ${monthly.totalRequests}/500 requests (${monthly.remainingRequests} remaining)`)
    }

  } catch (error) {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🐦 Twitter API Bulk Processor

This script processes all analysts with Twitter handles and attempts to fetch their tweets.
It will automatically stop after ${MAX_ANALYSTS_BEFORE_STOP} analysts if no results are found.

Usage:
  node scripts/run-twitter-for-all-analysts.js

Prerequisites:
  • Next.js dev server running (npm run dev)
  • Twitter API key configured
  • twitter_api_usage table created
  • Analysts with twitterUserId values in database

The script will:
  1. Check current API usage
  2. Find analysts with Twitter handles
  3. Fetch tweets for each analyst
  4. Store results in database
  5. Provide detailed summary report
`)
  process.exit(0)
}

// Run the script
if (require.main === module) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Missing environment variables!')
    console.log('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  runTwitterForAllAnalysts().catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}

module.exports = { runTwitterForAllAnalysts }
