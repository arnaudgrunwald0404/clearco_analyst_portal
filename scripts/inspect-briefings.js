require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function inspectBriefings() {
  try {
    console.log('🔍 Inspecting all briefings in the database...');
    
    const { data, error } = await supabase
      .from('briefings')
      .select('id, title, status, scheduledAt')
      .order('scheduledAt', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching briefings:', error);
      return;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} briefings:`);
      console.table(data);
    } else {
      console.log('📝 No briefings found in the database.');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

inspectBriefings();
