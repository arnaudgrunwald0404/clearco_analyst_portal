const postgres = require('postgres');
const fs = require('fs');

const sql = postgres('postgresql://postgres:3tts3ttE!3tts3ttE@db.qimvwwfwakvgfvclqpue.supabase.co:5432/postgres');

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
