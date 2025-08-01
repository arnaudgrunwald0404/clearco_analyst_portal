require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function disableRLSTemp() {
  console.log('🔧 Temporarily disabling RLS for testing...\n')

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
    // Try to disable RLS temporarily
    console.log('📋 Attempting to disable RLS...')
    
    // Since we can't modify RLS via the client, let's try to create a profile directly
    console.log('📋 Creating profile directly...')
    
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

    // Try to insert profile directly
    const profileData = {
      id: agrunwaldUser.id,
      role: 'ADMIN',
      first_name: 'Arnaud',
      last_name: 'Grunwald',
      company: 'clearcompany.com',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()

    if (insertError) {
      console.log('  ❌ Insert failed:', insertError.message)
      console.log('  📋 This suggests RLS is blocking the insert')
      console.log('\n🔧 MANUAL SQL REQUIRED:')
      console.log('Please run this SQL in your Supabase dashboard:')
      console.log(`
-- Temporarily disable RLS for testing
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Create profile for agrunwald@clearcompany.com
INSERT INTO user_profiles (id, role, first_name, last_name, company, created_at, updated_at)
VALUES (
  '${agrunwaldUser.id}',
  'ADMIN'::user_role,
  'Arnaud',
  'Grunwald',
  'clearcompany.com',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN'::user_role,
  first_name = 'Arnaud',
  last_name = 'Grunwald',
  company = 'clearcompany.com',
  updated_at = NOW();

-- Re-enable RLS after creating the profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
      `)
    } else {
      console.log('  ✅ Profile created successfully!')
      console.log('  📋 Profile data:', insertData)
    }

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
disableRLSTemp().catch(console.error) 