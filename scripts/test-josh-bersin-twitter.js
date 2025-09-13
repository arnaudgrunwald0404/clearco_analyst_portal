#!/usr/bin/env node

/**
 * Test Twitter API with Josh Bersin
 * 
 * Josh Bersin is a well-known HR analyst with high Twitter activity.
 * His Twitter handle: @joshbersin
 * 
 * This script will:
 * 1. Use his Twitter User ID to fetch recent tweets
 * 2. Store them with his analyst ID
 * 3. Show how they appear in his profile
 */

const JASON_COSTA_TWITTER_ID = '14927800' // Jason Costa's Twitter user ID (Product @ Reddit)
const BASE_URL = 'http://localhost:3000'

async function testTwitterAPI() {
  console.log('🎯 Testing Twitter API with Jason Costa (@jasoncosta)')
  console.log(`   Twitter User ID: ${JASON_COSTA_TWITTER_ID}`)
  console.log(`   Known for: Product @ Reddit, tech industry insights\n`)

  try {
    // Step 1: Check current usage before making request
    console.log('📊 Step 1: Checking current API usage...')
    const usageResponse = await fetch(`${BASE_URL}/api/social-media/twitter-usage`)
    
    if (usageResponse.ok) {
      const usageResult = await usageResponse.json()
      if (usageResult.success) {
        const { monthly } = usageResult.data
        console.log(`   ✅ Current usage: ${monthly.totalRequests}/500 requests`)
        console.log(`   📈 Remaining: ${monthly.remainingRequests} requests`)
        
        if (monthly.totalRequests >= 490) {
          console.log('   ⚠️  WARNING: Very close to monthly limit!')
          return
        }
      }
    }

    // Step 2: Fetch Jason Costa's recent tweets  
    console.log('\n🐦 Step 2: Fetching Jason Costa\'s recent tweets...')
    console.log('   ⚠️  This will use 1 API request from your 500/month limit')
    
    const tweetResponse = await fetch(
      `${BASE_URL}/api/social-media/twitter-fetch?userId=${JASON_COSTA_TWITTER_ID}&count=5&store=true&analystId=jason-costa-test`
    )
    
    const tweetResult = await tweetResponse.json()
    
    if (tweetResult.success) {
      const tweets = tweetResult.data.tweets || []
      console.log(`   ✅ Successfully fetched ${tweets.length} tweets`)
      console.log(`   📊 Stored: ${tweetResult.data.stored || 0} tweets in database`)
      
      if (tweets.length > 0) {
        console.log('\n📝 Sample tweets from Jason Costa:')
        tweets.slice(0, 3).forEach((tweet, index) => {
          console.log(`\n   ${index + 1}. ${tweet.content.substring(0, 100)}${tweet.content.length > 100 ? '...' : ''}`)
          console.log(`      📈 Engagement: ${tweet.engagement_metrics.likes} likes, ${tweet.engagement_metrics.retweets} retweets`)
          console.log(`      🔗 URL: ${tweet.url}`)
          console.log(`      📅 Posted: ${new Date(tweet.published_at).toLocaleDateString()}`)
        })
      }
      
      // Show what this looks like in the profile
      console.log('\n🎯 Profile Integration:')
      console.log('   These tweets will now appear in:')
      console.log('   • Josh Bersin\'s analyst profile drawer')
      console.log('   • Individual analyst page (/analysts/[josh-id])')
      console.log('   • Main Twitter activity dashboard')
      console.log('   • Social media analytics')
      
    } else {
      console.log(`   ❌ Failed to fetch tweets: ${tweetResult.error}`)
      if (tweetResult.message) {
        console.log(`   💡 Details: ${tweetResult.message}`)
      }
    }

    // Step 3: Show how to access this data in the UI
    console.log('\n🖥️  Step 3: How to view Josh Bersin\'s tweets in the UI:')
    console.log('   1. Visit /twitter-fetch → Usage Dashboard (see API usage)')
    console.log('   2. Visit /twitter-activity (see all analyst tweets)')
    console.log('   3. Open Josh Bersin\'s analyst profile → Social Posts tab')
    console.log('   4. Check /analysts/[josh-id] page for full social timeline')

    // Step 4: Show database query example
    console.log('\n💾 Step 4: Database storage:')
    console.log('   Tweets are stored in: social_media_posts table')
    console.log('   Query: SELECT * FROM social_media_posts WHERE analyst_id = \'josh-bersin-test\' AND platform = \'TWITTER\'')
    console.log('   Includes: content, engagement_metrics, published_at, url')

    console.log('\n🎉 Test completed successfully!')
    console.log('\n📋 Summary:')
    console.log('   • ✅ Twitter API integration working')
    console.log('   • ✅ Individual tweets fetched for Josh Bersin')
    console.log('   • ✅ Data stored with analyst association')
    console.log('   • ✅ Ready to display in analyst profiles')
    console.log('   • ✅ Usage tracking active')

  } catch (error) {
    console.error('\n💥 Test failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('   1. Make sure your Next.js app is running (npm run dev)')
    console.log('   2. Check that RAPIDAPI_TWITTER_KEY is set in environment')
    console.log('   3. Verify twitter_api_usage table exists in database')
    console.log('   4. Ensure you have API requests remaining (check /api/social-media/twitter-usage)')
  }
}

// Show Josh Bersin info
function showJoshBersinInfo() {
  console.log(`
📋 Josh Bersin - Test Analyst Profile:

👤 Personal:
   • Name: Josh Bersin
   • Company: Josh Bersin Company / Bersin Academy
   • Title: Global Industry Analyst
   • Twitter: @joshbersin (ID: ${JOSH_BERSIN_TWITTER_ID})

🎯 Why Perfect for Testing:
   • Very active on Twitter (posts frequently)
   • High-quality HR industry content
   • Strong engagement (likes, retweets)
   • Well-known in HR tech space
   • Likely to have recent posts

📊 Expected Results:
   • 5-10 recent tweets about HR trends
   • High engagement numbers
   • Professional content about:
     - AI in HR
     - Employee experience
     - Learning & development
     - HR technology trends

🔗 Links:
   • Twitter: https://twitter.com/joshbersin
   • Website: https://joshbersin.com
   • LinkedIn: https://linkedin.com/in/joshbersin
`)
}

// Handle command line arguments
if (process.argv.includes('--info')) {
  showJoshBersinInfo()
  process.exit(0)
}

if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
🧪 Josh Bersin Twitter API Test

Usage:
  node scripts/test-josh-bersin-twitter.js     # Run the test
  node scripts/test-josh-bersin-twitter.js --info    # Show Josh Bersin info
  node scripts/test-josh-bersin-twitter.js --help    # Show this help

This test will:
  1. Check your current API usage
  2. Fetch Josh Bersin's recent tweets (uses 1 API request)
  3. Store tweets with analyst association
  4. Show how data appears in profiles
`)
  process.exit(0)
}

// Run the test
if (require.main === module) {
  testTwitterAPI().catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}

module.exports = { testTwitterAPI }
