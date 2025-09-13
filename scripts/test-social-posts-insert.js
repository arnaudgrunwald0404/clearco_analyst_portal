#!/usr/bin/env node

/**
 * Test Social Posts Database Insert
 * This script tests inserting a social media post directly to see any database errors
 */

const BASE_URL = 'http://localhost:3000'

async function testSocialPostsInsert() {
  console.log('🧪 Testing Social Posts Database Insert')

  try {
    // First, test with a simple tweet fetch and store
    console.log('\n📊 Step 1: Fetching tweets with storage...')
    
    const response = await fetch(`${BASE_URL}/api/social-media/twitter-fetch?userId=14211474&count=1&store=true&analystId=test-analyst-db`)
    const result = await response.json()
    
    console.log('Response status:', response.status)
    console.log('Response data:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('✅ API call successful')
      console.log(`📊 Tweets found: ${result.data.tweets?.length || 0}`)
      console.log(`💾 Tweets stored: ${result.data.stored || 0}`)
      
      if (result.data.stored === 0 && result.data.tweets?.length > 0) {
        console.log('⚠️  Tweets found but none stored - database issue likely')
      }
    } else {
      console.log('❌ API call failed:', result.error)
    }

  } catch (error) {
    console.error('💥 Test failed:', error)
  }
}

// Run the test
if (require.main === module) {
  testSocialPostsInsert().catch(error => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  })
}

module.exports = { testSocialPostsInsert }
