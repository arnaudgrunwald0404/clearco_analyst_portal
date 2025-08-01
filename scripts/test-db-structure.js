require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function testDatabaseStructure() {
  console.log('🔍 Testing Database Structure\n')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )

  try {
    // Test 1: Check if user_profiles table exists
    console.log('📋 Test 1: Checking if user_profiles table exists...')
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles')

    if (tablesError) {
      console.log('  ❌ Error checking tables:', tablesError)
    } else if (tables && tables.length > 0) {
      console.log('  ✅ user_profiles table exists')
    } else {
      console.log('  ❌ user_profiles table does not exist')
      return
    }

    // Test 2: Check table structure
    console.log('\n📋 Test 2: Checking user_profiles table structure...')
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles')
      .order('ordinal_position')

    if (columnsError) {
      console.log('  ❌ Error checking columns:', columnsError)
    } else {
      console.log('  📊 Table columns:')
      columns?.forEach(col => {
        console.log(`    - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
      })
    }

    // Test 3: Try to insert a test profile
    console.log('\n📋 Test 3: Testing profile insertion...')
    
    const testProfile = {
      id: 'test-user-id-' + Date.now(),
      role: 'EDITOR',
      first_name: 'Test',
      last_name: 'User',
      company: 'test.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(testProfile)
      .select()

    if (insertError) {
      console.log('  ❌ Insert failed:', insertError)
      console.log('  📋 Error details:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint
      })
    } else {
      console.log('  ✅ Insert successful:', insertData)
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', testProfile.id)
      
      if (deleteError) {
        console.log('  ⚠️  Could not clean up test data:', deleteError)
      } else {
        console.log('  🧹 Test data cleaned up')
      }
    }

    // Test 4: Check RLS policies
    console.log('\n📋 Test 4: Checking RLS policies...')
    
    const { data: policies, error: policiesError } = await supabase
      .from('information_schema.policies')
      .select('policy_name, permissive, roles, cmd')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_profiles')

    if (policiesError) {
      console.log('  ❌ Error checking policies:', policiesError)
    } else {
      console.log('  📊 RLS policies:')
      policies?.forEach(policy => {
        console.log(`    - ${policy.policy_name}: ${policy.cmd} (${policy.permissive ? 'permissive' : 'restrictive'})`)
      })
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testDatabaseStructure().catch(console.error) 