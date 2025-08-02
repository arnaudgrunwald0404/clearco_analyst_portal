const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function dropCalendarConnections() {
  try {
    console.log('🗑️  Dropping empty calendar_connections table...');
    
    await sql`DROP TABLE IF EXISTS calendar_connections CASCADE;`;
    
    console.log('✅ calendar_connections table dropped successfully');
    
  } catch (error) {
    console.error('Error dropping table:', error);
  } finally {
    await sql.end();
  }
}

dropCalendarConnections();
