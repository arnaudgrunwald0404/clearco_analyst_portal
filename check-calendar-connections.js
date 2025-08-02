const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function checkCalendarConnections() {
  try {
    console.log('🔍 Checking calendar_connections table...');
    
    // Check if calendar_connections exists
    const exists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'calendar_connections'
      );
    `;
    
    if (exists[0].exists) {
      console.log('📋 calendar_connections table exists');
      
      // Check its structure
      const columns = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'calendar_connections'
        ORDER BY ordinal_position;
      `;
      
      console.log('📊 calendar_connections columns:');
      columns.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check record count
      const count = await sql`SELECT COUNT(*) as count FROM calendar_connections;`;
      console.log(`📊 Record count: ${count[0].count}`);
      
      // Check if CalendarConnection exists
      const calendarConnectionExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'CalendarConnection'
        );
      `;
      
      if (calendarConnectionExists[0].exists) {
        console.log('📋 CalendarConnection table also exists');
        
        // Check CalendarConnection structure
        const calendarConnectionColumns = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'CalendarConnection'
          ORDER BY ordinal_position;
        `;
        
        console.log('📊 CalendarConnection columns:');
        calendarConnectionColumns.forEach(col => {
          console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });
        
        const calendarConnectionCount = await sql`SELECT COUNT(*) as count FROM "CalendarConnection";`;
        console.log(`📊 CalendarConnection record count: ${calendarConnectionCount[0].count}`);
        
        // If both exist, we should consolidate them
        if (count[0].count > 0) {
          console.log('⚠️  Both tables exist with data. Need to consolidate.');
        } else {
          console.log('✅ calendar_connections is empty, safe to drop.');
        }
      }
    } else {
      console.log('✅ calendar_connections table does not exist');
    }
    
  } catch (error) {
    console.error('Error checking calendar_connections:', error);
  } finally {
    await sql.end();
  }
}

checkCalendarConnections();
