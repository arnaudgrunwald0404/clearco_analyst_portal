const postgres = require('postgres');

const sql = postgres('postgres://postgres:3tts3ttEasdfg@db.qimvwwfwakvgfvclqpue.supabase.co:6543/postgres', {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10
});

async function checkDuplicateTables() {
  try {
    console.log('Checking for duplicate tables...');
    
    // Get all tables
    const tables = await sql`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    console.log('All tables in database:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Look for potential duplicates (snake_case vs PascalCase)
    const tableNames = tables.map(t => t.table_name);
    const potentialDuplicates = [];
    
    for (const table of tableNames) {
      // Check for snake_case version
      if (table.includes('_')) {
        const pascalCase = table.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
        
        if (tableNames.includes(pascalCase)) {
          potentialDuplicates.push({
            snake_case: table,
            pascal_case: pascalCase
          });
        }
      }
      
      // Check for PascalCase version
      if (table.match(/^[A-Z]/)) {
        const snakeCase = table.replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, '');
        
        if (tableNames.includes(snakeCase)) {
          potentialDuplicates.push({
            snake_case: snakeCase,
            pascal_case: table
          });
        }
      }
    }
    
    // Remove duplicates
    const uniqueDuplicates = potentialDuplicates.filter((item, index, self) => 
      index === self.findIndex(t => 
        (t.snake_case === item.snake_case && t.pascal_case === item.pascal_case) ||
        (t.snake_case === item.pascal_case && t.pascal_case === item.snake_case)
      )
    );
    
    if (uniqueDuplicates.length > 0) {
      console.log('\n🎯 Found duplicate tables:');
      uniqueDuplicates.forEach(dup => {
        console.log(`  ${dup.snake_case} ↔ ${dup.pascal_case}`);
      });
    } else {
      console.log('\n✅ No duplicate tables found!');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error);
  } finally {
    await sql.end();
  }
}

checkDuplicateTables();
