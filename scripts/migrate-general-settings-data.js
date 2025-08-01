const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple CUID-like ID generator
function generateId() {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

async function setupGeneralSettings() {
  try {
    console.log('🔄 Setting up general settings...\n')

    // Check what's in the GeneralSettings table
    console.log('🔍 Checking GeneralSettings table...')
    const { data: currentSettings, error: checkError } = await supabase
      .from('GeneralSettings')
      .select('*')

    if (checkError) {
      console.error('❌ Error accessing GeneralSettings table:', checkError)
      throw new Error('Cannot access GeneralSettings table')
    }

    console.log(`✅ GeneralSettings table exists with ${currentSettings?.length || 0} records`)
    
    if (currentSettings && currentSettings.length > 0) {
      console.log('Current GeneralSettings data:')
      currentSettings.forEach((setting, index) => {
        console.log(`   ${index + 1}. Company: ${setting.companyName || 'Not set'}`)
        console.log(`      Domain: ${setting.protectedDomain || 'Not set'}`)
        console.log(`      Industry: ${setting.industryName || 'Not set'}`)
        console.log(`      Logo: ${setting.logoUrl || 'Not set'}`)
        console.log('')
      })
      
      console.log('ℹ️  GeneralSettings table already has data, no setup needed')
      return
    }

    // Create default settings if none exist
    console.log('\n🆕 Creating default general settings...')
    
    const defaultData = {
      id: generateId(),
      companyName: 'ClearCompany',
      protectedDomain: 'clearcompany.com',
      logoUrl: '/clearco-logo.png',
      industryName: 'HR Technology'
    }

    const { data: defaultSettings, error: defaultError } = await supabase
      .from('GeneralSettings')
      .insert(defaultData)
      .select()
      .single()

    if (defaultError) {
      console.error('❌ Error creating default settings:', defaultError)
      throw new Error('Failed to create default settings')
    }

    console.log('✅ Created default general settings:')
    console.log(`   Company: ${defaultSettings.companyName}`)
    console.log(`   Domain: ${defaultSettings.protectedDomain}`)
    console.log(`   Industry: ${defaultSettings.industryName}`)
    console.log(`   Logo: ${defaultSettings.logoUrl}`)

    console.log('\n🎉 General settings setup completed successfully!')

  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

// Run the setup
setupGeneralSettings() 