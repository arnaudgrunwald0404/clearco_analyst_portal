const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://qimvwwfwakvgfvclqpue.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg';

async function main() {
  console.log('🔍 Listing tables...');
  
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false }
  });

  try {
    // Try to query some known tables
    const tables = [
      'analysts',
      'analyst_access',
      'general_settings',
      'calendar_connections',
      'calendar_meetings',
      'briefings',
      'briefing_analysts',
      'publications',
      'action_items',
      'social_posts',
      'user_profiles',
      'AnalystPortalSession'
    ];

    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.code === 'PGRST204') {
          console.log(`✅ ${table}: exists (empty)`);
        } else {
          console.log(`❌ ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: exists (${data.length} records)`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();