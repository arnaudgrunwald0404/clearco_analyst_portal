require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkUserAnalyst() {
  try {
    console.log('🔍 Checking user and analyst data...\n');
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ Missing Supabase environment variables');
      console.log('NEXT_PUBLIC_SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Get current auth users
    console.log('📋 Checking auth.users...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError);
      return;
    }
    
    console.log(`Found ${authUsers.users.length} auth users:`);
    authUsers.users.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.email} (ID: ${user.id})`);
    });
    
    console.log('\n📊 Checking analysts table...');
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, email, company, status')
      .order('email');
    
    if (analystsError) {
      console.error('❌ Error fetching analysts:', analystsError);
      return;
    }
    
    console.log(`Found ${analysts.length} analysts:`);
    analysts.forEach((analyst, i) => {
      console.log(`  ${i + 1}. ${analyst.email} - ${analyst.firstName} ${analyst.lastName} (${analyst.company || 'No company'}) [${analyst.status}]`);
    });
    
    console.log('\n🔗 Checking matches...');
    const authEmails = authUsers.users.map(u => u.email);
    const analystEmails = analysts.map(a => a.email);
    
    const matchingEmails = authEmails.filter(email => analystEmails.includes(email));
    const missingAnalysts = authEmails.filter(email => !analystEmails.includes(email));
    
    console.log(`✅ Matching emails: ${matchingEmails.length}`);
    matchingEmails.forEach(email => console.log(`  - ${email}`));
    
    console.log(`❌ Auth users missing analyst records: ${missingAnalysts.length}`);
    missingAnalysts.forEach(email => console.log(`  - ${email}`));
    
    if (missingAnalysts.length > 0) {
      console.log('\n💡 To fix the 404 error, you need to:');
      console.log('1. Create analyst records for these users, OR');
      console.log('2. Use a different authentication approach');
      console.log('\nWould you like me to create analyst records for these users?');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkUserAnalyst();









