/*
  Dev Seed: Betterworks vendor dummy data
  - Creates vendor domain entry
  - Creates analyst portal settings
  - Adds sample content
  - Creates admin user
  Usage:
    TS_NODE_TRANSPILE_ONLY=1 tsx scripts/seed_betterworks_fixed.ts
*/

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function createVendorDomain() {
  const vendorDomain = {
    id: 'betterworks-vendor-domain',
    company_name: 'Betterworks',
    protected_domain: 'betterworks.com',
    logo_url: 'https://logo.clearbit.com/betterworks.com',
    industry_name: 'HR Technology',
    portal_welcome_quote: 'Welcome to Betterworks! We help enterprises align goals, drive performance, and engage employees with OKRs and continuous performance management.',
    portal_contact_name: 'Alex Morgan',
    portal_contact_title: 'Head of Analyst Relations',
    portal_contact_email: 'alex.morgan@betterworks.com',
    portal_contact_phone: '+1 (555) 123-4567',
    company_profile: 'Betterworks helps enterprises align goals, drive performance, and engage employees with OKRs and continuous performance management. Our platform combines goal setting, performance reviews, and employee development in one integrated solution.'
  }
  
  const { data, error } = await supabase
    .from('vendor_domains')
    .upsert(vendorDomain, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('Error creating vendor domain:', error)
  } else {
    console.log('✅ Created vendor domain:', data)
  }
}

async function createAnalystPortalSettings() {
  const settings = {
    id: 'betterworks-portal',
    contactName: 'Alex Morgan',
    contactTitle: 'Head of Analyst Relations',
    contactEmail: 'alex.morgan@betterworks.com',
    authorImageUrl: null,
    companyOverview: 'Betterworks helps enterprises align goals, drive performance, and engage employees with OKRs and continuous performance management. Our platform combines goal setting, performance reviews, and employee development in one integrated solution.',
    valueProposition: 'OKRs and performance management that actually stick.',
    keyDifferentiators: 'Enterprise scale, integrations, analytics, ease of rollout',
    welcomeQuote: 'Welcome to Betterworks! We help enterprises align goals, drive performance, and engage employees with OKRs and continuous performance management.',
    resources: []
  }
  
  const { data, error } = await supabase
    .from('analyst_portal_settings')
    .upsert(settings, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('Error creating analyst portal settings:', error)
  } else {
    console.log('✅ Created analyst portal settings:', data)
  }
}

async function seedContent() {
  // First get the vendor domain ID
  const { data: vendorDomain } = await supabase
    .from('vendor_domains')
    .select('id')
    .eq('protected_domain', 'betterworks.com')
    .single()
  
  if (!vendorDomain) {
    console.error('❌ Vendor domain not found')
    return
  }
  
  const contentRows = [
    {
      id: 'bw-content-1',
      vendor_domain_id: vendorDomain.id,
      title: 'OKR Program Starter Kit',
      description: 'Comprehensive templates and best practices to launch successful OKR programs',
      category: 'PRODUCT',
      url: 'https://betterworks.com/resources/okr-starter-kit.pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bw-content-2',
      vendor_domain_id: vendorDomain.id,
      title: 'Product Overview Demo',
      description: 'Watch how Betterworks helps enterprises align goals and drive performance',
      category: 'VIDEOS',
      url: 'https://betterworks.com/demo/product-overview.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'bw-content-3',
      vendor_domain_id: vendorDomain.id,
      title: 'Enterprise Customer Success Story',
      description: 'How Fortune 500 companies achieve 85% goal completion rates with Betterworks',
      category: 'CASE_STUDIES',
      url: 'https://betterworks.com/customers/enterprise-success-story.pdf',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
  
  const { data, error } = await supabase
    .from('vendor_portal_content')
    .upsert(contentRows, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('Error creating content:', error)
  } else {
    console.log('✅ Created content:', data)
  }
}

async function createAdminUser() {
  const user = {
    id: 'bw-admin-1',
    email: 'alex.morgan@betterworks.com',
    name: 'Alex Morgan',
    picture: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face',
    updated_at: new Date().toISOString(),
  }
  
  const { data, error } = await supabase
    .from('user_profiles')
    .upsert(user, { onConflict: 'id' })
    .select()
  
  if (error) {
    console.error('Error creating admin user:', error)
  } else {
    console.log('✅ Created admin user:', data)
  }
}

async function main() {
  console.log('🌱 Seeding Betterworks vendor account...')
  
  try {
    await createVendorDomain()
    await createAnalystPortalSettings()
    await seedContent()
    await createAdminUser()
    
    console.log('🎉 Betterworks seeding completed successfully!')
    console.log('')
    console.log('📧 Login credentials:')
    console.log('   Email: alex.morgan@betterworks.com')
    console.log('   Domain: betterworks.com')
    console.log('')
    console.log('🔗 Magic link will be generated when you try to log in')
    console.log('   (Check console logs for the magic link URL)')
    
  } catch (err) {
    console.error('❌ Error during seeding:', err)
    process.exit(1)
  }
}

main()
