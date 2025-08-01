#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env file
try {
  const envPath = join(process.cwd(), '.env')
  const envFile = readFileSync(envPath, 'utf8')
  const envVars = envFile.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=')
    if (key && value) {
      acc[key.trim()] = value.trim()
    }
    return acc
  }, {} as Record<string, string>)
  
  Object.assign(process.env, envVars)
} catch (error) {
  console.log('⚠️  Could not load .env file')
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '❌ Missing')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '❌ Missing')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '❌ Missing')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  console.log('🔍 Checking Supabase database connection...')
  console.log('Supabase URL:', supabaseUrl)
  
  try {
    // Test basic connection
    console.log('\n📊 Testing database connection...')
    const { data, error } = await supabase
      .from('analysts')
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Database connection failed:', error.message)
      return false
    }

    console.log('✅ Database connection successful')

    // Check core tables
    console.log('\n📋 Checking core tables...')
    const tables = ['analysts', 'briefings', 'social_posts', 'action_items', 'influence_tiers', 'GeneralSettings']
    
    for (const table of tables) {
      try {
        const { count, error: tableError } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (tableError) {
          console.log(`❌ ${table}: ${tableError.message}`)
        } else {
          console.log(`✅ ${table}: ${count} rows`)
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err}`)
      }
    }

    // Test a sample query
    console.log('\n🔍 Testing sample queries...')
    
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('firstName, lastName, company')
      .limit(3)

    if (analystsError) {
      console.log('❌ Sample analysts query failed:', analystsError.message)
    } else {
      console.log(`✅ Retrieved ${analysts?.length || 0} sample analysts`)
      analysts?.forEach((analyst, index) => {
        console.log(`   ${index + 1}. ${analyst.firstName} ${analyst.lastName} (${analyst.company})`)
      })
    }

    const { data: briefings, error: briefingsError } = await supabase
      .from('briefings')
      .select('title, scheduledAt, status')
      .limit(3)

    if (briefingsError) {
      console.log('❌ Sample briefings query failed:', briefingsError.message)
    } else {
      console.log(`✅ Retrieved ${briefings?.length || 0} sample briefings`)
      briefings?.forEach((briefing, index) => {
        console.log(`   ${index + 1}. ${briefing.title} (${briefing.status})`)
      })
    }

    console.log('\n🎉 Database check completed successfully!')
    return true

  } catch (error) {
    console.error('❌ Database check failed:', error)
    return false
  }
}

async function main() {
  console.log('🚀 Starting Supabase database check...')
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`)
  
  const success = await checkDatabase()
  
  if (success) {
    console.log('\n✅ All checks passed!')
    process.exit(0)
  } else {
    console.log('\n❌ Some checks failed!')
    process.exit(1)
  }
}

// Run the check
main().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
