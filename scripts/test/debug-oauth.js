const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env file manually
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    if (line.includes('=') && !line.startsWith('#')) {
      const [key, value] = line.split('=')
      process.env[key] = value
    }
  })
}

async function debugOAuth() {
  console.log('🔍 Debugging Supabase OAuth Configuration')
  console.log('=' .repeat(50))
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('Supabase URL:', supabaseUrl)
  console.log('Supabase Key:', supabaseKey ? 'Present' : 'Missing')
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration')
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test if we can reach Supabase
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message)
    } else {
      console.log('✅ Supabase connection successful')
    }
    
    // Test OAuth providers endpoint
    console.log('\n🔍 Testing OAuth providers...')
    const { data: providers, error: providerError } = await supabase.auth.getOAuthUrl({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:3000/auth/callback'
      }
    })
    
    if (providerError) {
      console.error('❌ OAuth provider error:', providerError.message)
      console.log('💡 This likely means Google OAuth is not configured in Supabase dashboard')
    } else {
      console.log('✅ Google OAuth provider is configured')
      console.log('OAuth URL structure looks correct')
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
  
  console.log('\n📋 Next Steps:')
  console.log('1. Check Supabase Dashboard → Authentication → Providers')
  console.log('2. Ensure Google OAuth is enabled with correct credentials')
  console.log('3. Verify redirect URI: https://qimvwwfwakvgfvclqpue.supabase.co/auth/v1/callback')
  console.log('4. Update Google Cloud Console with Supabase redirect URI')
}

debugOAuth().catch(console.error)
