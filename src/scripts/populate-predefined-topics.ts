#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
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

// Clear Company Core Topics (Preferred)
const coreTopics = [
  { name: "Sourcing", order: 1 },
  { name: "CRM/Candidate Relationship Management", order: 2 },
  { name: "Talent Acquisition", order: 3 },
  { name: "Onboarding", order: 4 },
  { name: "Talent Management", order: 5 },
  { name: "Performance Management", order: 6 },
  { name: "Compensation Management", order: 7 },
  { name: "Learning & Development", order: 8 },
  { name: "People Analytics", order: 9 }
]

// Additional Strategic Topics
const additionalTopics = [
  { name: "AI & Machine Learning", order: 10 },
  { name: "Cloud Technology", order: 11 },
  { name: "Communication", order: 12 },
  { name: "Compliance", order: 13 },
  { name: "Customer Experience", order: 14 },
  { name: "Data & Analytics", order: 15 },
  { name: "Digital Transformation", order: 16 },
  { name: "Diversity & Inclusion", order: 17 },
  { name: "Employee Experience", order: 18 },
  { name: "Enterprise Systems", order: 19 },
  { name: "Future of Work", order: 20 },
  { name: "HR Technology", order: 21 },
  { name: "Innovation", order: 22 },
  { name: "Leadership", order: 23 },
  { name: "Market Research", order: 24 },
  { name: "Security", order: 25 },
  { name: "Strategy", order: 26 }
]

async function populatePredefinedTopics() {
  console.log('🔄 Populating Predefined Topics Table')
  console.log('═'.repeat(50))
  
  try {
    console.log('🗑️  Clearing existing predefined topics...')
    
    // Clear existing topics
    await prisma.predefinedTopic.deleteMany({})
    console.log('✅ Cleared existing topics')

    // Insert Core Topics
    console.log('\n📊 Inserting Core Topics (Clear Company Preferred)...')
    const coreTopicsToInsert = coreTopics.map(topic => ({
      name: topic.name,
      category: 'CORE' as const,
      order: topic.order,
      description: `Core Clear Company expertise area: ${topic.name}`
    }))

    await prisma.predefinedTopic.createMany({
      data: coreTopicsToInsert
    })

    console.log(`✅ Inserted ${coreTopics.length} core topics`)

    // Insert Additional Topics
    console.log('\n📊 Inserting Additional Strategic Topics...')
    const additionalTopicsToInsert = additionalTopics.map(topic => ({
      name: topic.name,
      category: 'ADDITIONAL' as const,
      order: topic.order,
      description: `Strategic topic for comprehensive analyst coverage: ${topic.name}`
    }))

    await prisma.predefinedTopic.createMany({
      data: additionalTopicsToInsert
    })

    console.log(`✅ Inserted ${additionalTopics.length} additional topics`)

    // Verify insertion
    const allTopics = await prisma.predefinedTopic.findMany({
      orderBy: { order: 'asc' }
    })

    console.log('\n🎉 Population Complete!')
    console.log('─'.repeat(50))
    console.log(`✅ Total topics inserted: ${allTopics.length}`)
    
    const coreCount = allTopics.filter(t => t.category === 'CORE').length
    const additionalCount = allTopics.filter(t => t.category === 'ADDITIONAL').length
    
    console.log(`✅ Core topics: ${coreCount}`)
    console.log(`✅ Additional topics: ${additionalCount}`)

    console.log('\n📋 Core Topics (Clear Company Preferred):')
    console.log('─'.repeat(50))
    allTopics.filter(t => t.category === 'CORE').forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.name}`)
    })

    console.log('\n📋 Additional Strategic Topics:')
    console.log('─'.repeat(50))
    allTopics.filter(t => t.category === 'ADDITIONAL').forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.name}`)
    })

    console.log('\n🔄 Next Steps:')
    console.log('1. Create admin settings page for topic management')
    console.log('2. Update analyst profile forms to use predefined topics')
    console.log('3. Add topic validation in analyst creation/editing')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the population script
populatePredefinedTopics().catch(console.error)
