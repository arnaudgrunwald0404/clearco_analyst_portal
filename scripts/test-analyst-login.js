require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function testAnalystLogin() {
  console.log('🔐 Testing Analyst Login...\n')

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
    // Test 1: Check if sarah.chen@clearcompany.com exists
    console.log('📋 Test 1: Checking if sarah.chen@clearcompany.com exists...')
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.log('  ❌ Error listing users:', usersError.message)
      return
    }

    const sarahUser = users.users.find(u => u.email === 'sarah.chen@clearcompany.com')
    
    if (!sarahUser) {
      console.log('  ❌ sarah.chen@clearcompany.com user not found')
      console.log('  📋 Creating analyst user...')
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'sarah.chen@clearcompany.com',
        password: 'password',
        email_confirm: true,
        user_metadata: {
          first_name: 'Sarah',
          last_name: 'Chen',
          company: 'clearcompany.com'
        }
      })

      if (createError) {
        console.log('  ❌ Failed to create user:', createError.message)
        return
      }

      console.log('  ✅ User created successfully')
      
      // Create profile with ANALYST role
      const profileData = {
        id: newUser.user.id,
        role: 'ANALYST',
        first_name: 'Sarah',
        last_name: 'Chen',
        company: 'clearcompany.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert(profileData)

      if (profileError) {
        console.log('  ❌ Failed to create profile:', profileError.message)
      } else {
        console.log('  ✅ Profile created with ANALYST role')
      }
    } else {
      console.log('  ✅ User exists:', sarahUser.id)
      
      // Update profile to ensure it has ANALYST role
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'ANALYST',
          first_name: 'Sarah',
          last_name: 'Chen',
          company: 'clearcompany.com',
          updated_at: new Date().toISOString()
        })
        .eq('id', sarahUser.id)

      if (updateError) {
        console.log('  ⚠️  Could not update profile:', updateError.message)
      } else {
        console.log('  ✅ Profile updated with ANALYST role')
      }
    }

    // Test 2: Test login
    console.log('\n📋 Test 2: Testing login...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'sarah.chen@clearcompany.com',
      password: 'password'
    })

    if (authError) {
      console.log('  ❌ Login failed:', authError.message)
      return
    }

    console.log('  ✅ Login successful')
    console.log('  📋 User ID:', authData.user.id)
    console.log('  📋 User email:', authData.user.email)

    // Test 3: Check profile
    console.log('\n📋 Test 3: Checking profile...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('  ❌ Profile check failed:', profileError.message)
    } else {
      console.log('  ✅ Profile found:', profile)
      console.log('  📋 Role:', profile.role)
    }

    // Test 4: Test API login endpoint
    console.log('\n📋 Test 4: Testing API login endpoint...')
    
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'sarah.chen@clearcompany.com',
        password: 'password'
      })
    })

    const result = await response.json()
    
    if (response.ok) {
      console.log('  ✅ API login successful')
      console.log('  📋 Response:', result)
      console.log('  📋 Redirect to:', result.redirectTo)
    } else {
      console.log('  ❌ API login failed:', result.error)
    }

    console.log('\n🎉 Analyst login test complete!')
    console.log('✅ sarah.chen@clearcompany.com / password should work')
    console.log('✅ Should redirect to /portal for analyst users')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testAnalystLogin().catch(console.error) 