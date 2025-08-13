require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

async function checkTestimonialsStructure() {
  console.log('🔍 Checking testimonials table structure...')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Try to get table info
    console.log('🔍 Attempting to get table structure...')
    
    // Try a simple select to see what columns exist
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ Error accessing testimonials table:', error.message)
      
      // Check if table exists at all
      const { data: tables, error: tablesError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .eq('table_name', 'testimonials')
      
      if (tablesError) {
        console.error('❌ Error checking if table exists:', tablesError)
      } else if (tables && tables.length > 0) {
        console.log('✅ Testimonials table exists')
        
        // Try to get column information
        const { data: columns, error: columnsError } = await supabase
          .from('information_schema.columns')
          .select('column_name, data_type, is_nullable, column_default')
          .eq('table_schema', 'public')
          .eq('table_name', 'testimonials')
          .order('ordinal_position')
        
        if (columnsError) {
          console.error('❌ Error getting column info:', columnsError)
        } else {
          console.log('📊 Current table structure:')
          columns.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${col.column_default ? `default: ${col.column_default}` : ''}`)
          })
        }
      } else {
        console.log('❌ Testimonials table does not exist')
      }
    } else {
      console.log('✅ Testimonials table is accessible')
      console.log('📊 Sample data structure:', Object.keys(data[0] || {}))
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

if (require.main === module) {
  checkTestimonialsStructure()
    .then(() => {
      console.log('🏁 Script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Script failed:', error)
      process.exit(1)
    })
}

module.exports = { checkTestimonialsStructure }
