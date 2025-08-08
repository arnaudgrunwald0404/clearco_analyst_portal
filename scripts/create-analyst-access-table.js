const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qimvwwfwakvgfvclqpue.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function createAnalystAccessTable() {
  console.log('🔧 Creating analyst_access table...\n')

  try {
    // Create the analyst_access table
    const { error: createError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS analyst_access (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          last_login TIMESTAMP WITH TIME ZONE,
          is_active BOOLEAN NOT NULL DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
        );
      `
    })

    if (createError) {
      console.error('❌ Error creating table:', createError)
      
      // Try direct SQL execution
      console.log('🔄 Trying direct SQL execution...')
      const { error: directError } = await supabase
        .from('analyst_access')
        .select('*')
        .limit(1)
      
      if (directError && directError.code === '42P01') {
        console.log('❌ Table does not exist and cannot be created via RPC')
        console.log('💡 Please create the table manually in Supabase dashboard:')
        console.log(`
          CREATE TABLE analyst_access (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            analyst_id UUID REFERENCES analysts(id) ON DELETE CASCADE UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            last_login TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN NOT NULL DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL
          );
        `)
        return
      }
    }

    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE analyst_access ENABLE ROW LEVEL SECURITY;'
    })

    if (rlsError) {
      console.log('⚠️  Could not enable RLS via RPC (this is okay)')
    }

    // Grant permissions
    const { error: grantError } = await supabase.rpc('exec_sql', {
      query: `
        GRANT ALL ON analyst_access TO postgres, anon, authenticated, service_role;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
      `
    })

    if (grantError) {
      console.log('⚠️  Could not grant permissions via RPC (this is okay)')
    }

    // Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      query: `
        CREATE INDEX IF NOT EXISTS idx_analyst_access_analyst_id ON analyst_access(analyst_id);
        CREATE INDEX IF NOT EXISTS idx_analyst_access_is_active ON analyst_access(is_active);
        CREATE INDEX IF NOT EXISTS idx_analyst_access_last_login ON analyst_access(last_login);
      `
    })

    if (indexError) {
      console.log('⚠️  Could not create indexes via RPC (this is okay)')
    }

    console.log('✅ analyst_access table setup completed!')
    console.log('\n📋 Next steps:')
    console.log('1. Run: node scripts/setup-analyst-access.js')
    console.log('2. Test login at: /analyst-login')
    console.log('3. Manage access at: /analyst-access')

  } catch (error) {
    console.error('❌ Error setting up analyst_access table:', error)
  }
}

// Run the setup
createAnalystAccessTable()
  .then(() => {
    console.log('\n✅ Table creation script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Table creation script failed:', error)
    process.exit(1)
  }) 