#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkCurrentTopics() {
  try {
    console.log('📊 Checking current topics in database...')

    const topics = await prisma.predefinedTopic.findMany({
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ]
    })

    const coreTopics = topics.filter(t => t.category === 'CORE')
    const additionalTopics = topics.filter(t => t.category === 'ADDITIONAL')

    console.log(`\n🔧 CORE TOPICS (${coreTopics.length}):`)
    coreTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.name}`)
    })

    console.log(`\n➕ ADDITIONAL TOPICS (${additionalTopics.length}):`)
    additionalTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic.name}`)
    })

    console.log(`\n📈 SUMMARY:`)
    console.log(`   Total Topics: ${topics.length}`)
    console.log(`   Core: ${coreTopics.length}`)
    console.log(`   Additional: ${additionalTopics.length}`)

    // Now let's also check all analyst expertise topics
    console.log('\n🔍 Checking analyst expertise topics...')
    
    const analystCoveredTopics = await prisma.analystCoveredTopic.findMany({
      include: {
        analyst: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    const expertiseTopics = [...new Set(analystCoveredTopics.map(e => e.topic))]
    console.log(`\n🎯 ANALYST EXPERTISE TOPICS (${expertiseTopics.length} unique):`)
    expertiseTopics.sort().forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`)
    })

    return {
      predefinedTopics: topics,
      expertiseTopics: expertiseTopics
    }

  } catch (error) {
    console.error('❌ Error checking topics:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkCurrentTopics()
