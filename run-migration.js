const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://qimvwwfwakvgfvclqpue.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    const sqlContent = fs.readFileSync('supabase/migrations/20250803_cleanup_actionitem_v4.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = sqlContent.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement.trim()
        });
        
        if (error) {
          console.error('Error:', error);
        } else {
          console.log('Success:', data);
        }
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

runMigration();
