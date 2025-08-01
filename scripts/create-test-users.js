require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

// Create test users with different email types
async function createTestUsers() {
  console.log('👥 Creating Test Users with Different Email Types\n')

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

  const testUsers = [
    {
      email: 'admin@clearcompany.com',
      password: 'testpassword123',
      firstName: 'Admin',
      lastName: 'User',
      expectedRole: 'ADMIN'
    },
    {
      email: 'sarah.chen@clearcompany.com',
      password: 'testpassword123',
      firstName: 'Sarah',
      lastName: 'Chen',
      expectedRole: 'ANALYST'
    },
    {
      email: 'mike.johnson@clearcompany.com',
      password: 'testpassword123',
      firstName: 'Mike',
      lastName: 'Johnson',
      expectedRole: 'ANALYST'
    },
    {
      email: 'lisa.wang@clearcompany.com',
      password: 'testpassword123',
      firstName: 'Lisa',
      lastName: 'Wang',
      expectedRole: 'ANALYST'
    },
    {
      email: 'user@example.com',
      password: 'testpassword123',
      firstName: 'Regular',
      lastName: 'User',
      expectedRole: 'EDITOR'
    }
  ]

  for (const userData of testUsers) {
    console.log(`📧 Creating user: ${userData.email}`)
    
    try {
      // Check if user already exists
      const { data: existingUser, error: userError } = await supabase.auth.admin.listUsers()
      const existingUserData = existingUser?.users?.find(user => user.email === userData.email)
      
      if (existingUserData) {
        console.log(`  ⚠️  User already exists`)
        
        // Update user profile if needed
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', existingUserData.id)
          .single()
        
        if (profile && profile.role !== userData.expectedRole) {
          console.log(`  🔄 Updating role from ${profile.role} to ${userData.expectedRole}`)
          
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ 
              role: userData.expectedRole,
              first_name: userData.firstName,
              last_name: userData.lastName,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingUserData.id)
          
          if (updateError) {
            console.log(`  ❌ Failed to update profile: ${updateError.message}`)
          } else {
            console.log(`  ✅ Profile updated successfully`)
          }
        } else if (profile) {
          console.log(`  ✅ Profile already correct (role: ${profile.role})`)
        } else {
          console.log(`  ❌ No profile found`)
        }
      } else {
        // Create new user
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
          email: userData.email,
          password: userData.password,
          email_confirm: true,
          user_metadata: {
            first_name: userData.firstName,
            last_name: userData.lastName
          }
        })
        
        if (createError) {
          console.log(`  ❌ Failed to create user: ${createError.message}`)
          continue
        }
        
        console.log(`  ✅ User created successfully`)
        
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            id: newUser.user.id,
            role: userData.expectedRole,
            first_name: userData.firstName,
            last_name: userData.lastName,
            company: userData.email.split('@')[1],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (profileError) {
          console.log(`  ❌ Failed to create profile: ${profileError.message}`)
          console.log(`  📋 Profile data:`, {
            id: newUser.user.id,
            role: userData.expectedRole,
            first_name: userData.firstName,
            last_name: userData.lastName,
            company: userData.email.split('@')[1]
          })
        } else {
          console.log(`  ✅ Profile created with role: ${userData.expectedRole}`)
        }
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`)
    }
    
    console.log('')
  }

  console.log('🎯 Test Users Summary:')
  console.log('- admin@clearcompany.com (password: testpassword123) → ADMIN role')
  console.log('- sarah.chen@clearcompany.com (password: testpassword123) → ANALYST role')
  console.log('- mike.johnson@clearcompany.com (password: testpassword123) → ANALYST role')
  console.log('- lisa.wang@clearcompany.com (password: testpassword123) → ANALYST role')
  console.log('- user@example.com (password: testpassword123) → EDITOR role')
  console.log('\n💡 You can now test login with these credentials!')
}

// Run the script
createTestUsers().catch(console.error) 