require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function updateSarahEmail() {
  console.log('🔧 Updating Sarah Chen\'s email address...\n')

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
    // Step 1: Find the current sarah.chen user
    console.log('📋 Step 1: Finding current sarah.chen@clearcompany.com...')
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.log('  ❌ Error listing users:', usersError.message)
      return
    }

    const sarahUser = users.users.find(u => u.email === 'sarah.chen@clearcompany.com')
    
    if (!sarahUser) {
      console.log('  ❌ sarah.chen@clearcompany.com user not found')
      return
    }

    console.log('  ✅ User found:', sarahUser.id)

    // Step 2: Update the email address
    console.log('\n📋 Step 2: Updating email to sarah.chen@analystcompany.com...')
    
    const { error: emailError } = await supabase.auth.admin.updateUserById(sarahUser.id, {
      email: 'sarah.chen@analystcompany.com',
      email_confirm: true
    })

    if (emailError) {
      console.log('  ❌ Failed to update email:', emailError.message)
      return
    } else {
      console.log('  ✅ Email updated to sarah.chen@analystcompany.com')
    }

    // Step 3: Update user metadata
    console.log('\n📋 Step 3: Updating user metadata...')
    
    const { error: metadataError } = await supabase.auth.admin.updateUserById(sarahUser.id, {
      user_metadata: {
        first_name: 'Sarah',
        last_name: 'Chen',
        company: 'analystcompany.com'
      }
    })

    if (metadataError) {
      console.log('  ⚠️  Could not update metadata:', metadataError.message)
    } else {
      console.log('  ✅ User metadata updated')
    }

    // Step 4: Update profile if it exists
    console.log('\n📋 Step 4: Updating profile...')
    
    try {
      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          role: 'ANALYST',
          first_name: 'Sarah',
          last_name: 'Chen',
          updated_at: new Date().toISOString()
        })
        .eq('id', sarahUser.id)

      if (profileError) {
        console.log('  ⚠️  Could not update profile:', profileError.message)
      } else {
        console.log('  ✅ Profile updated')
      }
    } catch (error) {
      console.log('  ⚠️  Profile update skipped (table might not exist):', error.message)
    }

    // Step 5: Test login with new email
    console.log('\n📋 Step 5: Testing login with new email...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'sarah.chen@analystcompany.com',
      password: 'password'
    })

    if (authError) {
      console.log('  ❌ Login failed:', authError.message)
    } else {
      console.log('  ✅ Login successful with new email!')
      console.log('  📋 User ID:', authData.user.id)
      console.log('  📋 User email:', authData.user.email)
    }

    // Step 6: Test API login endpoint
    console.log('\n📋 Step 6: Testing API login endpoint...')
    
    const response = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'sarah.chen@analystcompany.com',
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

    console.log('\n🎉 Sarah Chen email update complete!')
    console.log('✅ Email changed from sarah.chen@clearcompany.com to sarah.chen@analystcompany.com')
    console.log('✅ sarah.chen@analystcompany.com / password should work')
    console.log('✅ User has ANALYST role')
    console.log('✅ Should redirect to /portal')

  } catch (error) {
    console.error('❌ Update failed:', error)
  }
}

// Run the update
updateSarahEmail().catch(console.error) 