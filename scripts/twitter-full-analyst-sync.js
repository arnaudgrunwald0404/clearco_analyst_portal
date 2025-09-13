#!/usr/bin/env node

/**
 * Full Twitter Analyst Sync
 * 
 * This script:
 * 1. Gets all analysts with Twitter handles
 * 2. Looks up their Twitter User IDs 
 * 3. Fetches their recent tweets
 * 4. Stores everything in the database
 * 
 * Stops after 10 analysts if no results are found to conserve API usage.
 */

const BASE_URL = 'http://localhost:3000'
const MAX_ANALYSTS_BEFORE_STOP = 10
const TWEETS_PER_ANALYST = 5

async function fullTwitterSync() {
  console.log('🎯 Full Twitter Analyst Sync')
  console.log(`   Max attempts before stopping: ${MAX_ANALYSTS_BEFORE_STOP}`)
  console.log(`   Tweets per analyst: ${TWEETS_PER_ANALYST}\n`)

  try {
    // Step 1: Check current usage
    console.log('📊 Step 1: Checking current API usage...')
    const usageResponse = await fetch(`${BASE_URL}/api/social-media/twitter-usage`)
    
    if (usageResponse.ok) {
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
    }

    // Step 2: Get analysts with Twitter handles
    console.log('\n👥 Step 2: Getting analysts with Twitter handles...')
    const analystsResponse = await fetch(`${BASE_URL}/api/analysts`)
    
    if (!analystsResponse.ok) {
      throw new Error(`Failed to fetch analysts: ${analystsResponse.status}`)
    }

    const analystsResult = await analystsResponse.json()
    const allAnalysts = analystsResult.data || []
    
    // Filter analysts with Twitter handles
    const analystsWithTwitter = allAnalysts.filter(analyst => 
      analyst.twitterHandle && 
      analyst.twitterHandle.trim() !== '' &&
      analyst.twitterHandle !== 'null'
    )

    if (analystsWithTwitter.length === 0) {
      console.log('   ❌ No analysts found with Twitter handles')
      return
    }

    console.log(`   ✅ Found ${analystsWithTwitter.length} analysts with Twitter handles`)
    
    // Step 3: Process analysts one by one
    console.log('\n🔍 Step 3: Looking up User IDs and fetching tweets...')
    
    let successCount = 0
    let totalTweets = 0
    let processedCount = 0
    const results = []

    for (const analyst of analystsWithTwitter.slice(0, MAX_ANALYSTS_BEFORE_STOP)) {
      processedCount++
      
      console.log(`\n   ${processedCount}/${Math.min(analystsWithTwitter.length, MAX_ANALYSTS_BEFORE_STOP)}: ${analyst.firstName} ${analyst.lastName} (@${analyst.twitterHandle})`)
      
      try {
        // Step 3a: Look up User ID
        console.log(`      🔍 Looking up User ID for @${analyst.twitterHandle}...`)
        const userLookupResponse = await fetch(
          `${BASE_URL}/api/social-media/twitter-user-lookup?username=${encodeURIComponent(analyst.twitterHandle.replace('@', ''))}`
        )
        
        if (!userLookupResponse.ok) {
          console.log(`      ❌ User lookup failed: ${userLookupResponse.status}`)
          results.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            handle: analyst.twitterHandle,
            status: 'user_lookup_failed',
            tweets: 0
          })
          continue
        }

        const userLookupResult = await userLookupResponse.json()
        
        if (!userLookupResult.success || !userLookupResult.data.user.id) {
          console.log(`      ❌ User not found: ${userLookupResult.error || 'No user ID'}`)
          results.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            handle: analyst.twitterHandle,
            status: 'user_not_found',
            tweets: 0
          })
          continue
        }

        const userId = userLookupResult.data.user.id
        const displayName = userLookupResult.data.user.display_name
        const followersCount = userLookupResult.data.user.followers_count

        console.log(`      ✅ Found User ID: ${userId} (${displayName}, ${followersCount?.toLocaleString()} followers)`)

        // Step 3b: Fetch tweets
        console.log(`      🐦 Fetching ${TWEETS_PER_ANALYST} tweets...`)
        const tweetsResponse = await fetch(
          `${BASE_URL}/api/social-media/twitter-fetch?userId=${userId}&count=${TWEETS_PER_ANALYST}&store=true&analystId=${analyst.id}`
        )
        
        if (!tweetsResponse.ok) {
          console.log(`      ❌ Tweet fetch failed: ${tweetsResponse.status}`)
          results.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            handle: analyst.twitterHandle,
            userId: userId,
            status: 'tweet_fetch_failed',
            tweets: 0
          })
          continue
        }

        const tweetsResult = await tweetsResponse.json()
        
        if (tweetsResult.success) {
          const tweetsFound = tweetsResult.data.tweets?.length || 0
          const tweetsStored = tweetsResult.data.stored || 0
          
          console.log(`      ✅ Success: ${tweetsFound} tweets found, ${tweetsStored} stored`)
          
          if (tweetsFound > 0) {
            successCount++
            totalTweets += tweetsStored
            
            // Show sample tweets
            const sampleTweets = tweetsResult.data.tweets.slice(0, 2)
            sampleTweets.forEach((tweet, idx) => {
              console.log(`         ${idx + 1}. "${tweet.content.substring(0, 60)}..." (${tweet.engagement_metrics.likes} ❤️)`)
            })
          }
          
          results.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            handle: analyst.twitterHandle,
            userId: userId,
            status: 'success',
            tweets: tweetsFound,
            stored: tweetsStored
          })
          
        } else {
          console.log(`      ❌ Tweet fetch failed: ${tweetsResult.error}`)
          results.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            handle: analyst.twitterHandle,
            userId: userId,
            status: 'tweet_processing_failed',
            error: tweetsResult.error,
            tweets: 0
          })
        }
        
        // Wait between requests to respect rate limits
        console.log(`      ⏳ Waiting 2 seconds...`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.log(`      💥 Error: ${error.message}`)
        results.push({
          analyst: `${analyst.firstName} ${analyst.lastName}`,
          handle: analyst.twitterHandle,
          status: 'error',
          error: error.message,
          tweets: 0
        })
      }

      // Stop if we've processed MAX_ANALYSTS_BEFORE_STOP and haven't found any tweets
      if (processedCount >= MAX_ANALYSTS_BEFORE_STOP && totalTweets === 0) {
        console.log(`\n   🛑 Stopping after ${processedCount} analysts - no tweets found yet`)
        console.log('      This might indicate API issues or all accounts are private/suspended')
        break
      }
    }

    // Step 4: Summary Report
    console.log('\n📋 Step 4: Summary Report')
    console.log('=' .repeat(60))
    console.log(`   👥 Analysts processed: ${processedCount}`)
    console.log(`   ✅ Successful syncs: ${successCount}`)
    console.log(`   🐦 Total tweets stored: ${totalTweets}`)
    console.log(`   📊 API requests used: ~${processedCount * 2} (lookup + fetch per analyst)`)
    
    // Success rate
    const successRate = processedCount > 0 ? ((successCount / processedCount) * 100).toFixed(1) : '0'
    console.log(`   📈 Success rate: ${successRate}%`)
    
    // Detailed results table
    console.log('\n📊 Detailed Results:')
    console.log('   ' + 'Name'.padEnd(25) + 'Handle'.padEnd(15) + 'Status'.padEnd(20) + 'Tweets')
    console.log('   ' + '-'.repeat(70))
    
    results.forEach((result) => {
      const statusIcon = result.status === 'success' ? '✅' : 
                        result.status.includes('failed') ? '❌' : 
                        result.status.includes('not_found') ? '⚠️' : '💥'
      
      const name = result.analyst.substring(0, 23).padEnd(25)
      const handle = result.handle.substring(0, 13).padEnd(15)
      const status = `${statusIcon} ${result.status}`.substring(0, 18).padEnd(20)
      const tweets = result.tweets.toString()
      
      console.log(`   ${name}${handle}${status}${tweets}`)
    })

    // Recommendations
    console.log('\n💡 Recommendations:')
    if (totalTweets === 0) {
      console.log('   • No tweets were found - check if accounts exist and are public')
      console.log('   • Some analysts may have changed their Twitter handles')
      console.log('   • Consider verifying Twitter handles in the database')
    } else {
      console.log('   • ✅ Twitter integration is working!')
      console.log('   • Consider updating analyst profiles with Twitter User IDs')
      console.log('   • Set up weekly automation for regular updates')
      console.log('   • Monitor API usage to stay within 500 requests/month limit')
    }

    // Final usage check
    console.log('\n📈 Final API Usage Check...')
    const finalUsageResponse = await fetch(`${BASE_URL}/api/social-media/twitter-usage`)
    if (finalUsageResponse.ok) {
      const finalUsageResult = await finalUsageResponse.json()
      if (finalUsageResult.success) {
        const { monthly } = finalUsageResult.data
        console.log(`   📊 Total usage: ${monthly.totalRequests}/500 requests`)
        console.log(`   📈 Remaining: ${monthly.remainingRequests} requests`)
        
        if (monthly.remainingRequests < 100) {
          console.log('   ⚠️  WARNING: Less than 100 requests remaining')
        }
      }
    }

    console.log(`\n🎉 Sync completed! ${successCount} analysts processed successfully.`)

  } catch (error) {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🐦 Full Twitter Analyst Sync

This script performs a complete Twitter sync for all analysts:
1. Looks up Twitter User IDs from usernames
2. Fetches recent tweets for each analyst
3. Stores tweets in the database with analyst associations

Usage:
  node scripts/twitter-full-analyst-sync.js

Prerequisites:
  • Next.js dev server running (npm run dev)
  • Twitter API key configured
  • twitter_api_usage table created

The script will automatically:
  • Check API usage before starting
  • Stop after ${MAX_ANALYSTS_BEFORE_STOP} analysts if no results found
  • Wait between requests to respect rate limits
  • Provide detailed progress and summary reports
`)
  process.exit(0)
}

// Run the script
if (require.main === module) {
  fullTwitterSync().catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}

module.exports = { fullTwitterSync }
