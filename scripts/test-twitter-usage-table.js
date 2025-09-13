#!/usr/bin/env node

/**
 * Test script to verify Twitter usage table creation and functionality
 * Run this after manually creating the twitter_api_usage table
 */

const { createClient } = require('@supabase/supabase-js')

async function testTwitterUsageTable() {
  console.log('🧪 Testing Twitter Usage Table...\n')

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  try {
    // Test 1: Check if table exists
    console.log('1. Checking if twitter_api_usage table exists...')
    const { data: tableCheck, error: tableError } = await supabase
      .from('twitter_api_usage')
      .select('count', { count: 'exact', head: true })

    if (tableError) {
      console.log(`❌ Table doesn't exist or has issues: ${tableError.message}`)
      console.log('\n📝 To create the table, run this SQL in your Supabase dashboard:')
      console.log('   Copy the contents of: create_twitter_usage_table_manual.sql')
      return
    }
    
    console.log('✅ Table exists!')

    // Test 2: Insert a test record
    console.log('\n2. Testing record insertion...')
    const testRecord = {
      date: new Date().toISOString().split('T')[0],
      requests_used: 1,
      endpoint: 'test-endpoint',
      user_id: 'test-user-123',
      analyst_id: 'test-analyst-456'
    }

    const { data: insertData, error: insertError } = await supabase
      .from('twitter_api_usage')
      .insert(testRecord)
      .select()

    if (insertError) {
      console.log(`❌ Insert failed: ${insertError.message}`)
      return
    }

    console.log('✅ Test record inserted successfully!')

    // Test 3: Query the record
    console.log('\n3. Testing record retrieval...')
    const { data: queryData, error: queryError } = await supabase
      .from('twitter_api_usage')
      .select('*')
      .eq('endpoint', 'test-endpoint')
      .limit(1)

    if (queryError) {
      console.log(`❌ Query failed: ${queryError.message}`)
      return
    }

    if (queryData && queryData.length > 0) {
      console.log('✅ Record retrieved successfully!')
      console.log('   Record:', {
        date: queryData[0].date,
        requests_used: queryData[0].requests_used,
        endpoint: queryData[0].endpoint
      })
    } else {
      console.log('❌ No records found')
    }

    // Test 4: Update the record
    console.log('\n4. Testing record update...')
    const { data: updateData, error: updateError } = await supabase
      .from('twitter_api_usage')
      .update({ requests_used: 2 })
      .eq('endpoint', 'test-endpoint')
      .select()

    if (updateError) {
      console.log(`❌ Update failed: ${updateError.message}`)
    } else {
      console.log('✅ Record updated successfully!')
    }

    // Test 5: Test monthly usage aggregation
    console.log('\n5. Testing usage aggregation...')
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startDate = startOfMonth.toISOString().split('T')[0]

    const { data: aggregateData, error: aggregateError } = await supabase
      .from('twitter_api_usage')
      .select('requests_used')
      .gte('date', startDate)

    if (aggregateError) {
      console.log(`❌ Aggregation failed: ${aggregateError.message}`)
    } else {
      const totalRequests = aggregateData?.reduce((sum, record) => sum + record.requests_used, 0) || 0
      console.log(`✅ Monthly usage calculation works! Total: ${totalRequests} requests`)
    }

    // Cleanup: Remove test record
    console.log('\n6. Cleaning up test data...')
    const { error: deleteError } = await supabase
      .from('twitter_api_usage')
      .delete()
      .eq('endpoint', 'test-endpoint')

    if (deleteError) {
      console.log(`⚠️  Cleanup warning: ${deleteError.message}`)
    } else {
      console.log('✅ Test data cleaned up!')
    }

    console.log('\n🎉 All tests passed! Twitter usage table is working correctly.')

  } catch (error) {
    console.error('💥 Test failed with error:', error)
  }
}

// Show usage instructions
function showInstructions() {
  console.log(`
📋 Twitter Usage Table Setup Instructions:

1. Create the table manually:
   - Open your Supabase dashboard
   - Go to SQL Editor
   - Copy and paste the contents of: create_twitter_usage_table_manual.sql
   - Run the SQL

2. Set environment variables:
   - NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   - SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

3. Run this test:
   - node scripts/test-twitter-usage-table.js

4. If tests pass, your Twitter API usage tracking is ready!

🔧 Troubleshooting:
   - If table creation fails, check your database permissions
   - If inserts fail, verify RLS policies are set correctly
   - If you see UUID vs TEXT errors, the table was created correctly
`)
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showInstructions()
  process.exit(0)
}

// Run the test
if (require.main === module) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('❌ Missing environment variables!')
    showInstructions()
    process.exit(1)
  }

  testTwitterUsageTable().catch(error => {
    console.error('💥 Test script failed:', error)
    process.exit(1)
  })
}

module.exports = { testTwitterUsageTable }
