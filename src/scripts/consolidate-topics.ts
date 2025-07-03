#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { consolidateTopics, analyzeTopicConsolidation } from '@/lib/topic-consolidation'

const prisma = new PrismaClient()

async function extractAndConsolidateTopics() {
  console.log('🔍 Extracting current topics from database...')
  
  try {
    // Get all analysts with their covered topics
    const analysts = await prisma.analyst.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        coveredTopics: {
          select: { topic: true }
        }
      },
      where: {
        coveredTopics: {
          some: {}
        }
      }
    })

    if (analysts.length === 0) {
      console.log('ℹ️  No analysts found with topics')
      return
    }

    // Extract all unique topics
    const allTopics = new Set<string>()
    analysts.forEach(analyst => {
      if (analyst.coveredTopics && Array.isArray(analyst.coveredTopics)) {
        analyst.coveredTopics.forEach((topicEntry) => {
          if (topicEntry.topic && topicEntry.topic.trim()) {
            allTopics.add(topicEntry.topic.trim())
          }
        })
      }
    })

    const uniqueTopics = Array.from(allTopics).sort()
    
    console.log(`\n📊 Found ${uniqueTopics.length} unique topics:`)
    console.log('─'.repeat(50))
    uniqueTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`)
    })

    // Analyze consolidation
    console.log('\n🔄 Analyzing consolidation opportunities...')
    const analysis = analyzeTopicConsolidation(uniqueTopics)
    
    console.log('\n📈 Consolidation Analysis:')
    console.log('─'.repeat(50))
    console.log(`Original topics: ${analysis.originalCount}`)
    console.log(`After consolidation: ${analysis.consolidatedCount}`)
    console.log(`Reduction: ${analysis.reductionCount} topics (${analysis.reductionPercentage}%)`)
    
    if (analysis.suggestions.length > 0) {
      console.log('\n💡 Consolidation Suggestions:')
      console.log('─'.repeat(50))
      analysis.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. "${suggestion.original.join('", "')}" → "${suggestion.consolidated}"`)
      })
    }

    console.log('\n✨ Consolidated Topics:')
    console.log('─'.repeat(50))
    analysis.consolidated.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`)
    })

    // Simple ChatGPT alternative approach
    console.log('\n🤖 Alternative: Simple ChatGPT Prompt Approach')
    console.log('─'.repeat(50))
    console.log('You could just send this prompt to ChatGPT:')
    console.log('')
    console.log('"Please consolidate these duplicate/similar topics into a shorter list:')
    console.log(uniqueTopics.join(', '))
    console.log('')
    console.log('Remove duplicates and group similar concepts together."')
    console.log('')
    console.log('This would be much simpler and probably more accurate! 😅')

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the script
extractAndConsolidateTopics().catch(console.error)
