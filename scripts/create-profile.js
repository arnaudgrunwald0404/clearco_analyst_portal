require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function createProfile() {
  console.log('🔧 Creating user profile for agrunwald@clearcompany.com...\n')

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
    // Step 1: Get the user ID
    console.log('📋 Step 1: Getting user ID...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.log('  ❌ Error listing users:', usersError.message)
      return
    }

    const agrunwaldUser = users.users.find(u => u.email === 'agrunwald@clearcompany.com')
    
    if (!agrunwaldUser) {
      console.log('  ❌ agrunwald@clearcompany.com user not found')
      return
    }

    console.log('  ✅ Found user:', agrunwaldUser.id)

    // Step 2: Check if profile already exists
    console.log('\n📋 Step 2: Checking if profile exists...')
    const { data: existingProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', agrunwaldUser.id)
      .single()

    if (profileError && profileError.code === 'PGRST116') {
      console.log('  📋 Profile does not exist, creating one...')
      
      // Step 3: Create the profile
      const profileData = {
        id: agrunwaldUser.id,
        role: 'ADMIN',
        first_name: 'Arnaud',
        last_name: 'Grunwald',
        company: 'clearcompany.com',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)

      if (createError) {
        console.log('  ❌ Profile creation failed:', createError.message)
        console.log('  📋 Error details:', createError)
        return
      }

      console.log('  ✅ Profile created successfully!')
      console.log('  📋 Profile data:', profileData)
    } else if (existingProfile) {
      console.log('  ✅ Profile already exists:', existingProfile)
      
      // Update the profile to ensure it has the correct role
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: 'ADMIN',
          first_name: 'Arnaud',
          last_name: 'Grunwald',
          company: 'clearcompany.com',
          updated_at: new Date().toISOString()
        })
        .eq('id', agrunwaldUser.id)

      if (updateError) {
        console.log('  ⚠️  Profile update failed:', updateError.message)
      } else {
        console.log('  ✅ Profile updated successfully')
      }
    } else {
      console.log('  ❌ Error checking profile:', profileError.message)
    }

    // Step 4: Test the profile access
    console.log('\n📋 Step 3: Testing profile access...')
    const { data: testProfile, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', agrunwaldUser.id)
      .single()

    if (testError) {
      console.log('  ❌ Profile access test failed:', testError.message)
    } else {
      console.log('  ✅ Profile access test successful:', testProfile)
    }

    console.log('\n🎉 Profile setup complete!')
    console.log('✅ User profile created/updated for agrunwald@clearcompany.com')
    console.log('✅ Role set to ADMIN')
    console.log('✅ Ready for login testing')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
createProfile().catch(console.error) 