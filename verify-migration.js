const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function verifyMigration() {
  try {
    console.log('Verifying migration results...');
    
    // Check if action_items table still exists
    const actionItemsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'action_items'
      );
    `;
    console.log('action_items table exists:', actionItemsExists[0].exists);
    
    // Check ActionItem table structure
    const actionItemColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'ActionItem'
      ORDER BY ordinal_position;
    `;
    console.log('ActionItem table columns:');
    actionItemColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check record count
    const recordCount = await sql`SELECT COUNT(*) as count FROM "ActionItem";`;
    console.log('Total records in ActionItem:', recordCount[0].count);
    
    // Show sample data
    const sampleData = await sql`SELECT id, title, "actionStatus", "isCompleted" FROM "ActionItem" LIMIT 3;`;
    console.log('Sample data:');
    sampleData.forEach(row => {
      console.log(`  ID: ${row.id}, Title: ${row.title}, Status: ${row.actionStatus}, Completed: ${row.isCompleted}`);
    });
    
  } catch (error) {
    console.error('Error verifying migration:', error);
  } finally {
    await sql.end();
  }
}

verifyMigration();
