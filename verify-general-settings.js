const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function verifyGeneralSettings() {
  try {
    console.log('Verifying general_settings consolidation...');
    
    // Check if general_settings table still exists
    const generalSettingsExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'general_settings'
      );
    `;
    console.log('general_settings table exists:', generalSettingsExists[0].exists);
    
    // Check GeneralSettings table structure
    const generalSettingsColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'GeneralSettings'
      ORDER BY ordinal_position;
    `;
    console.log('\nGeneralSettings table columns:');
    generalSettingsColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check record count
    const recordCount = await sql`SELECT COUNT(*) as count FROM "GeneralSettings";`;
    console.log('\nTotal records in GeneralSettings:', recordCount[0].count);
    
    // Show the consolidated data
    const sampleData = await sql`SELECT * FROM "GeneralSettings";`;
    console.log('\nConsolidated data:');
    sampleData.forEach(row => {
      console.log(`  ID: ${row.id}`);
      console.log(`  Company: ${row.companyName}`);
      console.log(`  Domain: ${row.protectedDomain}`);
      console.log(`  Logo: ${row.logoUrl}`);
      console.log(`  Industry: ${row.industryName}`);
      console.log(`  Created: ${row.createdAt}`);
      console.log(`  Updated: ${row.updatedAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error verifying consolidation:', error);
  } finally {
    await sql.end();
  }
}

verifyGeneralSettings();
