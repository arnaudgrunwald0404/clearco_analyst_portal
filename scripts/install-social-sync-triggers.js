const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qimvwwfwakvgfvclqpue.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function installSocialSyncTriggers() {
  console.log('🔧 Installing Social Handle Sync Triggers...\n')

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create-social-sync-triggers.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    console.log('📄 Reading trigger SQL file...')
    console.log('⚠️  Note: This script will show errors because Supabase client cannot execute')
    console.log('   complex PostgreSQL functions. Please run the SQL manually in Supabase dashboard.\n')

    console.log('📋 SQL to execute in Supabase dashboard:')
    console.log('=' .repeat(60))
    console.log(sql)
    console.log('=' .repeat(60))

    console.log('\n💡 Instructions:')
    console.log('1. Copy the SQL above')
    console.log('2. Go to your Supabase dashboard')
    console.log('3. Navigate to SQL Editor')
    console.log('4. Paste and run the SQL')
    console.log('5. Verify the trigger was created successfully')

    // Try to execute with Supabase client (will likely fail)
    console.log('\n🧪 Attempting to execute via Supabase client...')
    const { error } = await supabase.rpc('exec_sql', { query: sql }).catch(() => ({ error: { message: 'exec_sql function not available' } }))

    if (error) {
      console.log('❌ Expected error:', error.message)
      console.log('💡 Please run the SQL manually as instructed above.')
    } else {
      console.log('✅ Triggers installed successfully!')
    }

  } catch (error) {
    console.error('❌ Error installing triggers:', error)
  }
}

// Run the installation
installSocialSyncTriggers()
  .then(() => {
    console.log('\n✅ Installation process completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Installation failed:', error)
    process.exit(1)
  })