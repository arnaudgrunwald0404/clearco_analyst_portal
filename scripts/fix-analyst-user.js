require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function fixAnalystUser() {
  console.log('🔧 Fixing Analyst User...\n')

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
    // Step 1: Find the sarah.chen user
    console.log('📋 Step 1: Finding sarah.chen@clearcompany.com...')
    
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

    // Step 2: Update password
    console.log('\n📋 Step 2: Updating password...')
    
    const { error: passwordError } = await supabase.auth.admin.updateUserById(sarahUser.id, {
      password: 'password'
    })

    if (passwordError) {
      console.log('  ❌ Failed to update password:', passwordError.message)
    } else {
      console.log('  ✅ Password updated to "password"')
    }

    // Step 3: Check current profile structure
    console.log('\n📋 Step 3: Checking profile structure...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', sarahUser.id)
      .single()

    if (profileError) {
      console.log('  ❌ Profile check failed:', profileError.message)
      
      // Create profile without company column
      console.log('  📋 Creating profile without company column...')
      const profileData = {
        id: sarahUser.id,
        role: 'ANALYST',
        first_name: 'Sarah',
        last_name: 'Chen',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)

      if (createError) {
        console.log('  ❌ Failed to create profile:', createError.message)
      } else {
        console.log('  ✅ Profile created successfully')
      }
    } else {
      console.log('  ✅ Profile exists:', profile)
      
      // Update profile to ANALYST role without company column
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'ANALYST',
          first_name: 'Sarah',
          last_name: 'Chen',
          updated_at: new Date().toISOString()
        })
        .eq('id', sarahUser.id)

      if (updateError) {
        console.log('  ❌ Failed to update profile:', updateError.message)
      } else {
        console.log('  ✅ Profile updated with ANALYST role')
      }
    }

    // Step 4: Test login
    console.log('\n📋 Step 4: Testing login...')
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'sarah.chen@clearcompany.com',
      password: 'password'
    })

    if (authError) {
      console.log('  ❌ Login failed:', authError.message)
    } else {
      console.log('  ✅ Login successful!')
      console.log('  📋 User ID:', authData.user.id)
      console.log('  📋 User email:', authData.user.email)
    }

    console.log('\n🎉 Analyst user fix complete!')
    console.log('✅ sarah.chen@clearcompany.com / password should work')
    console.log('✅ User has ANALYST role')
    console.log('✅ Should redirect to /portal')

  } catch (error) {
    console.error('❌ Fix failed:', error)
  }
}

// Run the fix
fixAnalystUser().catch(console.error) 