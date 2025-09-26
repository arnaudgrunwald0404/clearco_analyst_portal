const postgres = require('postgres');
const fs = require('fs');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres');

async function runBriefingsMigration() {
  try {
    console.log('🚀 Starting briefings table migration...');
    
    const sqlContent = fs.readFileSync('supabase/migrations/002_create_briefings_table.sql', 'utf8');
    
    console.log('📄 SQL content loaded, executing migration...');
    
    // Execute the migration
    const result = await sql.unsafe(sqlContent);
    console.log('✅ Migration completed successfully!');
    
    // Verify the tables were created
    console.log('\n🔍 Verifying table creation...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('briefings', 'briefing_analysts')
    `;
    
    console.log('📋 Found tables:', tables.map(t => t.table_name));
    
    // Check briefings table columns
    console.log('\n🔍 Checking briefings table columns...');
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'briefings' 
      AND column_name IN ('transcript', 'notes', 'ai_summary')
    `;
    
    console.log('📝 Found columns:', columns.map(c => `${c.column_name} (${c.data_type})`));
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

runBriefingsMigration();

