require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function testLogin() {
  console.log('🔐 Testing Login Functionality\n')

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
    // Test 1: Try to sign in with agrunwald@clearcompany.com
    console.log('📋 Test 1: Testing login with agrunwald@clearcompany.com...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'agrunwald@clearcompany.com',
      password: '3tts3tte'
    })

    if (authError) {
      console.log('  ❌ Login failed:', authError.message)
      return
    }

    console.log('  ✅ Login successful')
    console.log('  📋 User ID:', authData.user.id)
    console.log('  📋 User email:', authData.user.email)

    // Test 2: Check if user profile exists
    console.log('\n📋 Test 2: Checking user profile...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('  ❌ Profile check failed:', profileError.message)
      
      if (profileError.code === 'PGRST116') {
        console.log('  📋 Profile does not exist, creating one...')
        
        const email = authData.user.email || ''
        const emailDomain = email.split('@')[1]?.toLowerCase()
        const emailName = email.split('@')[0]?.toLowerCase()
        
        // Determine role based on email
        let role = 'EDITOR'
        if (emailDomain === 'clearcompany.com') {
          if (emailName === 'sarah.chen' || emailName === 'mike.johnson' || emailName === 'lisa.wang') {
            role = 'ANALYST'
          } else {
            role = 'ADMIN'
          }
        }
        
        const defaultProfile = {
          id: authData.user.id,
          role: role,
          first_name: authData.user.user_metadata?.first_name || 
                     authData.user.email?.split('@')[0] || 'User',
          last_name: authData.user.user_metadata?.last_name || '',
          company: authData.user.user_metadata?.company || 
                  emailDomain || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error: createError } = await supabase
          .from('user_profiles')
          .insert(defaultProfile)

        if (createError) {
          console.log('  ❌ Profile creation failed:', createError)
          console.log('  📋 Error details:', {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint
          })
        } else {
          console.log('  ✅ Profile created successfully')
          console.log('  📋 Profile details:', defaultProfile)
        }
      }
    } else {
      console.log('  ✅ Profile exists')
      console.log('  📋 Profile details:', profile)
    }

    // Test 3: Test API login endpoint
    console.log('\n📋 Test 3: Testing API login endpoint...')
    
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'agrunwald@clearcompany.com',
        password: '3tts3tte'
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('  ✅ API login successful')
      console.log('  📋 Response:', result)
    } else {
      console.log('  ❌ API login failed:', result.error)
    }

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testLogin().catch(console.error) 