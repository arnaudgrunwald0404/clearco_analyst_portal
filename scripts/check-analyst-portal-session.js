const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qimvwwfwakvgfvclqpue.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function checkAnalystPortalSession() {
  console.log('🔍 Checking AnalystPortalSession table structure...\n')

  try {
    console.log('✅ AnalystPortalSession table exists')
    
    // Check if there's any data
    const { count, error: countError } = await supabase
      .from('AnalystPortalSession')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error counting records:', countError)
    } else {
      console.log(`📈 Records: ${count || 0}`)
    }

    // Try different column names to understand the structure
    const possibleColumns = [
      'id', 'analystId', 'analyst_id', 'sessionId', 'session_id',
      'sessionData', 'session_data', 'data', 'createdAt', 'created_at',
      'updatedAt', 'updated_at', 'expiresAt', 'expires_at'
    ]

    console.log('\n🧪 Testing possible column names...')
    
    for (const column of possibleColumns) {
      try {
        const { data, error } = await supabase
          .from('AnalystPortalSession')
          .select(column)
          .limit(1)
        
        if (!error) {
          console.log(`✅ Column '${column}' exists`)
        } else {
          console.log(`❌ Column '${column}' does not exist`)
        }
      } catch (err) {
        console.log(`❌ Column '${column}' does not exist`)
      }
    }

    // Try to get all columns by selecting *
    console.log('\n📋 Trying to get all columns...')
    const { data: allColumns, error: allColumnsError } = await supabase
      .from('AnalystPortalSession')
      .select('*')
      .limit(1)

    if (allColumnsError) {
      console.log('❌ Error getting all columns:', allColumnsError.message)
    } else {
      console.log('✅ Successfully queried all columns')
      if (allColumns && allColumns.length > 0) {
        console.log('📋 Available columns:')
        Object.keys(allColumns[0]).forEach(key => {
          console.log(`   - ${key}`)
        })
      } else {
        console.log('📋 No data to determine columns')
      }
    }

  } catch (error) {
    console.error('❌ Error checking AnalystPortalSession:', error)
  }
}

// Run the check
checkAnalystPortalSession()
  .then(() => {
    console.log('\n✅ Check completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Check failed:', error)
    process.exit(1)
  }) 