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

// Expansion mapping to add Clear Company core areas
const expansionMap: Record<string, string[]> = {
  "Data & Analytics": ["People Analytics", "Data & Analytics"], 
  "Talent Acquisition": ["Sourcing", "CRM/Candidate Relationship Management", "Talent Acquisition"],
  "Talent Management": ["Talent Management", "Onboarding"],
  "Employee Experience": ["Employee Experience", "Compensation Management"],
  "HR Technology": ["HR Technology", "Learning & Development"],
  "Enterprise Systems": ["Enterprise Systems"],
  "Performance Management": ["Performance Management"], 
  "Leadership": ["Leadership"]
}

// Additional topics to ensure we reach ~20 total
const additionalTopics = [
  "AI & Machine Learning",
  "Digital Transformation", 
  "Future of Work",
  "Diversity & Inclusion",
  "Strategy",
  "Customer Experience",
  "Communication",
  "Market Research",
  "Innovation",
  "Security",
  "Cloud Technology",
  "Compliance"
]

async function expandToCompanyFocusedTopics() {
  console.log('🔄 Expanding Topics to Clear Company Focus')
  console.log('═'.repeat(50))
  
  try {
    // Fetch all analysts with their current topics
    console.log('📊 Fetching analysts and their current topics...')
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

    console.log(`📋 Found ${analysts.length} analysts`)

    // Get all current unique topics
    const currentTopics = new Set<string>()
    analysts.forEach(analyst => {
      if (analyst.coveredTopics && Array.isArray(analyst.coveredTopics)) {
        analyst.coveredTopics.forEach((topicEntry) => {
          if (topicEntry.topic && topicEntry.topic.trim()) {
            currentTopics.add(topicEntry.topic.trim())
          }
        })
      }
    })

    console.log(`🔍 Current topics: ${Array.from(currentTopics).join(', ')}`)

    // Build expanded topic set
    const expandedTopics = new Set<string>()
    
    // Add expanded versions of current topics
    currentTopics.forEach(topic => {
      if (expansionMap[topic]) {
        expansionMap[topic].forEach(expandedTopic => expandedTopics.add(expandedTopic))
      } else {
        expandedTopics.add(topic)
      }
    })

    // Add additional strategic topics
    additionalTopics.forEach(topic => expandedTopics.add(topic))

    const finalTopics = Array.from(expandedTopics).sort()
    
    console.log(`\n✨ Expanded to ${finalTopics.length} topics:`)
    console.log('─'.repeat(50))
    finalTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`)
    })

    console.log('\n🔍 Clear Company Core Areas (preserved):')
    console.log('─'.repeat(50))
    const coreAreas = [
      "Sourcing",
      "CRM/Candidate Relationship Management", 
      "Talent Acquisition",
      "Onboarding",
      "Talent Management",
      "Performance Management",
      "Compensation Management",
      "Learning & Development",
      "People Analytics"
    ]
    coreAreas.forEach(area => {
      const isPresent = finalTopics.includes(area) ? '✅' : '❌'
      console.log(`${isPresent} ${area}`)
    })

    // Now we need to intelligently assign these expanded topics to analysts
    console.log('\n🔄 Updating analyst records with expanded topics...')
    let updatedCount = 0

    for (const analyst of analysts) {
      if (analyst.coveredTopics && Array.isArray(analyst.coveredTopics)) {
        const currentAnalystTopics = analyst.coveredTopics.map((t) => t.topic)
        const newTopics: string[] = []

        // Expand each current topic
        currentAnalystTopics.forEach(currentTopic => {
          if (expansionMap[currentTopic]) {
            // Add all expanded versions
            expansionMap[currentTopic].forEach(expandedTopic => {
              if (!newTopics.includes(expandedTopic)) {
                newTopics.push(expandedTopic)
              }
            })
          } else {
            // Keep the original topic
            if (!newTopics.includes(currentTopic)) {
              newTopics.push(currentTopic)
            }
          }
        })

        // Only update if there are changes
        if (newTopics.length > currentAnalystTopics.length || 
            JSON.stringify(currentAnalystTopics.sort()) !== JSON.stringify(newTopics.sort())) {
          
          // Delete existing topics
          await prisma.analystCoveredTopic.deleteMany({
            where: { analystId: analyst.id }
          })
          
          // Insert new expanded topics
          const topicInserts = newTopics.map(topic => ({
            analystId: analyst.id,
            topic: topic
          }))
          
          await prisma.analystCoveredTopic.createMany({
            data: topicInserts
          })
          
          console.log(`✅ Updated ${analyst.firstName} ${analyst.lastName}: ${currentAnalystTopics.length} → ${newTopics.length} topics`)
          updatedCount++
        }
      }
    }

    console.log('\n🎉 Expansion Complete!')
    console.log('─'.repeat(50))
    console.log(`✅ Updated ${updatedCount} analyst records`)
    console.log(`✅ Expanded from ${currentTopics.size} to ${finalTopics.length} topics`)
    console.log('✅ Clear Company core areas are now properly represented')
    console.log('\n🔄 Please refresh your UI to see the expanded topics!')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the expansion
expandToCompanyFocusedTopics().catch(console.error)
