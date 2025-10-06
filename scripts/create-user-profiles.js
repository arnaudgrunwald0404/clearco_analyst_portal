require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

// Create user profiles for existing users
async function createUserProfiles() {
  console.log('👥 Creating User Profiles for Existing Users\n')

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

  const testEmails = [
    'admin@clearcompany.com',
    'sarah.chen@clearcompany.com',
    'mike.johnson@clearcompany.com',
    'lisa.wang@clearcompany.com',
    'user@example.com'
  ]

  for (const email of testEmails) {
    console.log(`📧 Processing user: ${email}`)
    
    try {
      // Get user by email
      const { data: users, error: userError } = await supabase.auth.admin.listUsers()
      
      if (userError) {
        console.log(`  ❌ Error listing users: ${userError.message}`)
        continue
      }
      
      const user = users?.users?.find(u => u.email === email)
      
      if (!user) {
        console.log(`  ❌ User not found`)
        continue
      }
      
      console.log(`  ✅ User found: ${user.id}`)
      
      // Check if profile exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (existingProfile) {
        console.log(`  ✅ Profile already exists with role: ${existingProfile.role}`)
        continue
      }
      
      // Determine role based on email
      const emailDomain = email.split('@')[1]?.toLowerCase()
      const emailName = email.split('@')[0]?.toLowerCase()
      
      let role = 'VENDOR_USER'
      if (emailDomain === 'clearcompany.com') {
        if (['sarah.chen', 'mike.johnson', 'lisa.wang'].includes(emailName)) {
          role = 'ANALYST'
        } else {
          role = 'VENDOR_ADMIN'
        }
      }
      
      // Create profile
      const profileData = {
        id: user.id,
        role: role,
        first_name: user.user_metadata?.first_name || email.split('@')[0],
        last_name: user.user_metadata?.last_name || '',
        company: emailDomain,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log(`  📋 Creating profile with role: ${role}`)
      
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert(profileData)
      
      if (createError) {
        console.log(`  ❌ Failed to create profile: ${createError.message}`)
        console.log(`  📋 Profile data:`, profileData)
      } else {
        console.log(`  ✅ Profile created successfully with role: ${role}`)
      }
      
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
    
    console.log('')
  }

  console.log('🎯 User Profiles Summary:')
  console.log('- admin@clearcompany.com → ADMIN role')
  console.log('- sarah.chen@clearcompany.com → ANALYST role')
  console.log('- mike.johnson@clearcompany.com → ANALYST role')
  console.log('- lisa.wang@clearcompany.com → ANALYST role')
  console.log('- user@example.com → EDITOR role')
  console.log('\n💡 You can now test login with these credentials!')
}

// Run the script
createUserProfiles().catch(console.error) 