const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qimvwwfwakvgfvclqpue.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpbXZ3d2Z3YWt2Z2Z2Y2xxcHVlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTAwNDk4NiwiZXhwIjoyMDY2NTgwOTg2fQ.oAecaBcP5Bbkyl8ObKXugnvcCzqUWfVjry4cRAr_kNg'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function setupAnalystAccess() {
  console.log('🔐 Setting up analyst portal access credentials...\n')

  try {
    // Get all analysts
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, email, company')
      .limit(5) // Limit to first 5 analysts for testing

    if (analystsError) {
      console.error('❌ Error fetching analysts:', analystsError)
      return
    }

    if (!analysts || analysts.length === 0) {
      console.log('⚠️  No analysts found. Please add some analysts first.')
      return
    }

    console.log(`📋 Found ${analysts.length} analysts to set up access for:\n`)

    // Set up access for each analyst
    for (const analyst of analysts) {
      console.log(`🔧 Setting up access for ${analyst.firstName} ${analyst.lastName} (${analyst.email})`)

      // Check if access already exists
      const { data: existingAccess } = await supabase
        .from('analyst_access')
        .select('id')
        .eq('analyst_id', analyst.id)
        .single()

      if (existingAccess) {
        console.log(`   ⏭️  Access already exists, skipping...`)
        continue
      }

      // Create password (use email domain as base for easy testing)
      const domain = analyst.email.split('@')[1]
      const password = `Welcome${domain.charAt(0).toUpperCase() + domain.slice(1)}2024!`
      
      // Hash the password
      const saltRounds = 12
      const passwordHash = await bcrypt.hash(password, saltRounds)

      // Create analyst access
      const { data: access, error: accessError } = await supabase
        .from('analyst_access')
        .insert({
          analyst_id: analyst.id,
          password_hash: passwordHash,
          is_active: true
        })
        .select()
        .single()

      if (accessError) {
        console.error(`   ❌ Error creating access:`, accessError)
        continue
      }

      console.log(`   ✅ Access created successfully`)
      console.log(`   📧 Email: ${analyst.email}`)
      console.log(`   🔑 Password: ${password}`)
      console.log(`   🌐 Login URL: /analyst-login`)
      console.log('')
    }

    console.log('🎉 Analyst access setup completed!')
    console.log('\n📋 Summary:')
    console.log('- Analysts can now log in at /analyst-login')
    console.log('- Use their email and the generated password')
    console.log('- Passwords are securely hashed in the database')
    console.log('- Access can be managed at /analyst-access')

  } catch (error) {
    console.error('❌ Error setting up analyst access:', error)
  }
}

// Run the setup
setupAnalystAccess()
  .then(() => {
    console.log('\n✅ Setup script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Setup script failed:', error)
    process.exit(1)
  }) 