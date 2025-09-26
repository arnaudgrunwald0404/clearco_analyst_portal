const { createClient } = require('@supabase/supabase-js')
// Manually load environment variables
const fs = require('fs')
const path = require('path')

// Simple .env parser
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  const envData = fs.readFileSync(envPath, 'utf8')
  envData.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').replace(/^"|"$/g, '')
      process.env[key] = value
    }
  })
}

console.log('Testing Supabase connection...')

// Test with service role
const supabaseServiceRole = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function testConnection() {
  try {
    console.log('🔍 Testing service role connection...')
    
    // Test vendor_domains table
    console.log('📝 Testing vendor_domains table...')
    const { data, error } = await supabaseServiceRole
      .from('vendor_domains')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error accessing vendor_domains:', error)
    } else {
      console.log('✅ Successfully accessed vendor_domains:', data)
    }
    
    // Test table permissions
    console.log('\n🔍 Testing table info...')
    const { data: tableInfo, error: tableError } = await supabaseServiceRole
      .rpc('get_table_info', { table_name: 'vendor_domains' })
    
    if (tableError) {
      console.log('ℹ️ Could not get table info (function may not exist):', tableError.message)
    } else {
      console.log('📊 Table info:', tableInfo)
    }
    
  } catch (error) {
    console.error('💥 Connection test failed:', error)
  }
}

testConnection()
