#!/usr/bin/env node

/**
 * Add test social media posts for Holger Mueller to demonstrate the feature
 */

const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
})

async function addTestSocialPosts() {
  try {
    console.log('🔍 Adding test social media posts for Holger Mueller...')

    // Holger Mueller's analyst ID
    const analystId = 'clme7pnembc6in2b'

    // Test social media posts
    const testPosts = [
      {
        id: 'test-twitter-1',
        content: 'Just published my latest research on AI-driven talent acquisition. The data shows a 40% improvement in candidate quality when AI is used strategically. #HRTech #AI #TalentAcquisition',
        platform: 'X',
        url: 'https://x.com/holgermu/status/1234567890',
        postedAt: new Date('2024-12-01T10:30:00Z').toISOString(),
        analystId: analystId,
        engagements: 156,
        likes: 89,
        shares: 34,
        comments: 23
      },
      {
        id: 'test-linkedin-1', 
        content: 'Exciting developments in employee experience technology! Our latest Constellation Research report reveals that companies investing in EX platforms see 3x higher employee satisfaction scores. The ROI is clear - happy employees drive better business outcomes.',
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/posts/holgermueller_hrtech-employeeexperience-activity-1234567890',
        postedAt: new Date('2024-11-28T14:15:00Z').toISOString(),
        analystId: analystId,
        engagements: 284,
        likes: 167,
        shares: 45,
        comments: 72
      },
      {
        id: 'test-twitter-2',
        content: 'The future of work is hybrid, but the technology to support it is still evolving. Key insight from today\'s analyst briefing: 67% of companies are struggling with collaboration tools integration. We need better solutions. 🧵',
        platform: 'X', 
        url: 'https://x.com/holgermu/status/1234567891',
        postedAt: new Date('2024-11-25T16:45:00Z').toISOString(),
        analystId: analystId,
        engagements: 203,
        likes: 134,
        shares: 45,
        comments: 24
      },
      {
        id: 'test-linkedin-2',
        content: 'Thrilled to speak at #HRTechConf next month about the intersection of AI and human-centered design in HR technology. The session will cover real-world case studies and practical implementation strategies. Looking forward to the discussions!',
        platform: 'LINKEDIN',
        url: 'https://linkedin.com/posts/holgermueller_hrtechconf-ai-activity-1234567891', 
        postedAt: new Date('2024-11-20T09:20:00Z').toISOString(),
        analystId: analystId,
        engagements: 342,
        likes: 198,
        shares: 67,
        comments: 77
      },
      {
        id: 'test-twitter-3',
        content: 'New data from our enterprise survey: Companies using AI for performance management report 25% better goal achievement rates. But here\'s the catch - success depends heavily on change management and employee trust. Implementation matters more than technology.',
        platform: 'X',
        url: 'https://x.com/holgermu/status/1234567892',
        postedAt: new Date('2024-11-15T11:10:00Z').toISOString(),
        analystId: analystId,
        engagements: 178,
        likes: 112,
        shares: 38,
        comments: 28
      }
    ]

    console.log(`📝 Inserting ${testPosts.length} test social posts...`)

    // Insert the test posts
    const { data, error } = await supabase
      .from('social_posts')
      .upsert(testPosts, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select()

    if (error) {
      console.error('❌ Error inserting test posts:', error)
      return
    }

    console.log(`✅ Successfully inserted ${data?.length || 0} social media posts`)
    console.log('🎉 Test data added! Holger Mueller should now show social media activity in the UI.')

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the script
addTestSocialPosts()
