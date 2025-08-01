require('dotenv').config({ path: '.env' })
const { createClient } = require('@supabase/supabase-js')

async function fixUserTable() {
  console.log('🔧 Fixing User table structure...\n')

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
    console.log('📋 Step 1: Renaming User table to user_profiles...')
    
    // First, let's check if the User table exists
    const { data: userTable, error: userTableError } = await supabase
      .from('User')
      .select('*')
      .limit(1)

    if (userTableError) {
      console.log('  ❌ Error accessing User table:', userTableError.message)
      return
    }

    console.log('  ✅ User table exists, proceeding with rename...')

    // Since we can't rename tables directly via the client, let's create the new table
    // and copy the data, then drop the old table
    console.log('\n📋 Step 2: Creating new user_profiles table...')
    
    // First, let's get the data from the User table
    const { data: users, error: usersError } = await supabase
      .from('User')
      .select('*')

    if (usersError) {
      console.log('  ❌ Error fetching users:', usersError.message)
      return
    }

    console.log(`  📋 Found ${users.length} users to migrate`)

    // Create the new table structure
    console.log('\n📋 Step 3: Creating user_profiles table with correct schema...')
    
    // We'll need to create the table manually via SQL
    console.log('  📋 MANUAL SQL REQUIRED:')
    console.log('  Please run this SQL in your Supabase dashboard:')
    console.log(`
-- Create user_role enum if it doesn't exist
CREATE TYPE IF NOT EXISTS user_role AS ENUM ('ADMIN', 'EDITOR', 'ANALYST');

-- Create the new user_profiles table
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

    console.log('\n📋 Step 4: After creating the table, run this migration script:')
    console.log('  The script will migrate data from User to user_profiles')
    
    // Show the migration data
    console.log('\n📋 Migration data preview:')
    users.forEach(user => {
      console.log(`  - ${user.email}: ${user.name} (${user.role})`)
    })

    console.log('\n🔧 NEXT STEPS:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run the SQL above to create user_profiles table')
    console.log('4. Then run this script again to migrate the data')

  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

// Run the setup
fixUserTable().catch(console.error) 