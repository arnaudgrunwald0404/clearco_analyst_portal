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

async function viewCurrentTopics() {
  console.log('🔍 Current Topics in Database')
  console.log('═'.repeat(50))
  
  try {
    // Fetch all analysts with their topics
    const analysts = await prisma.analyst.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        coveredTopics: {
          select: { topic: true }
        }
      }
    })

    if (analysts.length === 0) {
      console.log('ℹ️  No analysts found')
      return
    }

    // Collect all unique topics
    const allTopics = new Set<string>()
    let analystsWithTopics = 0
    
    analysts.forEach(analyst => {
      if (analyst.coveredTopics && Array.isArray(analyst.coveredTopics)) {
        analystsWithTopics++
        analyst.coveredTopics.forEach((topicEntry) => {
          if (topicEntry.topic && topicEntry.topic.trim()) {
            allTopics.add(topicEntry.topic.trim())
          }
        })
      }
    })

    const uniqueTopics = Array.from(allTopics).sort()
    console.log(`📊 Found ${uniqueTopics.length} unique topics across ${analystsWithTopics} analysts`)

    console.log('\n📋 All current topics:')
    console.log('─'.repeat(50))
    uniqueTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`)
    })

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
viewCurrentTopics().catch(console.error)
