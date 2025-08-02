const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error(`NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓ Present' : '❌ Missing'}`);
  console.error(`SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✓ Present' : '❌ Missing'}`);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(filePath) {
  try {
    console.log(`📄 Reading SQL file: ${filePath}`);
    const sql = await fs.readFile(filePath, 'utf8');
    
    console.log('🔄 Executing SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      throw error;
    }
    
    console.log('✅ SQL executed successfully');
    console.log('📊 Result:', data);
    return data;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error);
    throw error;
  }
}

async function main() {
  try {
    // Execute backup
    console.log('📦 Creating database backup...');
    await executeSQL(path.join(__dirname, 'backup-before-consolidation.sql'));
    
    // Execute consolidation
    console.log('🔄 Running table consolidation...');
    await executeSQL(path.join(__dirname, 'consolidate-tables.sql'));
    
    console.log('✅ Migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();