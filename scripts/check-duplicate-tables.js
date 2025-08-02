const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all tables and their columns
    const { data: tables, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        SELECT 
            table_name,
            string_agg(column_name || ' ' || data_type, ', ' ORDER BY ordinal_position) as columns
        FROM information_schema.columns 
        WHERE table_schema = 'public'
            AND table_name NOT LIKE '_prisma%'
            AND table_name NOT LIKE 'pg_%'
        GROUP BY table_name
        ORDER BY table_name;
      `
    });

    if (error) {
      throw error;
    }

    console.log('📊 Current Tables:');
    console.log(JSON.stringify(tables, null, 2));

    // Check for potential duplicates (similar names)
    const tableGroups = {};
    tables.forEach(table => {
      const baseName = table.table_name.toLowerCase()
        .replace(/s$/, '')  // Remove trailing 's'
        .replace(/[^a-z0-9]/g, '');  // Remove special chars
      
      if (!tableGroups[baseName]) {
        tableGroups[baseName] = [];
      }
      tableGroups[baseName].push(table);
    });

    console.log('\n🔍 Potential Duplicate Tables:');
    Object.entries(tableGroups)
      .filter(([_, group]) => group.length > 1)
      .forEach(([base, group]) => {
        console.log(`\n${base}:`);
        group.forEach(table => {
          console.log(`  - ${table.table_name}`);
          console.log(`    Columns: ${table.columns}`);
        });
      });

    // Check for inconsistent naming conventions
    console.log('\n⚠️ Inconsistent Naming Conventions:');
    tables.forEach(table => {
      const name = table.table_name;
      if (name.match(/[A-Z]/)) {
        console.log(`  - ${name} (uses PascalCase, should be snake_case)`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();