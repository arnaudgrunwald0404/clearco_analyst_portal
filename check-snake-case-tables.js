const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function checkSnakeCaseTables() {
  try {
    console.log('Checking for snake_case tables that should be converted...');
    
    // Get all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    // Filter for snake_case tables (excluding system tables)
    const snakeCaseTables = tables
      .map(t => t.table_name)
      .filter(name => 
        name.includes('_') && 
        !name.startsWith('_') && 
        name !== '_prisma_migrations'
      );
    
    if (snakeCaseTables.length > 0) {
      console.log('\n🐍 Found snake_case tables:');
      snakeCaseTables.forEach(table => {
        console.log(`  - ${table}`);
      });
      
      console.log('\n💡 These tables should be converted to PascalCase for consistency.');
      console.log('   However, since they don\'t have duplicates, we can leave them as-is');
      console.log('   or convert them if needed for the application.');
    } else {
      console.log('\n✅ No snake_case tables found!');
    }
    
    // Check for any other potential issues
    console.log('\n🔍 Checking for other potential database issues...');
    
    // Check for tables with mixed naming conventions
    const allTables = tables.map(t => t.table_name);
    const pascalCaseTables = allTables.filter(name => 
      name.match(/^[A-Z]/) && !name.includes('_')
    );
    
    console.log(`\n📊 Database Summary:`);
    console.log(`  Total tables: ${allTables.length}`);
    console.log(`  PascalCase tables: ${pascalCaseTables.length}`);
    console.log(`  Snake_case tables: ${snakeCaseTables.length}`);
    console.log(`  System tables: ${allTables.length - pascalCaseTables.length - snakeCaseTables.length}`);
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await sql.end();
  }
}

checkSnakeCaseTables();
