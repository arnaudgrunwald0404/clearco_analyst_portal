const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function finalVerification() {
  try {
    console.log('🔍 Final verification of database consolidation...');
    
    // Check if old tables still exist
    const oldTables = ['action_items', 'general_settings', 'calendar_connections'];
    console.log('\n📋 Checking for old tables:');
    
    for (const table of oldTables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      console.log(`  ${table}: ${exists[0].exists ? '❌ Still exists' : '✅ Removed'}`);
    }
    
    // Check consolidated tables
    const consolidatedTables = ['ActionItem', 'GeneralSettings', 'CalendarConnection'];
    console.log('\n📋 Checking consolidated tables:');
    
    for (const table of consolidatedTables) {
      const exists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        );
      `;
      console.log(`  ${table}: ${exists[0].exists ? '✅ Exists' : '❌ Missing'}`);
    }
    
    // Check record counts
    console.log('\n📊 Record counts:');
    const actionItemCount = await sql`SELECT COUNT(*) as count FROM "ActionItem";`;
    console.log(`  ActionItem: ${actionItemCount[0].count} records`);
    
    const generalSettingsCount = await sql`SELECT COUNT(*) as count FROM "GeneralSettings";`;
    console.log(`  GeneralSettings: ${generalSettingsCount[0].count} records`);
    
    const calendarConnectionCount = await sql`SELECT COUNT(*) as count FROM "CalendarConnection";`;
    console.log(`  CalendarConnection: ${calendarConnectionCount[0].count} records`);
    
    // Check for any remaining snake_case columns in ActionItem
    console.log('\n🔍 Checking ActionItem column naming:');
    const actionItemColumns = await sql`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ActionItem'
      AND column_name LIKE '%_%'
      AND column_name NOT IN ('briefingId', 'assignedTo', 'assignedBy', 'dueDate', 'isCompleted', 'completedAt', 'completedBy', 'createdAt', 'updatedAt');
    `;
    
    if (actionItemColumns.length > 0) {
      console.log('⚠️  Remaining snake_case columns:');
      actionItemColumns.forEach(col => console.log(`  - ${col.column_name}`));
    } else {
      console.log('✅ All columns use consistent naming');
    }
    
    console.log('\n🎉 Database consolidation verification complete!');
    
  } catch (error) {
    console.error('Error during verification:', error);
  } finally {
    await sql.end();
  }
}

finalVerification();
