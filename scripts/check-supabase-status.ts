#!/usr/bin/env tsx

// Load environment variables from .env file
import { config } from 'dotenv'
config({ path: '.env' })

import { createClient } from '@supabase/supabase-js'

async function checkSupabaseStatus() {
  console.log('🔍 Checking Supabase project status...\n')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Missing Supabase configuration:')
    console.log(`   NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ Missing'}`)
    console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseKey ? '✅' : '❌ Missing'}`)
    return
  }
  
  console.log('📋 Supabase Configuration:')
  console.log(`   URL: ${supabaseUrl}`)
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`)
  
  try {
    console.log('\n⏳ Testing Supabase client connection...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase
      .from('User')
      .select('count(*)', { count: 'exact', head: true })
    
    if (error) {
      console.log('❌ Supabase client connection failed:', error.message)
      
      if (error.message.includes('relation "User" does not exist')) {
        console.log('\n💡 This might indicate:')
        console.log('   • Database tables haven\'t been created yet')
        console.log('   • Need to run Prisma migrations')
        console.log('   • Wrong database or schema')
      }
    } else {
      console.log('✅ Supabase client connection successful!')
      console.log(`📊 Found ${data || 0} users via Supabase client`)
    }
    
  } catch (error: any) {
    console.log('❌ Unexpected error:', error.message)
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('🔧 NEXT STEPS')
  console.log('='.repeat(60))
  
  console.log('\n1. 🌐 Check Supabase Dashboard:')
  console.log('   • Go to https://supabase.com/dashboard')
  console.log('   • Ensure your project is active (not paused)')
  console.log('   • Check Project Settings → Database')
  
  console.log('\n2. 📝 Add Missing Connection Strings:')
  console.log('   Add these to your .env file:')
  console.log('')
  console.log('   # Transaction Pooler')
  console.log('   DATABASE_URL_2="postgresql://postgres.qimvwwfwakvgfvclqpue:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"')
  console.log('')
  console.log('   # Session Pooler') 
  console.log('   DATABASE_URL_3="postgresql://postgres.qimvwwfwakvgfvclqpue:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&pool_mode=session"')
  
  console.log('\n3. 🔄 Test Again:')
  console.log('   npm run test:db')
  
  console.log('\n4. 🚀 If Database is Paused:')
  console.log('   • Go to Supabase Dashboard')
  console.log('   • Click "Restore" or "Resume" project')
  console.log('   • Wait for database to become active')
  console.log('   • Free tier pauses after 1 week of inactivity')
}

checkSupabaseStatus().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
