const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qimvwwfwakvgfvclqpue.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function testSocialSync() {
  console.log('🧪 Testing Social Handle Synchronization...\n')

  try {
    // Test 1: Update an existing analyst's social media data
    console.log('📝 Test 1: Updating analyst social media data...')
    
    // Find an analyst to test with
    const { data: testAnalyst, error: findError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, twitterHandle, linkedinUrl, personalWebsite')
      .limit(1)
      .single()

    if (findError || !testAnalyst) {
      console.error('❌ No test analyst found:', findError)
      return
    }

    console.log(`   Using test analyst: ${testAnalyst.firstName} ${testAnalyst.lastName}`)

    // Count existing social handles
    const { count: beforeCount, error: beforeCountError } = await supabase
      .from('SocialHandle')
      .select('*', { count: 'exact', head: true })
      .eq('analystId', testAnalyst.id)

    if (beforeCountError) {
      console.error('❌ Error counting before:', beforeCountError)
      return
    }

    console.log(`   Before: ${beforeCount || 0} social handles`)

    // Update the analyst with new social media data
    const testData = {
      twitterHandle: '@testsync2024',
      linkedinUrl: 'https://www.linkedin.com/in/testsync2024',
      personalWebsite: 'https://testsync2024.com'
    }

    const { data: updatedAnalyst, error: updateError } = await supabase
      .from('analysts')
      .update(testData)
      .eq('id', testAnalyst.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Error updating analyst:', updateError)
      return
    }

    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if social handles were created/updated
    const { data: socialHandles, error: socialError } = await supabase
      .from('SocialHandle')
      .select('*')
      .eq('analystId', testAnalyst.id)

    if (socialError) {
      console.error('❌ Error fetching social handles:', socialError)
      return
    }

    console.log(`   After: ${socialHandles.length} social handles`)
    socialHandles.forEach(handle => {
      console.log(`     - ${handle.platform}: ${handle.handle}`)
    })

    // Test 2: Remove social media data
    console.log('\n📝 Test 2: Removing social media data...')
    
    const { error: removeError } = await supabase
      .from('analysts')
      .update({
        twitterHandle: null,
        linkedinUrl: null,
        personalWebsite: null
      })
      .eq('id', testAnalyst.id)

    if (removeError) {
      console.error('❌ Error removing social data:', removeError)
      return
    }

    // Wait a moment for triggers to process
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check if social handles were removed
    const { data: remainingHandles, error: remainingError } = await supabase
      .from('SocialHandle')
      .select('*')
      .eq('analystId', testAnalyst.id)

    if (remainingError) {
      console.error('❌ Error fetching remaining handles:', remainingError)
      return
    }

    console.log(`   After removal: ${remainingHandles.length} social handles`)

    // Restore original data
    console.log('\n🔄 Restoring original analyst data...')
    await supabase
      .from('analysts')
      .update({
        twitterHandle: testAnalyst.twitterHandle,
        linkedinUrl: testAnalyst.linkedinUrl,
        personalWebsite: testAnalyst.personalWebsite
      })
      .eq('id', testAnalyst.id)

    console.log('✅ Social sync test completed successfully!')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testSocialSync()
  .then(() => {
    console.log('\n✅ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })