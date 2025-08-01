#!/usr/bin/env tsx

// Load environment variables from .env file
import { config } from 'dotenv'
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'

interface ConnectionTest {
  name: string
  url: string | undefined
  description: string
}

async function testSingleConnection(test: ConnectionTest): Promise<boolean> {
  if (!test.url) {
    console.log(`❌ ${test.name}: No URL provided`)
    return false
  }

  console.log(`\n🔗 Testing ${test.name}...`)
  console.log(`📝 Description: ${test.description}`)
  console.log(`🔗 URL format: ${test.url.substring(0, 60)}...`)
  
  try {
    // Create a temporary Prisma client with this specific URL
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: test.url
        }
      }
    })
    
    console.log('   ⏳ Connecting...')
    await prisma.$connect()
    console.log('   ✅ Connection successful!')
    
    // Test a simple query
    console.log('   ⏳ Testing query...')
    const userCount = await prisma.user.count()
    console.log(`   📊 Found ${userCount} users in database`)
    
    // Test connection performance
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const duration = Date.now() - start
    console.log(`   ⚡ Query response time: ${duration}ms`)
    
    await prisma.$disconnect()
    console.log(`   🎉 ${test.name} is WORKING and performs well!`)
    return true
  } catch (error: any) {
    console.log(`   ❌ ${test.name} failed: ${error.message}`)
    return false
  }
}

async function testConnection() {
  console.log('🔍 Testing all database connections...\n')
  console.log('='.repeat(60))
  
  const connections: ConnectionTest[] = [
    {
      name: 'Pooler Connection',
      url: process.env.DATABASE_URL_POOLER,
      description: 'Supabase connection pooler (recommended)'
    },
    {
      name: 'Direct Connection',
      url: process.env.DATABASE_URL,
      description: 'Standard PostgreSQL connection directly to Supabase'
    },
    {
      name: 'Transaction Pooler',
      url: process.env.DATABASE_URL_2, 
      description: 'Connection pooling optimized for short-lived transactions'
    },
    {
      name: 'Session Pooler',
      url: process.env.DATABASE_URL_3,
      description: 'Connection pooling optimized for longer sessions'
    }
  ]
  
  const results: { connection: ConnectionTest; success: boolean; }[] = []
  
  // Test each connection
  for (const connection of connections) {
    const success = await testSingleConnection(connection)
    results.push({ connection, success })
  }
  
  // Summary of results
  console.log('\n' + '='.repeat(60))
  console.log('📊 CONNECTION TEST SUMMARY')
  console.log('='.repeat(60))
  
  const workingConnections = results.filter(r => r.success)
  const failedConnections = results.filter(r => !r.success)
  
  if (workingConnections.length > 0) {
    console.log('\n🎉 WORKING CONNECTIONS:')
    workingConnections.forEach((result, index) => {
      console.log(`   ${index + 1}. ✅ ${result.connection.name}`)
      console.log(`      ${result.connection.description}`)
    })
    
    console.log('\n🏆 RECOMMENDATION:')
    const recommended = workingConnections[0]
    console.log(`   Use: ${recommended.connection.name}`)
    console.log(`   Set as: DATABASE_URL in your .env file`)
    
    if (workingConnections.length > 1) {
      console.log(`\n🔄 ALTERNATIVES (if primary fails):`)
      workingConnections.slice(1).forEach((result, index) => {
        console.log(`   ${index + 2}. ${result.connection.name}`)
      })
    }
  } else {
    console.log('\n❌ NO WORKING CONNECTIONS FOUND')
    console.log('\n🔧 All connections failed. Check the troubleshooting guide below.')
  }
  
  if (failedConnections.length > 0) {
    console.log('\n💔 FAILED CONNECTIONS:')
    failedConnections.forEach((result, index) => {
      console.log(`   ${index + 1}. ❌ ${result.connection.name}`)
    })
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📋 TROUBLESHOOTING GUIDE')
  console.log('='.repeat(60))
  
  console.log('\n🔧 If connection failed, try these solutions:')
  console.log('\n1. POOLER CONNECTION (Recommended):')
  console.log('   postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true')
  
  console.log('\n2. DIRECT CONNECTION (Fallback):')
  console.log('   postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres')
  
  console.log('\n3. Check these in Supabase Dashboard:')
  console.log('   • Project Settings → Database → Connection string')
  console.log('   • Ensure database password is correct')
  console.log('   • Verify project reference ID')
  console.log('   • Check if IP restrictions are enabled')
  
  console.log('\n4. Common Issues:')
  console.log('   • Wrong password or project reference')
  console.log('   • Network/firewall blocking connection')
  console.log('   • Database paused (free tier inactivity)')
  console.log('   • Connection pooling configuration')
  
  console.log('\n🚀 To fix:')
  console.log('   1. Update DATABASE_URL in .env file')
  console.log('   2. Restart your development server')
  console.log('   3. Run this test again: npm run test:db')
}

testConnection().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
