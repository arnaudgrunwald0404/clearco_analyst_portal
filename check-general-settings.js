const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function checkGeneralSettings() {
  try {
    console.log('Checking general_settings and GeneralSettings tables...');
    
    // Check general_settings table
    const snakeCaseColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'general_settings'
      ORDER BY ordinal_position;
    `;
    
    console.log('\ngeneral_settings table columns:');
    snakeCaseColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check GeneralSettings table
    const pascalCaseColumns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'GeneralSettings'
      ORDER BY ordinal_position;
    `;
    
    console.log('\nGeneralSettings table columns:');
    pascalCaseColumns.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check record counts
    const snakeCaseCount = await sql`SELECT COUNT(*) as count FROM general_settings;`;
    const pascalCaseCount = await sql`SELECT COUNT(*) as count FROM "GeneralSettings";`;
    
    console.log(`\nRecord counts:`);
    console.log(`  general_settings: ${snakeCaseCount[0].count}`);
    console.log(`  GeneralSettings: ${pascalCaseCount[0].count}`);
    
    // Show sample data from both tables
    const snakeCaseSample = await sql`SELECT * FROM general_settings LIMIT 2;`;
    const pascalCaseSample = await sql`SELECT * FROM "GeneralSettings" LIMIT 2;`;
    
    console.log('\nSample data from general_settings:');
    snakeCaseSample.forEach(row => {
      console.log(`  ${JSON.stringify(row)}`);
    });
    
    console.log('\nSample data from GeneralSettings:');
    pascalCaseSample.forEach(row => {
      console.log(`  ${JSON.stringify(row)}`);
    });
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await sql.end();
  }
}

checkGeneralSettings();
