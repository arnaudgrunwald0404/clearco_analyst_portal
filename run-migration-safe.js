const postgres = require('postgres');
const fs = require('fs');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function runMigration() {
  try {
    const sqlContent = fs.readFileSync('supabase/migrations/20250803_cleanup_actionitem_v4.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    console.log('Executing migration...');
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const result = await sql.unsafe(statement.trim());
        console.log('Statement executed successfully');
      }
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
