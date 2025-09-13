/**
 * Conservative test script for Twitter API integration
 * IMPORTANT: Uses minimal API calls due to 500 requests/month limit
 */

const BASE_URL = 'http://localhost:3000'

async function testTwitterAPI() {
  console.log('🐦 Testing Twitter API Integration (Conservative Mode)...\n')
  
  // First check current usage
  console.log('0. Checking current API usage...')
  try {
    const response = await fetch(`${BASE_URL}/api/social-media/twitter-sync`)
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Twitter service is available')
    } else {
      console.log(`❌ Service check failed: ${result.error}`)
    }
  } catch (error) {
    console.log(`❌ Network error: ${error.message}`)
  }

  console.log('')

  // Test 1: Fetch tweets for a specific user ID (ONLY 1 request!)
  console.log('1. Testing individual tweet fetch (1 API request)...')
  console.log('   ⚠️  This will use 1 of your 500 monthly requests!')
  
  // Uncomment the next line only when you want to actually test with real API calls
  // await testSingleFetch()

  console.log('   🧪 Skipped to conserve API usage. Uncomment testSingleFetch() to run.')
  console.log('')

  console.log('\n🎉 Conservative Twitter API testing complete!')
}

async function testSingleFetch() {
  console.log('   Making actual API call...')
  try {
    const response = await fetch(`${BASE_URL}/api/social-media/twitter-fetch?userId=2455740283&count=3`)
    const result = await response.json()
    
    if (result.success) {
      console.log(`   ✅ Successfully fetched ${result.data.tweets.length} tweets`)
      console.log(`   📊 Usage: This used 1 API request`)
      if (result.data.tweets.length > 0) {
        console.log(`   📝 Sample tweet: "${result.data.tweets[0]?.content.substring(0, 80)}..."`)
      }
    } else {
      console.log(`   ❌ Failed: ${result.error}`)
    }
  } catch (error) {
    console.log(`   ❌ Network error: ${error.message}`)
  }
}

// Example of how to use the Twitter service directly (server-side)
function showDirectUsageExample() {
  console.log(`
📖 Direct Usage Examples:

1. Fetch tweets for a user:
   GET /api/social-media/twitter-fetch?userId=2455740283&count=20

2. Fetch and store tweets:
   GET /api/social-media/twitter-fetch?userId=2455740283&count=20&store=true&analystId=analyst-123

3. Batch fetch tweets:
   POST /api/social-media/twitter-fetch
   Body: {
     "userIds": ["2455740283", "123456789"],
     "count": 20,
     "store": true,
     "analystMapping": {
       "2455740283": "analyst-1",
       "123456789": "analyst-2"
     }
   }

4. Sync all analysts:
   POST /api/social-media/twitter-sync
   Body: {
     "maxAnalysts": 10,
     "tweetsPerAnalyst": 20
   }

5. Get analyst Twitter summary:
   GET /api/social-media/twitter-sync?analystId=analyst-123&days=30

🌐 UI Components:
- Visit /twitter-fetch for the interactive UI
- The TwitterPostsFetcher component can be used anywhere in the app
`)
}

// Run the test if this script is executed directly
if (require.main === module) {
  testTwitterAPI().catch(console.error)
  showDirectUsageExample()
}

module.exports = { testTwitterAPI, showDirectUsageExample }
