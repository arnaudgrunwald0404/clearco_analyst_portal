const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

async function main() {
  console.log('🔄 Starting database migration...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // First, check if we can connect
    const { data: testData, error: testError } = await supabase
      .from('analysts')
      .select('count(*)');

    if (testError) {
      throw new Error(`Connection test failed: ${testError.message}`);
    }

    console.log('✅ Database connection successful');

    // Read and execute backup script
    console.log('📦 Creating backups...');
    const backupSQL = await fs.readFile(
      path.join(__dirname, 'backup-before-consolidation.sql'),
      'utf8'
    );
    const { data: backupData, error: backupError } = await supabase.rpc('exec_sql', {
      sql_query: backupSQL
    });

    if (backupError) {
      throw new Error(`Backup failed: ${backupError.message}`);
    }
    console.log('✅ Backups created successfully');

    // Read and execute consolidation script
    console.log('🔄 Running table consolidation...');
    const consolidateSQL = await fs.readFile(
      path.join(__dirname, 'consolidate-tables.sql'),
      'utf8'
    );
    const { data: consolidateData, error: consolidateError } = await supabase.rpc('exec_sql', {
      sql_query: consolidateSQL
    });

    if (consolidateError) {
      throw new Error(`Consolidation failed: ${consolidateError.message}`);
    }
    console.log('✅ Table consolidation completed successfully');

    // Verify the changes
    console.log('🔍 Verifying changes...');
    const verificationQueries = [
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analysts')",
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'analyst')",
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'settings')",
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_connections')"
    ];

    for (const query of verificationQueries) {
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query });
      if (error) {
        console.warn(`⚠️ Verification query failed: ${error.message}`);
      } else {
        console.log(`✓ ${query}: ${JSON.stringify(data)}`);
      }
    }

    console.log('✅ Migration completed successfully');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main();