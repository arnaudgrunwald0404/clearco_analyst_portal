/*
  Dev Seed: Betterworks vendor dummy data
  - Creates company general settings (name, protected_domain, logo)
  - Creates analyst portal settings (contact, company profile, sample content)
  - Adds a few analysts tied to Betterworks domain
  Usage:
    TS_NODE_TRANSPILE_ONLY=1 tsx scripts/seed_betterworks.ts
*/

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function upsertGeneral() {
  const settings = {
    id: 'betterworks-general',
    company_name: 'Betterworks',
    protected_domain: 'betterworks.com',
    logo_url: 'https://logo.clearbit.com/betterworks.com'
  }
  await supabase.from('general_settings').upsert(settings, { onConflict: 'id' })
}

async function upsertPortal() {
  const ap = {
    id: 'betterworks-portal',
    contactName: 'Alex Morgan',
    contactTitle: 'Head of Analyst Relations',
    contactEmail: 'alex.morgan@betterworks.com',
    authorImageUrl: null,
    companyOverview: 'Betterworks helps enterprises align goals, drive performance, and engage employees with OKRs and continuous performance management.',
    valueProposition: 'OKRs and performance management that actually stick.',
    keyDifferentiators: 'Enterprise scale, integrations, analytics, ease of rollout',
  }
  await supabase.from('analyst_portal_settings').upsert(ap, { onConflict: 'id' })
}

// NOTE: Do not touch the analysts table here. Analysts are independent observers and
// will never represent vendors. Vendor admins are created in the `users` table only.

async function seedContent() {
  const contentRows = [
    { id: 'bw-c-1', title: 'OKR Program Starter Kit', description: 'Templates and best practices to launch OKRs', type: 'REPORT', category: 'product', url: 'https://example.com/okr-starter.pdf', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { id: 'bw-c-2', title: 'Product Overview', description: 'Overview of Betterworks capabilities', type: 'VIDEO', category: 'product', url: 'https://example.com/bw-overview.mp4', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ]
  await supabase.from('portal_content').upsert(contentRows, { onConflict: 'id' })
}

async function seedVendorAdmin() {
  // Create a vendor admin user record for Betterworks
  // Your app's /api/auth/google upserts into 'users' (email, name, picture, updated_at)
  // We also include a role and domain for clarity if those columns exist
  const user = {
    id: 'bw-admin-1',
    email: 'alex.morgan@betterworks.com',
    name: 'Alex Morgan',
    role: 'VENDOR_ADMIN',
    domain: 'betterworks.com',
    updated_at: new Date().toISOString(),
  } as any
  try {
    await supabase.from('users').upsert(user, { onConflict: 'id' })
  } catch {}
}

async function main() {
  console.log('Seeding Betterworks...')
  await upsertGeneral()
  await upsertPortal()
  await seedContent()
  await seedVendorAdmin()
  console.log('Done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})


