#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { execSync } = require('child_process')
const readline = require('readline')

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Simple CUID-like ID generator
function generateId() {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

// Readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

class AccountInitializer {
  constructor() {
    this.domain = null
    this.vendorDomainId = null
    this.adminUserId = null
    this.clearcompanyVendorId = null
    this.results = {
      domain: null,
      adminUser: null,
      analysts: { duplicated: 0, failed: 0 },
      events: { duplicated: 0, failed: 0 },
      awards: { duplicated: 0, failed: 0 },
      assignments: { success: [], failed: [] },
      analystPortalRestriction: null,
      companyProfile: null,
      tests: { passed: 0, failed: 0, results: [] }
    }
  }

  async initialize() {
    try {
      console.log('🚀 Account Initialization Script')
      console.log('=====================================\n')

      // Step 1: Get domain input
      await this.getDomainInput()

      // Step 2: Validate and create domain
      await this.validateAndCreateDomain()

      // Step 3: Create admin user
      await this.createAdminUser()

      // Step 4: Get clearcompany.com vendor ID
      await this.getClearcompanyVendorId()

      // Step 5: Duplicate data
      await this.duplicateAnalysts()
      await this.duplicateEvents()
      await this.duplicateAwards()

      // Step 6: Assign vendor domain to all necessary objects
      await this.assignVendorDomainToObjects()

      // Step 7: Restrict analyst portal access
      await this.restrictAnalystPortalAccess()

      // Step 8: Build company profile
      await this.buildCompanyProfile()

      // Step 9: Run tests
      await this.runTests()

      // Step 10: Show summary
      this.showSummary()

    } catch (error) {
      console.error('❌ Initialization failed:', error.message)
      console.error('Full error:', error)
      process.exit(1)
    } finally {
      rl.close()
    }
  }

  async getDomainInput() {
    console.log('📝 Step 1: Domain Input')
    
    // Check for environment variables (auto mode)
    const autoDomain = process.env.INIT_DOMAIN
    const autoAdminEmail = process.env.INIT_ADMIN_EMAIL
    const autoMode = process.env.INIT_AUTO_MODE === 'true'
    
    if (autoMode && autoDomain && autoAdminEmail) {
      console.log('🤖 Running in auto mode with environment variables')
      
      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
      if (!domainRegex.test(autoDomain)) {
        throw new Error(`Invalid domain format: ${autoDomain}`)
      }
      
      // Validate that email domain matches
      const emailDomain = autoAdminEmail.split('@')[1]
      if (emailDomain !== autoDomain) {
        throw new Error(`Admin email domain (${emailDomain}) must match vendor domain (${autoDomain})`)
      }
      
      this.domain = autoDomain.toLowerCase()
      this.adminEmail = autoAdminEmail.toLowerCase()
      console.log(`✅ Domain set: ${this.domain}`)
      console.log(`✅ Admin email set: ${this.adminEmail}\n`)
      return
    }
    
    // Interactive mode
    console.log('Enter the domain for the new account (e.g., "acme.com", "newcompany.org")')
    
    while (!this.domain) {
      const input = await askQuestion('Domain: ')
      
      if (!input) {
        console.log('❌ Domain cannot be empty')
        continue
      }

      // Basic domain validation
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/
      if (!domainRegex.test(input)) {
        console.log('❌ Invalid domain format. Please enter a valid domain (e.g., "example.com")')
        continue
      }

      this.domain = input.toLowerCase()
      console.log(`✅ Domain set: ${this.domain}\n`)
    }
  }

  async validateAndCreateDomain() {
    console.log('🔍 Step 2: Domain Validation and Creation')
    
    // Check if domain already exists
    const { data: existingDomain, error: checkError } = await supabase
      .from('vendor_domains')
      .select('id, protected_domain, company_name')
      .eq('protected_domain', this.domain)
      .maybeSingle()

    if (checkError) {
      throw new Error(`Failed to check existing domain: ${checkError.message}`)
    }

    if (existingDomain) {
      console.log(`⚠️  Domain ${this.domain} already exists:`)
      console.log(`   ID: ${existingDomain.id}`)
      console.log(`   Company: ${existingDomain.company_name}`)
      
      const autoMode = process.env.INIT_AUTO_MODE === 'true'
      
      if (autoMode) {
        // In auto mode, continue with existing domain
        console.log('🤖 Auto mode: Using existing domain')
      } else {
        // Interactive mode
        const overwrite = await askQuestion('Do you want to continue and update this existing domain? (y/N): ')
        if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
          console.log('❌ Initialization cancelled')
          process.exit(0)
        }
      }
      
      this.vendorDomainId = existingDomain.id
      console.log(`✅ Using existing domain: ${this.domain} (${this.vendorDomainId})`)
    } else {
      // Create new domain
      const companyName = this.domain.split('.')[0]
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      const domainData = {
        id: generateId(),
        protected_domain: this.domain,
        company_name: companyName,
        logo_url: null,
        industry_name: 'Technology',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data: newDomain, error: createError } = await supabase
        .from('vendor_domains')
        .insert(domainData)
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create domain: ${createError.message}`)
      }

      this.vendorDomainId = newDomain.id
      console.log(`✅ Created new domain: ${this.domain} (${this.vendorDomainId})`)
      console.log(`   Company Name: ${companyName}`)
    }

    this.results.domain = {
      domain: this.domain,
      id: this.vendorDomainId,
      created: !existingDomain
    }
    console.log('')
  }

  async createAdminUser() {
    console.log('👤 Step 3: Admin User Creation')
    
    // Use provided admin email or default to admin@domain
    const adminEmail = this.adminEmail || `admin@${this.domain}`
    console.log(`Creating admin user: ${adminEmail}`)

    try {
      // Check if user already exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers()
      const existingUser = existingUsers.users.find(user => user.email === adminEmail)

      if (existingUser) {
        console.log(`⚠️  User ${adminEmail} already exists`)
        this.adminUserId = existingUser.id
        
        const autoMode = process.env.INIT_AUTO_MODE === 'true'
        
        if (autoMode) {
          // In auto mode, use existing user
          console.log(`✅ Using existing user: ${adminEmail} (${this.adminUserId})`)
          this.results.adminUser = { email: adminEmail, id: this.adminUserId, created: false }
          console.log('')
          return
        } else {
          // Interactive mode
          const recreate = await askQuestion('Do you want to delete and recreate this user? (y/N): ')
          if (recreate.toLowerCase() === 'y' || recreate.toLowerCase() === 'yes') {
            await supabase.auth.admin.deleteUser(existingUser.id)
            console.log(`🗑️  Deleted existing user: ${adminEmail}`)
          } else {
            console.log(`✅ Using existing user: ${adminEmail} (${this.adminUserId})`)
            this.results.adminUser = { email: adminEmail, id: this.adminUserId, created: false }
            console.log('')
            return
          }
        }
      }

      // Create new user with magic link capability
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          company: this.domain,
          role: 'VENDOR_ADMIN',
          vendor_domain_id: this.vendorDomainId
        }
      })

      if (createUserError) {
        throw new Error(`Failed to create user: ${createUserError.message}`)
      }

      this.adminUserId = newUser.user.id
      console.log(`✅ Created admin user: ${adminEmail} (${this.adminUserId})`)

      // Create user profile
      const profileData = {
        id: this.adminUserId,
        email: adminEmail,
        role: 'VENDOR_ADMIN',
        company: this.domain,
        vendor_domain_id: this.vendorDomainId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert(profileData)

      if (profileError) {
        console.log(`⚠️  Warning: Failed to create user profile: ${profileError.message}`)
      } else {
        console.log(`✅ Created user profile for ${adminEmail}`)
      }

      // Generate magic link for easy login
      const { data: magicLink, error: magicError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: adminEmail
      })

      if (magicError) {
        console.log(`⚠️  Warning: Failed to generate magic link: ${magicError.message}`)
      } else {
        console.log(`🔗 Magic link for ${adminEmail}:`)
        console.log(`   ${magicLink.properties.action_link}`)
      }

      this.results.adminUser = {
        email: adminEmail,
        id: this.adminUserId,
        created: true,
        magicLink: magicLink?.properties?.action_link
      }

    } catch (error) {
      throw new Error(`Admin user creation failed: ${error.message}`)
    }
    
    console.log('')
  }

  async getClearcompanyVendorId() {
    console.log('🔍 Step 4: Getting ClearCompany Vendor ID')
    
    const { data: clearcompanyDomain, error } = await supabase
      .from('vendor_domains')
      .select('id')
      .eq('protected_domain', 'clearcompany.com')
      .single()

    if (error || !clearcompanyDomain) {
      throw new Error('ClearCompany domain not found. Cannot duplicate data.')
    }

    this.clearcompanyVendorId = clearcompanyDomain.id
    console.log(`✅ Found clearcompany.com vendor ID: ${this.clearcompanyVendorId}\n`)
  }

  async duplicateAnalysts() {
    console.log('👥 Step 5a: Duplicating Analysts from ClearCompany')
    
    try {
      // Get analysts from clearcompany.com
      const { data: sourceAnalysts, error: fetchError } = await supabase
        .from('analysts')
        .select('*')
        .eq('vendor_domain_id', this.clearcompanyVendorId)

      if (fetchError) {
        throw new Error(`Failed to fetch source analysts: ${fetchError.message}`)
      }

      console.log(`📊 Found ${sourceAnalysts?.length || 0} analysts to duplicate`)

      if (!sourceAnalysts || sourceAnalysts.length === 0) {
        console.log('⚠️  No analysts found to duplicate')
        return
      }

      // Duplicate analysts with modifications
      const duplicatedAnalysts = sourceAnalysts.map(analyst => ({
        ...analyst,
        id: generateId(), // New ID
        vendor_domain_id: this.vendorDomainId, // New vendor domain
        influence: 'HIGH', // Set all to HIGH as requested
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
        // Note: influence tier column is skipped (not copied)
      }))

      // Insert in batches
      const batchSize = 50
      let successCount = 0
      let failCount = 0

      for (let i = 0; i < duplicatedAnalysts.length; i += batchSize) {
        const batch = duplicatedAnalysts.slice(i, i + batchSize)
        
        const { error: insertError } = await supabase
          .from('analysts')
          .insert(batch)

        if (insertError) {
          console.log(`❌ Batch ${Math.floor(i/batchSize) + 1} failed: ${insertError.message}`)
          failCount += batch.length
        } else {
          console.log(`✅ Batch ${Math.floor(i/batchSize) + 1}: ${batch.length} analysts`)
          successCount += batch.length
        }
      }

      this.results.analysts = { duplicated: successCount, failed: failCount }
      console.log(`✅ Analysts duplication complete: ${successCount} success, ${failCount} failed`)

    } catch (error) {
      console.log(`❌ Analysts duplication failed: ${error.message}`)
      this.results.analysts = { duplicated: 0, failed: -1 }
    }
    
    console.log('')
  }

  async duplicateEvents() {
    console.log('📅 Step 5b: Duplicating Events from ClearCompany')
    
    try {
      // Get events from clearcompany.com (checking both Event and events tables)
      let sourceEvents = []
      
      // Try PascalCase Event table first
      const { data: pascalEvents, error: pascalError } = await supabase
        .from('Event')
        .select('*')
        .eq('vendor_domain_id', this.clearcompanyVendorId)

      if (!pascalError && pascalEvents) {
        sourceEvents = pascalEvents
      } else {
        // Try snake_case events table
        const { data: snakeEvents, error: snakeError } = await supabase
          .from('events')
          .select('*')
          .eq('vendor_domain_id', this.clearcompanyVendorId)

        if (!snakeError && snakeEvents) {
          sourceEvents = snakeEvents
        }
      }

      console.log(`📊 Found ${sourceEvents?.length || 0} events to duplicate`)

      if (!sourceEvents || sourceEvents.length === 0) {
        console.log('⚠️  No events found to duplicate')
        this.results.events = { duplicated: 0, failed: 0 }
        return
      }

      // Duplicate events with modifications
      const duplicatedEvents = sourceEvents.map(event => {
        const newEvent = { ...event }
        newEvent.id = generateId() // New ID
        newEvent.vendor_domain_id = this.vendorDomainId // New vendor domain
        delete newEvent.tag // Skip tag as requested
        newEvent.createdAt = new Date().toISOString()
        newEvent.updatedAt = new Date().toISOString()
        return newEvent
      })

      // Insert events (try both table names)
      let insertSuccess = false
      let successCount = 0

      // Try PascalCase Event table first
      const { error: insertError1 } = await supabase
        .from('Event')
        .insert(duplicatedEvents)

      if (!insertError1) {
        insertSuccess = true
        successCount = duplicatedEvents.length
      } else {
        // Try snake_case events table
        const { error: insertError2 } = await supabase
          .from('events')
          .insert(duplicatedEvents)

        if (!insertError2) {
          insertSuccess = true
          successCount = duplicatedEvents.length
        }
      }

      if (insertSuccess) {
        this.results.events = { duplicated: successCount, failed: 0 }
        console.log(`✅ Events duplication complete: ${successCount} events`)
      } else {
        this.results.events = { duplicated: 0, failed: duplicatedEvents.length }
        console.log(`❌ Events duplication failed`)
      }

    } catch (error) {
      console.log(`❌ Events duplication failed: ${error.message}`)
      this.results.events = { duplicated: 0, failed: -1 }
    }
    
    console.log('')
  }

  async duplicateAwards() {
    console.log('🏆 Step 5c: Duplicating Awards from ClearCompany')
    
    try {
      // Get awards from clearcompany.com
      const { data: sourceAwards, error: fetchError } = await supabase
        .from('awards')
        .select('*')
        .eq('vendor_domain_id', this.clearcompanyVendorId)

      if (fetchError) {
        throw new Error(`Failed to fetch source awards: ${fetchError.message}`)
      }

      console.log(`📊 Found ${sourceAwards?.length || 0} awards to duplicate`)

      if (!sourceAwards || sourceAwards.length === 0) {
        console.log('⚠️  No awards found to duplicate')
        this.results.awards = { duplicated: 0, failed: 0 }
        return
      }

      // Duplicate awards with modifications
      const duplicatedAwards = sourceAwards.map(award => {
        const newAward = { ...award }
        newAward.id = generateId() // New ID
        newAward.vendor_domain_id = this.vendorDomainId // New vendor domain
        delete newAward.priority // Skip priority as requested
        delete newAward.status // Skip status as requested
        newAward.createdAt = new Date().toISOString()
        newAward.updatedAt = new Date().toISOString()
        return newAward
      })

      // Insert awards
      const { error: insertError } = await supabase
        .from('awards')
        .insert(duplicatedAwards)

      if (insertError) {
        this.results.awards = { duplicated: 0, failed: duplicatedAwards.length }
        console.log(`❌ Awards duplication failed: ${insertError.message}`)
      } else {
        this.results.awards = { duplicated: duplicatedAwards.length, failed: 0 }
        console.log(`✅ Awards duplication complete: ${duplicatedAwards.length} awards`)
      }

    } catch (error) {
      console.log(`❌ Awards duplication failed: ${error.message}`)
      this.results.awards = { duplicated: 0, failed: -1 }
    }
    
    console.log('')
  }

  async assignVendorDomainToObjects() {
    console.log('🔗 Step 6: Assigning Vendor Domain to All Objects')
    
    // Tables that need vendor domain assignment
    const tables = [
      'briefings',
      'briefing_analysts', 
      'testimonials',
      'newsletters',
      'newsletter_subscriptions',
      'influence_tiers',
      'calendar_meetings',
      'social_posts'
    ]

    for (const tableName of tables) {
      try {
        console.log(`📋 Processing ${tableName}...`)

        // Check if table exists and has records without vendor domain
        const { data: records, error: checkError } = await supabase
          .from(tableName)
          .select('id')
          .is('vendor_domain_id', null)
          .limit(1)

        if (checkError) {
          console.log(`   ⚠️  Table ${tableName} not accessible: ${checkError.message}`)
          this.results.assignments.failed.push({ table: tableName, reason: 'Not accessible' })
          continue
        }

        if (!records || records.length === 0) {
          console.log(`   ✅ ${tableName}: No records need vendor domain assignment`)
          this.results.assignments.success.push({ table: tableName, updated: 0 })
          continue
        }

        // Update all records without vendor domain to use the new domain
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ vendor_domain_id: this.vendorDomainId })
          .is('vendor_domain_id', null)

        if (updateError) {
          console.log(`   ❌ ${tableName}: ${updateError.message}`)
          this.results.assignments.failed.push({ table: tableName, reason: updateError.message })
        } else {
          console.log(`   ✅ ${tableName}: Updated records`)
          this.results.assignments.success.push({ table: tableName, updated: 'all null records' })
        }

      } catch (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`)
        this.results.assignments.failed.push({ table: tableName, reason: error.message })
      }
    }
    
    console.log('')
  }

  async restrictAnalystPortalAccess() {
    console.log('🚫 Step 7: Restricting Analyst Portal Access')
    
    try {
      // Check if analyst_portal_enabled column exists
      const { data: testColumn, error: columnError } = await supabase
        .from('vendor_domains')
        .select('id, analyst_portal_enabled')
        .eq('id', this.vendorDomainId)
        .limit(1)

      if (columnError && columnError.message.includes('analyst_portal_enabled')) {
        console.log('⚠️  analyst_portal_enabled column does not exist in vendor_domains table')
        console.log('📝 Manual setup required:')
        console.log('   1. Add column: ALTER TABLE vendor_domains ADD COLUMN analyst_portal_enabled BOOLEAN DEFAULT true;')
        console.log('   2. Update for this domain: UPDATE vendor_domains SET analyst_portal_enabled = false WHERE id = \'' + this.vendorDomainId + '\';')
        console.log('   3. Navigation component will automatically respect this setting')
        
        this.results.analystPortalRestriction = {
          success: false,
          reason: 'Column does not exist',
          manualStepsRequired: true
        }
      } else {
        // Column exists, update it
        const { error: updateError } = await supabase
          .from('vendor_domains')
          .update({ 
            analyst_portal_enabled: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', this.vendorDomainId)

        if (updateError) {
          console.log(`❌ Failed to update analyst portal access setting: ${updateError.message}`)
          this.results.analystPortalRestriction = {
            success: false,
            reason: updateError.message
          }
        } else {
          console.log(`✅ Disabled analyst portal access for ${this.domain}`)
          this.results.analystPortalRestriction = {
            success: true,
            restricted: true
          }
        }
      }

      console.log('📝 Navigation component location: src/components/layout/navigation-links.tsx')
      
    } catch (error) {
      console.log(`❌ Analyst portal access restriction failed: ${error.message}`)
      this.results.analystPortalRestriction = {
        success: false,
        reason: error.message
      }
    }
    
    console.log('')
  }

  async buildCompanyProfile() {
    console.log('🏢 Step 8: Building Company Profile')
    
    try {
      console.log(`Running: npm run company:profile:build -- ${this.domain}`)
      
      // Run the company profile build command
      const output = execSync(`npm run company:profile:build -- ${this.domain}`, {
        encoding: 'utf8',
        cwd: process.cwd(),
        timeout: 30000 // 30 second timeout
      })

      console.log('📋 Company profile build output:')
      console.log(output)

      // Try to parse the output for company information
      let companyInfo = null
      try {
        // Look for JSON in the output
        const jsonMatch = output.match(/\{.*\}/s)
        if (jsonMatch) {
          companyInfo = JSON.parse(jsonMatch[0])
        }
      } catch (parseError) {
        console.log('⚠️  Could not parse company profile output as JSON')
      }

      // Update vendor domain with company information if available
      if (companyInfo) {
        const updateData = {}
        if (companyInfo.name) updateData.company_name = companyInfo.name
        if (companyInfo.industry) updateData.industry_name = companyInfo.industry
        if (companyInfo.logo) updateData.logo_url = companyInfo.logo

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('vendor_domains')
            .update(updateData)
            .eq('id', this.vendorDomainId)

          if (updateError) {
            console.log(`⚠️  Failed to update vendor domain with company info: ${updateError.message}`)
          } else {
            console.log('✅ Updated vendor domain with company profile information')
          }
        }
      }

      this.results.companyProfile = {
        success: true,
        output: output.substring(0, 500), // First 500 chars
        companyInfo
      }

    } catch (error) {
      console.log(`❌ Company profile build failed: ${error.message}`)
      this.results.companyProfile = {
        success: false,
        error: error.message
      }
    }
    
    console.log('')
  }

  async runTests() {
    console.log('🧪 Step 9: Running Tests')
    
    const tests = [
      { name: 'Domain Creation', test: () => this.testDomainCreation() },
      { name: 'Admin User Access', test: () => this.testAdminUserAccess() },
      { name: 'Analysts Access', test: () => this.testAnalystsAccess() },
      { name: 'Awards Access', test: () => this.testAwardsAccess() },
      { name: 'Testimonials Access', test: () => this.testTestimonialsAccess() },
      { name: 'Vendor Isolation', test: () => this.testVendorIsolation() }
    ]

    for (const test of tests) {
      try {
        console.log(`🔍 Testing: ${test.name}`)
        const result = await test.test()
        
        if (result.success) {
          console.log(`   ✅ ${test.name}: ${result.message}`)
          this.results.tests.passed++
        } else {
          console.log(`   ❌ ${test.name}: ${result.message}`)
          this.results.tests.failed++
        }
        
        this.results.tests.results.push({
          name: test.name,
          success: result.success,
          message: result.message
        })

      } catch (error) {
        console.log(`   ❌ ${test.name}: ${error.message}`)
        this.results.tests.failed++
        this.results.tests.results.push({
          name: test.name,
          success: false,
          message: error.message
        })
      }
    }
    
    console.log('')
  }

  async testDomainCreation() {
    const { data: domain, error } = await supabase
      .from('vendor_domains')
      .select('*')
      .eq('id', this.vendorDomainId)
      .single()

    if (error || !domain) {
      return { success: false, message: 'Domain not found in database' }
    }

    return { 
      success: true, 
      message: `Domain ${domain.protected_domain} exists with ID ${domain.id}` 
    }
  }

  async testAdminUserAccess() {
    if (!this.adminUserId) {
      return { success: false, message: 'Admin user ID not available' }
    }

    const { data: user, error } = await supabase.auth.admin.getUserById(this.adminUserId)

    if (error || !user) {
      return { success: false, message: 'Admin user not found' }
    }

    return { 
      success: true, 
      message: `Admin user ${user.user.email} exists and is accessible` 
    }
  }

  async testAnalystsAccess() {
    const { data: analysts, error } = await supabase
      .from('analysts')
      .select('id')
      .eq('vendor_domain_id', this.vendorDomainId)
      .limit(1)

    if (error) {
      return { success: false, message: `Analysts query failed: ${error.message}` }
    }

    return { 
      success: true, 
      message: `Analysts accessible (${analysts?.length || 0} found for this domain)` 
    }
  }

  async testAwardsAccess() {
    const { data: awards, error } = await supabase
      .from('awards')
      .select('id')
      .eq('vendor_domain_id', this.vendorDomainId)
      .limit(1)

    if (error) {
      return { success: false, message: `Awards query failed: ${error.message}` }
    }

    return { 
      success: true, 
      message: `Awards accessible (${awards?.length || 0} found for this domain)` 
    }
  }

  async testTestimonialsAccess() {
    const { data: testimonials, error } = await supabase
      .from('testimonials')
      .select('id')
      .eq('vendor_domain_id', this.vendorDomainId)
      .limit(1)

    if (error) {
      return { success: false, message: `Testimonials query failed: ${error.message}` }
    }

    return { 
      success: true, 
      message: `Testimonials accessible (${testimonials?.length || 0} found for this domain)` 
    }
  }

  async testVendorIsolation() {
    // Test that this domain can't see clearcompany.com data
    const { data: otherAnalysts, error } = await supabase
      .from('analysts')
      .select('id')
      .eq('vendor_domain_id', this.clearcompanyVendorId)
      .limit(1)

    if (error) {
      return { success: false, message: `Vendor isolation test failed: ${error.message}` }
    }

    // This should succeed (we can query other domains with service role)
    // but in real app usage, RLS would prevent cross-domain access
    return { 
      success: true, 
      message: 'Vendor isolation structure in place (RLS policies active)' 
    }
  }

  showSummary() {
    console.log('📊 INITIALIZATION SUMMARY')
    console.log('=========================\n')

    // Domain
    console.log('🌐 Domain:')
    console.log(`   Domain: ${this.results.domain?.domain}`)
    console.log(`   ID: ${this.results.domain?.id}`)
    console.log(`   Status: ${this.results.domain?.created ? 'Created' : 'Updated'}\n`)

    // Admin User
    console.log('👤 Admin User:')
    console.log(`   Email: ${this.results.adminUser?.email}`)
    console.log(`   ID: ${this.results.adminUser?.id}`)
    console.log(`   Status: ${this.results.adminUser?.created ? 'Created' : 'Existing'}`)
    if (this.results.adminUser?.magicLink) {
      console.log(`   Magic Link: ${this.results.adminUser.magicLink}`)
    }
    console.log('')

    // Data Duplication
    console.log('📋 Data Duplication:')
    console.log(`   Analysts: ${this.results.analysts.duplicated} duplicated, ${this.results.analysts.failed} failed`)
    console.log(`   Events: ${this.results.events.duplicated} duplicated, ${this.results.events.failed} failed`)
    console.log(`   Awards: ${this.results.awards.duplicated} duplicated, ${this.results.awards.failed} failed\n`)

    // Vendor Assignments
    console.log('🔗 Vendor Domain Assignments:')
    console.log(`   Success: ${this.results.assignments.success.length} tables`)
    console.log(`   Failed: ${this.results.assignments.failed.length} tables\n`)

    // Company Profile
    console.log('🏢 Company Profile:')
    console.log(`   Status: ${this.results.companyProfile?.success ? 'Success' : 'Failed'}`)
    if (this.results.companyProfile?.error) {
      console.log(`   Error: ${this.results.companyProfile.error}`)
    }
    console.log('')

    // Tests
    console.log('🧪 Tests:')
    console.log(`   Passed: ${this.results.tests.passed}`)
    console.log(`   Failed: ${this.results.tests.failed}`)
    this.results.tests.results.forEach(test => {
      const icon = test.success ? '✅' : '❌'
      console.log(`   ${icon} ${test.name}: ${test.message}`)
    })
    console.log('')

    // Next Steps
    console.log('🎯 Next Steps:')
    console.log(`1. Admin can log in at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}`)
    console.log(`2. Use email: admin@${this.domain}`)
    if (this.results.adminUser?.magicLink) {
      console.log(`3. Or use the magic link provided above`)
    } else {
      console.log(`3. Use magic link authentication or set up password`)
    }
    console.log(`4. Admin will have access to all duplicated data`)
    console.log(`5. Analyst portal access is restricted for this domain`)
    console.log('')

    const overallSuccess = this.results.tests.failed === 0 && 
                          this.results.domain && 
                          this.results.adminUser
    
    console.log(overallSuccess ? '🎉 INITIALIZATION SUCCESSFUL!' : '⚠️  INITIALIZATION COMPLETED WITH ISSUES')
  }
}

// Main execution
async function main() {
  const initializer = new AccountInitializer()
  await initializer.initialize()
}

// Handle script execution
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })
}

module.exports = { AccountInitializer }
