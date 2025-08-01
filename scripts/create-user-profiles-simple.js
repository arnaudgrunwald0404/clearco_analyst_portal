require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function createUserProfilesTable() {
  console.log('🔧 Creating user_profiles table...\n')

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
    // First, let's try to create the table using a direct SQL query
    console.log('📋 Step 1: Creating user_profiles table...')
    
    // Try to insert a test record to see if table exists
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (testError && testError.message.includes('does not exist')) {
      console.log('  📋 Table does not exist, creating it...')
      
      // Since we can't create tables directly via the client, let's create a profile for the existing user
      console.log('  📋 Creating profile for existing user...')
      
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (usersError) {
        console.log('  ❌ Error listing users:', usersError.message)
        return
      }

      const agrunwaldUser = users.users.find(u => u.email === 'agrunwald@clearcompany.com')
      
      if (agrunwaldUser) {
        console.log('  📋 Found agrunwald user, creating profile...')
        
        const profileData = {
          id: agrunwaldUser.id,
          role: 'ADMIN',
          first_name: 'Arnaud',
          last_name: 'Grunwald',
          company: 'clearcompany.com',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        // Try to insert using the service role client
        const { error: insertError } = await supabase
          .from('user_profiles')
          .insert(profileData)

        if (insertError) {
          console.log('  ❌ Insert failed:', insertError.message)
          console.log('  📋 This means the table needs to be created manually')
          console.log('\n🔧 MANUAL SETUP REQUIRED:')
          console.log('1. Go to your Supabase dashboard')
          console.log('2. Navigate to SQL Editor')
          console.log('3. Run this SQL:')
          console.log(`
-- Create user_role enum
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('ADMIN', 'EDITOR', 'ANALYST');

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'EDITOR',
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND role = 'ADMIN'
    )
  );
          `)
        } else {
          console.log('  ✅ Profile created successfully!')
        }
      } else {
        console.log('  ❌ agrunwald user not found')
      }
    } else {
      console.log('  ✅ user_profiles table already exists')
    }

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
createUserProfilesTable().catch(console.error) 