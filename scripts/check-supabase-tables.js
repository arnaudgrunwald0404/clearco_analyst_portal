const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  try {
    console.log('🔍 Checking existing tables in Supabase...\n')

    // Try different table naming conventions
    const tablesToCheck = [
      // Expected snake_case (what our APIs use)
      'analysts',
      'social_posts', 
      'briefings',
      'briefing_analysts',
      'calendar_connections',
      'calendar_meetings',
      'action_items',
      'influence_tiers',
      'vendor_domains',
      
      // Legacy PascalCase (for reference only)
      'Publication',
      'ActionItem',
      'InfluenceTier',
      'GeneralSettings'
    ]

    const existingTables = []
    const missingTables = []

    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`)
          missingTables.push(tableName)
        } else {
          const count = data?.length || 0
          console.log(`✅ ${tableName}: exists (${count} rows)`)
          existingTables.push({ name: tableName, count })
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`)
        missingTables.push(tableName)
      }
    }

    console.log('\n📊 Summary:')
    console.log(`✅ Existing tables: ${existingTables.length}`)
    console.log(`❌ Missing tables: ${missingTables.length}`)

    if (existingTables.length > 0) {
      console.log('\n✅ Existing tables:')
      existingTables.forEach(table => {
        console.log(`   - ${table.name} (${table.count} rows)`)
      })
    }

    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:')
      missingTables.forEach(table => {
        console.log(`   - ${table}`)
      })
    }

    // Try to get the full schema
    console.log('\n🔍 Trying to get full table list from information_schema...')
    
    // This might not work due to permissions, but worth a try
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_schema_tables', {})
      .catch(() => null) // Ignore if RPC doesn't exist

    if (schemaData) {
      console.log('📋 All tables in schema:')
      schemaData.forEach(table => console.log(`   - ${table.table_name}`))
    } else {
      console.log('⚠️  Cannot access schema information (permissions/RPC not available)')
    }

  } catch (error) {
    console.error('❌ Error checking tables:', error.message)
  }
}

checkTables() 