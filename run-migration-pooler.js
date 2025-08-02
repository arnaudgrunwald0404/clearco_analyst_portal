const postgres = require('postgres');
const fs = require('fs');

const sql = postgres('postgresql://postgres.qimvwwfwakvgfvclqpue:3tts3ttE!3tts3ttE@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&pool_mode=transaction');

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
