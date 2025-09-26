require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function createMissingAnalysts() {
  try {
    console.log('🔧 Creating analyst records for authenticated users...\n');
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    
    // Define the missing users with their details
    const missingUsers = [
      {
        email: 'sarah.chen@clearcompany.com',
        firstName: 'Sarah',
        lastName: 'Chen',
        company: 'ClearCompany',
        title: 'Senior Analyst',
        status: 'ACTIVE',
        influence: 'HIGH'
      },
      {
        email: 'admin@clearcompany.com',
        firstName: 'Admin',
        lastName: 'User',
        company: 'ClearCompany',
        title: 'Administrator',
        status: 'ACTIVE',
        influence: 'HIGH'
      },
      {
        email: 'agrunwald@clearcompany.com',
        firstName: 'Arnaud',
        lastName: 'Grunwald',
        company: 'ClearCompany',
        title: 'Product Manager',
        status: 'ACTIVE',
        influence: 'HIGH'
      },
      {
        email: 'testuser@clearcompany.com',
        firstName: 'Test',
        lastName: 'User',
        company: 'ClearCompany',
        title: 'Test Analyst',
        status: 'ACTIVE',
        influence: 'MEDIUM'
      },
      {
        email: 'lisa.wang@clearcompany.com',
        firstName: 'Lisa',
        lastName: 'Wang',
        company: 'ClearCompany',
        title: 'Research Analyst',
        status: 'ACTIVE',
        influence: 'MEDIUM'
      }
    ];
    
    console.log(`Creating ${missingUsers.length} analyst records...\n`);
    
    for (const user of missingUsers) {
      console.log(`Creating analyst: ${user.email}`);
      
      const { data, error } = await supabase
        .from('analysts')
        .insert({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          company: user.company,
          title: user.title,
          status: user.status,
          influence: user.influence,
          bio: `${user.title} at ${user.company}`,
          notes: 'Created automatically for portal access'
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error creating ${user.email}:`, error.message);
      } else {
        console.log(`✅ Created analyst: ${data.firstName} ${data.lastName} (ID: ${data.id})`);
      }
    }
    
    console.log('\n🎉 Analyst creation complete!');
    console.log('You should now be able to access /portal/roadmap without the 404 error.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createMissingAnalysts();



