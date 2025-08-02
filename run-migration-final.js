const postgres = require('postgres');
const fs = require('fs');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres');

async function runMigration() {
  try {
    const sqlContent = fs.readFileSync('supabase/migrations/20250803_cleanup_actionitem_v4.sql', 'utf8');
    
    console.log('Executing migration...');
    const result = await sql.unsafe(sqlContent);
    console.log('Migration completed successfully:', result);
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
