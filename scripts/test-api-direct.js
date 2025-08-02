require('dotenv').config({ path: '.env' })

const { createClient } = require('@supabase/supabase-js')

async function testAPICall() {
  console.log('🔍 Testing calendar connections API directly...\n')
  
  try {
    console.log('1. Creating service client...')
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
    console.log('✅ Service client created')
    
    console.log('\n2. Testing query with service role...')
    const userId = 'd129d3b9-6cb7-4e77-ac3f-f233e1e047a0'
    console.log('👤 Using userId:', userId)
    
    const { data: connections, error } = await supabase
      .from('CalendarConnection')
      .select(`
        id,
        title,
        email,
        isActive,
        lastSyncAt,
        createdAt
      `)
      .eq('userId', userId)
      .order('createdAt', { ascending: false })
    
    if (error) {
      console.log('❌ Query failed:', error.message)
      console.log('   Code:', error.code)
      console.log('   Details:', error.details)
      console.log('   Hint:', error.hint)
    } else {
      console.log('✅ Query successful!')
      console.log('📊 Found connections:', connections?.length || 0)
      if (connections && connections.length > 0) {
        console.log('📋 Sample connection:', connections[0])
      }
    }
    
    console.log('\n3. Testing simple count query...')
    const { count, error: countError } = await supabase
      .from('CalendarConnection')
      .select('id', { count: 'exact' })
      .limit(1)
    
    if (countError) {
      console.log('❌ Count query failed:', countError.message)
    } else {
      console.log('✅ Count query successful. Total records:', count)
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
    console.error('   Stack:', error.stack)
  }
  
  console.log('\n🏁 API test completed')
}

testAPICall().catch(console.error)
