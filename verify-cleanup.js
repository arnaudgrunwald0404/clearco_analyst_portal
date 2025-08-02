const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function verifyCleanup() {
  try {
    console.log('Verifying column cleanup...');
    
    // Check ActionItem table structure
    const actionItemColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ActionItem'
      ORDER BY ordinal_position;
    `;
    
    console.log('ActionItem table columns after cleanup:');
    actionItemColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check for any remaining snake_case columns
    const snakeCaseColumns = actionItemColumns.filter(col => 
      col.column_name.includes('_') && 
      col.column_name !== 'briefingId' && 
      col.column_name !== 'assignedTo' && 
      col.column_name !== 'assignedBy' && 
      col.column_name !== 'dueDate' && 
      col.column_name !== 'isCompleted' && 
      col.column_name !== 'completedAt' && 
      col.column_name !== 'completedBy' && 
      col.column_name !== 'createdAt' && 
      col.column_name !== 'updatedAt'
    );
    
    if (snakeCaseColumns.length > 0) {
      console.log('⚠️  Remaining snake_case columns:');
      snakeCaseColumns.forEach(col => console.log(`  - ${col.column_name}`));
    } else {
      console.log('✅ All snake_case columns have been cleaned up!');
    }
    
    // Check record count to ensure data is still intact
    const recordCount = await sql`SELECT COUNT(*) as count FROM "ActionItem";`;
    console.log('Total records in ActionItem:', recordCount[0].count);
    
  } catch (error) {
    console.error('Error verifying cleanup:', error);
  } finally {
    await sql.end();
  }
}

verifyCleanup();
