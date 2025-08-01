// Test Supabase connection and apply RLS policies
// Run with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js')

// You'll need to replace these with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // This is the service role key, not anon key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Make sure you have:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1)
    
    if (error) {
      console.error('Connection test failed:', error)
      return false
    }
    
    console.log('Connection successful!')
    return true
  } catch (error) {
    console.error('Connection test failed:', error)
    return false
  }
}

async function applyRLSPolicies() {
  try {
    console.log('Applying RLS policies...')
    
    const policies = [
      // Users can view own profile
      `CREATE POLICY "Users can view own profile" ON user_profiles
        FOR SELECT 
        USING (auth.uid() = id);`,
      
      // Users can insert own profile
      `CREATE POLICY "Users can insert own profile" ON user_profiles
        FOR INSERT 
        WITH CHECK (auth.uid() = id);`,
      
      // Users can update own profile
      `CREATE POLICY "Users can update own profile" ON user_profiles
        FOR UPDATE 
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);`,
      
      // Users can delete own profile
      `CREATE POLICY "Users can delete own profile" ON user_profiles
        FOR DELETE 
        USING (auth.uid() = id);`,
      
      // Admins can view all profiles
      `CREATE POLICY "Admins can view all profiles" ON user_profiles
        FOR SELECT 
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
          )
        );`,
      
      // Admins can update all profiles
      `CREATE POLICY "Admins can update all profiles" ON user_profiles
        FOR UPDATE 
        USING (
          EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'ADMIN'
          )
        );`
    ]
    
    for (const policy of policies) {
      const { error } = await supabase.rpc('exec_sql', { sql: policy })
      if (error) {
        console.error('Error applying policy:', error)
      } else {
        console.log('Policy applied successfully')
      }
    }
    
    console.log('All RLS policies applied!')
  } catch (error) {
    console.error('Error applying RLS policies:', error)
  }
}

async function main() {
  const connected = await testConnection()
  if (connected) {
    await applyRLSPolicies()
  }
}

main()
