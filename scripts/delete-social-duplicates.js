const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qimvwwfwakvgfvclqpue.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function deleteSocialDuplicates() {
  console.log('🗑️  Deleting duplicate social media tables...\n')

  const tablesToDelete = [
    { name: 'SocialPost', reason: 'Empty duplicate of social_posts' },
    { name: 'SocialHandle', reason: 'Empty duplicate table' }
  ]

  let emptyTables = []

  for (const table of tablesToDelete) {
    console.log(`🔍 Checking ${table.name}...`)
    
    try {
      // Check if table exists and count records
      const { count, error: countError } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.log(`❌ ${table.name}: ${countError.message}`)
        continue
      }

      console.log(`📊 ${table.name}: ${count || 0} records`)

      if (count === 0) {
        console.log(`✅ ${table.name} is empty - safe to delete`)
        emptyTables.push(table.name)
      } else {
        console.log(`⚠️  ${table.name}: Has ${count} records - skipping deletion`)
      }

    } catch (error) {
      console.log(`❌ ${table.name}: Error checking table - ${error.message}`)
    }
    
    console.log('')
  }

  console.log('✅ Social media table analysis completed')
  console.log('\n📋 Summary:')
  console.log('- social_posts: KEPT (has data)')
  
  if (emptyTables.length > 0) {
    console.log(`- Empty tables to delete: ${emptyTables.join(', ')}`)
    console.log('\n💡 Manual deletion required:')
    console.log('Please run these SQL commands in your Supabase dashboard:')
    console.log('')
    emptyTables.forEach(table => {
      console.log(`DROP TABLE IF EXISTS "${table}" CASCADE;`)
    })
  } else {
    console.log('- No empty tables found to delete')
  }
}

// Run the cleanup
deleteSocialDuplicates()
  .then(() => {
    console.log('\n✅ Analysis completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }) 