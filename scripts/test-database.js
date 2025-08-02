require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

async function testDatabase() {
  console.log('🔍 Testing database connection and CalendarConnection table...\n')
  
  // Test 1: Basic connection
  console.log('1. Testing Supabase connection...')
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
    // Test basic connectivity by checking if we can access any table
    const { data, error } = await supabase.rpc('version')
    if (error) {
      console.log('❌ Supabase connection failed:', error.message)
      console.log('   Code:', error.code)
      console.log('   Details:', error.details)
      console.log('   Hint:', error.hint)
      
      // Try a different approach - check what tables exist
      console.log('\n🔍 Trying to list tables...')
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .limit(10)
      
      if (tablesError) {
        console.log('❌ Cannot list tables:', tablesError.message)
      } else {
        console.log('✅ Found tables:', tables?.map(t => t.table_name) || [])
      }
      return
    } else {
      console.log('✅ Supabase connection successful')
      console.log('📊 Database version info:', data || 'Available')
    }
  } catch (err) {
    console.log('❌ Supabase connection error:', err.message)
    return
  }
  
  // Test 2: Check if CalendarConnection table exists
  console.log('\n2. Checking CalendarConnection table...')
  try {
    const { data, error } = await supabase
      .from('CalendarConnection')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ CalendarConnection table error:', error.message)
      console.log('   Code:', error.code)
      console.log('   Details:', error.details)
      console.log('   Hint:', error.hint)
      
      if (error.code === '42P01') {
        console.log('\n💡 The table does not exist. Creating it...')
        
        // Try to create the table
        const { error: createError } = await supabase.rpc('exec', {
          sql: `
            CREATE TABLE IF NOT EXISTS "CalendarConnection" (
              id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
              user_id TEXT NOT NULL,
              provider TEXT NOT NULL DEFAULT 'google',
              title TEXT,
              email TEXT NOT NULL,
              access_token TEXT NOT NULL,
              refresh_token TEXT,
              token_expiry TIMESTAMPTZ,
              calendar_id TEXT,
              calendar_name TEXT,
              status TEXT NOT NULL DEFAULT 'ACTIVE',
              is_active BOOLEAN NOT NULL DEFAULT true,
              last_sync TIMESTAMPTZ,
              sync_in_progress BOOLEAN NOT NULL DEFAULT false,
              created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
              updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
          `
        })
        
        if (createError) {
          console.log('❌ Failed to create table:', createError.message)
        } else {
          console.log('✅ Table created successfully')
        }
      }
    } else {
      console.log('✅ CalendarConnection table exists and is accessible')
    }
  } catch (err) {
    console.log('❌ CalendarConnection table test error:', err.message)
  }
  
  // Test 3: Try a simple query
  console.log('\n3. Testing simple query...')
  try {
    const { data, error } = await supabase
      .from('CalendarConnection')
      .select('id, email, created_at')
      .limit(5)
    
    if (error) {
      console.log('❌ Query failed:', error.message)
    } else {
      console.log('✅ Query successful')
      console.log('📊 Found', data?.length || 0, 'calendar connections')
      if (data && data.length > 0) {
        console.log('📋 Sample record:', data[0])
      }
    }
  } catch (err) {
    console.log('❌ Query error:', err.message)
  }
  
  console.log('\n🏁 Database test completed')
}

testDatabase().catch(console.error)
