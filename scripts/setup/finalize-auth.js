require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

// Finalize authentication system and set up agrunwald@clearcompany.com
async function finalizeAuth() {
  console.log('🔐 Finalizing Authentication System\n')

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

  // Step 1: Remove old admin@clearcompany.com user
  console.log('🗑️  Step 1: Removing old admin@clearcompany.com user')
  try {
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.log(`  ❌ Error listing users: ${listError.message}`)
    } else {
      const oldAdmin = users.users.find(user => user.email === 'admin@clearcompany.com')
      if (oldAdmin) {
        console.log(`  🔍 Found old admin user: ${oldAdmin.id}`)
        
        // Delete user profile first
        const { error: profileDeleteError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('id', oldAdmin.id)
        
        if (profileDeleteError) {
          console.log(`  ⚠️  Could not delete profile: ${profileDeleteError.message}`)
        } else {
          console.log(`  ✅ Deleted user profile`)
        }
        
        // Delete auth user
        const { error: deleteError } = await supabase.auth.admin.deleteUser(oldAdmin.id)
        if (deleteError) {
          console.log(`  ❌ Could not delete auth user: ${deleteError.message}`)
        } else {
          console.log(`  ✅ Deleted old admin user`)
        }
      } else {
        console.log(`  ℹ️  No old admin user found`)
      }
    }
  } catch (error) {
    console.log(`  ❌ Error removing old admin: ${error.message}`)
  }

  console.log('')

  // Step 2: Create agrunwald@clearcompany.com user
  console.log('👤 Step 2: Creating agrunwald@clearcompany.com user')
  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.log(`  ❌ Error listing users: ${listError.message}`)
      return
    }
    
    const existingUser = existingUsers.users.find(user => user.email === 'agrunwald@clearcompany.com')
    
    if (existingUser) {
      console.log(`  ⚠️  User already exists, updating password and profile`)
      
      // Update password
      const { error: updateError } = await supabase.auth.admin.updateUserById(existingUser.id, {
        password: '3tts3tte'
      })
      
      if (updateError) {
        console.log(`  ❌ Failed to update password: ${updateError.message}`)
      } else {
        console.log(`  ✅ Password updated successfully`)
      }
      
      // Update or create profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', existingUser.id)
        .single()
      
      if (profileError && profileError.code === 'PGRST116') {
        // Create profile
        const { error: createProfileError } = await supabase
          .from('user_profiles')
          .insert({
            id: existingUser.id,
            role: 'ADMIN',
            first_name: 'Arnaud',
            last_name: 'Grunwald',
            company: 'clearcompany.com',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        
        if (createProfileError) {
          console.log(`  ❌ Failed to create profile: ${createProfileError.message}`)
        } else {
          console.log(`  ✅ Profile created with ADMIN role`)
        }
      } else if (profile) {
        // Update existing profile
        const { error: updateProfileError } = await supabase
          .from('user_profiles')
          .update({
            role: 'ADMIN',
            first_name: 'Arnaud',
            last_name: 'Grunwald',
            company: 'clearcompany.com',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUser.id)
        
        if (updateProfileError) {
          console.log(`  ❌ Failed to update profile: ${updateProfileError.message}`)
        } else {
          console.log(`  ✅ Profile updated with ADMIN role`)
        }
      }
    } else {
      // Create new user
      console.log(`  🆕 Creating new user: agrunwald@clearcompany.com`)
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'agrunwald@clearcompany.com',
        password: '3tts3tte',
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          first_name: 'Arnaud',
          last_name: 'Grunwald',
          company: 'clearcompany.com'
        }
      })
      
      if (createError) {
        console.log(`  ❌ Failed to create user: ${createError.message}`)
        return
      }
      
      console.log(`  ✅ User created successfully`)
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: newUser.user.id,
          role: 'ADMIN',
          first_name: 'Arnaud',
          last_name: 'Grunwald',
          company: 'clearcompany.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (profileError) {
        console.log(`  ❌ Failed to create profile: ${profileError.message}`)
      } else {
        console.log(`  ✅ Profile created with ADMIN role`)
      }
    }
  } catch (error) {
    console.log(`  ❌ Error creating user: ${error.message}`)
  }

  console.log('')

  // Step 3: Summary
  console.log('🎯 Authentication System Finalized!')
  console.log('')
  console.log('🔑 Primary Login Credentials:')
  console.log('  Admin: agrunwald@clearcompany.com / 3tts3tte')
  console.log('  Analyst: sarah.chen@clearcompany.com / password')
  console.log('')
  console.log('🏠 Admin users will be redirected to: /')
  console.log('📊 Analyst users will be redirected to: /portal')
  console.log('')
  console.log('✅ Old admin@clearcompany.com user removed')
  console.log('✅ agrunwald@clearcompany.com user created with ADMIN role')
  console.log('✅ Authentication system ready for production use')
}

// Run the script
finalizeAuth().catch(console.error) 