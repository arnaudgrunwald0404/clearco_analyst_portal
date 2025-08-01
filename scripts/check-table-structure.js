require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function checkTableStructure() {
  console.log('🔍 Checking user_profiles table structure...\n')

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
    // Try to get a single row to see what columns exist
    console.log('📋 Attempting to select from user_profiles...')
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (error) {
      console.log('  ❌ Error:', error.message)
      console.log('  📋 Error details:', error)
    } else {
      console.log('  ✅ Success!')
      console.log('  📋 Data:', data)
      
      if (data && data.length > 0) {
        console.log('  📋 Columns in first row:')
        Object.keys(data[0]).forEach(key => {
          console.log(`    - ${key}: ${typeof data[0][key]} = ${data[0][key]}`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error)
  }
}

// Run the check
checkTableStructure().catch(console.error) 