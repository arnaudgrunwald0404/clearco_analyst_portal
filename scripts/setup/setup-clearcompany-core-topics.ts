#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CORE_TOPICS = [
  'Sourcing',
  'CRM',
  'Candidate relationship management',
  'ATS',
  'Onboarding',
  'Background check',
  'Recruiting as a whole',
  'Talent management',
  'Performance management',
  'Learning management systems',
  'Compensation management',
  'People analytics'
]

async function setupCoreTopics() {
  try {
    console.log('🔄 Setting up core topics...')

    // Delete existing core topics
    await prisma.predefinedTopic.deleteMany({
      where: { category: 'CORE' }
    })

    // Create new core topics
    const coreTopics = await Promise.all(
      CORE_TOPICS.map((topicName, index) =>
        prisma.predefinedTopic.create({
          data: {
            name: topicName,
            category: 'CORE',
            order: index + 1,
            description: `Core topic for the ${topicName} domain`
          }
        })
      )
    )

    console.log(`✅ Successfully created ${coreTopics.length} core topics`)
    
    // Display created topics
    console.log('\nCore Topics Created:')
    coreTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.name}`)
    })

    // Show current topic counts
    const allTopics = await prisma.predefinedTopic.findMany()
    const coreCount = allTopics.filter(t => t.category === 'CORE').length
    const additionalCount = allTopics.filter(t => t.category === 'ADDITIONAL').length
    
    console.log(`\n📊 Current topic counts:`)
    console.log(`   Core Topics: ${coreCount}`)
    console.log(`   Additional Topics: ${additionalCount}`)
    console.log(`   Total Topics: ${allTopics.length}`)

    if (additionalCount > 20) {
      console.log(`\n💡 You have ${additionalCount} additional topics - consider running topic simplification!`)
    }

  } catch (error) {
    console.error('❌ Error setting up core topics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

setupCoreTopics()
