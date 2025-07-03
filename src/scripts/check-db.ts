#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
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

const prisma = new PrismaClient()

async function checkDatabase() {
  console.log('🔍 Checking database connection...')
  console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')
  
  try {
    // Test connection with a simple query
    await prisma.$connect()
    console.log('✅ Connected to database')
    
    // Try to query different models to check if they exist
    const models = [
      { name: 'analyst', query: () => prisma.analyst.count() },
      { name: 'user', query: () => prisma.user.count() },
      { name: 'newsletter', query: () => prisma.newsletter.count() },
      { name: 'briefing', query: () => prisma.briefing.count() },
      { name: 'actionItem', query: () => prisma.actionItem.count() },
      { name: 'award', query: () => prisma.award.count() }
    ]
    
    console.log('\n📊 Checking model accessibility:')
    for (const model of models) {
      try {
        const count = await model.query()
        console.log(`✅ ${model.name}: ${count} records`)
      } catch (error) {
        console.log(`❌ ${model.name}: Error - ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
    
    // Try to get a sample analyst record
    try {
      const sampleAnalyst = await prisma.analyst.findFirst({
        select: { id: true, firstName: true, lastName: true, email: true }
      })
      if (sampleAnalyst) {
        console.log('\n📋 Sample analyst record:')
        console.log(sampleAnalyst)
      } else {
        console.log('\n📋 No analyst records found')
      }
    } catch (error) {
      console.log('\n❌ Error fetching sample analyst:', error instanceof Error ? error.message : 'Unknown error')
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDatabase()
