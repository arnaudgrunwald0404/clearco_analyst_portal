/**
 * Setup Demo Users Script
 * 
 * This script creates demo users in Supabase's auth system and their profiles.
 * Run this script to set up authentication for the analyst portal.
 * 
 * Usage: node scripts/setup-demo-users.js
 */

const { createClient } = require('@supabase/supabase-js')

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

console.log('🚀 Setting up demo users in Supabase...')

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDemoUsers() {
  try {
    console.log('👥 Creating demo users...')
    
    // Demo users to create
    const demoUsers = [
      {
        email: 'admin@clearcompany.com',
        password: 'password',
        profile: {
          role: 'ADMIN',
          first_name: 'Admin',
          last_name: 'User',
          company: 'ClearCompany'
        }
      },
      {
        email: 'sarah.chen@clearcompany.com',
        password: 'password',
        profile: {
          role: 'ANALYST',
          first_name: 'Sarah',
          last_name: 'Chen',
          company: 'ClearCompany'
        }
      }
    ]
    
    for (const userData of demoUsers) {
      console.log(`📧 Creating user: ${userData.email}`)
      
      // Create user in Supabase auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          first_name: userData.profile.first_name,
          last_name: userData.profile.last_name,
          company: userData.profile.company
        }
      })
      
      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  User ${userData.email} already exists, updating profile...`)
          
          // Get existing user
          const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
          if (listError) {
            console.error('Error listing users:', listError)
            continue
          }
          
          const existingUser = existingUsers.users.find(u => u.email === userData.email)
          if (!existingUser) {
            console.error(`Could not find existing user ${userData.email}`)
            continue
          }
          
          // Update or create profile
          await upsertUserProfile(existingUser.id, userData.profile)
        } else {
          console.error(`Error creating user ${userData.email}:`, authError)
          continue
        }
      } else if (authData.user) {
        console.log(`✅ Created auth user: ${userData.email}`)
        
        // Create user profile
        await upsertUserProfile(authData.user.id, userData.profile)
      }
    }
    
    console.log('🎉 Demo users setup completed successfully!')
    console.log('')
    console.log('🔐 Demo login credentials:')
    console.log('  Admin: admin@clearcompany.com / password')
    console.log('  Analyst: sarah.chen@clearcompany.com / password')
    console.log('')
    console.log('🏠 Admin users will be redirected to: /')
    console.log('📊 Analyst users will be redirected to: /portal')
    
    return true
    
  } catch (error) {
    console.error('❌ Error setting up demo users:', error)
    return false
  }
}

async function upsertUserProfile(userId, profileData) {
  try {
    const profile = {
      id: userId,
      role: profileData.role,
      first_name: profileData.first_name,
      last_name: profileData.last_name,
      company: profileData.company,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    // Try to update first, then insert if not exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    if (existingProfile) {
      // Update existing profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          role: profile.role,
          first_name: profile.first_name,
          last_name: profile.last_name,
          company: profile.company,
          updated_at: profile.updated_at
        })
        .eq('id', userId)
      
      if (updateError) {
        console.error(`Error updating profile for ${userId}:`, updateError)
      } else {
        console.log(`✅ Updated profile: ${profileData.first_name} ${profileData.last_name} (${profileData.role})`)
      }
    } else {
      // Insert new profile
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert(profile)
      
      if (insertError) {
        console.error(`Error creating profile for ${userId}:`, insertError)
      } else {
        console.log(`✅ Created profile: ${profileData.first_name} ${profileData.last_name} (${profileData.role})`)
      }
    }
  } catch (error) {
    console.error(`Error upserting profile for ${userId}:`, error)
  }
}

// Run the setup
setupDemoUsers()
  .then((success) => {
    if (success) {
      console.log('✅ Setup completed successfully')
      process.exit(0)
    } else {
      console.log('❌ Setup failed')
      process.exit(1)
    }
  })
  .catch((error) => {
    console.error('❌ Setup failed with error:', error)
    process.exit(1)
  }) 