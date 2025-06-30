#!/usr/bin/env tsx

import { consolidateTopics, analyzeTopicConsolidation } from '../lib/topic-consolidation'

// Sample topics that might exist in a typical analyst database
const sampleTopics = [
  "ERP systems",
  "enterprise resource planning", 
  "Learning",
  "learning and development",
  "L&D",
  "training",
  "Leadership",
  "leadership development",
  "management development",
  "Human Capital",
  "human capital management",
  "HCM",
  "Talent Management",
  "talent management",
  "recruiting",
  "talent acquisition",
  "AI",
  "artificial intelligence",
  "machine learning",
  "ML",
  "digital transformation",
  "digitalization",
  "digital",
  "cloud computing",
  "cloud",
  "SaaS",
  "employee experience",
  "EX",
  "employee engagement",
  "employee satisfaction",
  "cybersecurity",
  "information security",
  "data security",
  "HR analytics",
  "people analytics",
  "workforce analytics",
  "performance management",
  "performance review",
  "diversity and inclusion",
  "D&I",
  "DEI",
  "remote work",
  "future of work",
  "hybrid work"
]

async function demoConsolidation() {
  console.log('📊 Topic Consolidation Demo')
  console.log('═'.repeat(60))
  
  console.log(`\n🔍 Original Topics (${sampleTopics.length} topics):`)
  console.log('─'.repeat(50))
  sampleTopics.forEach((topic, index) => {
    console.log(`${index + 1}. ${topic}`)
  })

  // Analyze consolidation
  console.log('\n🔄 Running consolidation analysis...')
  const analysis = analyzeTopicConsolidation(sampleTopics)
  
  console.log('\n📈 Consolidation Results:')
  console.log('─'.repeat(50))
  console.log(`Original topics: ${analysis.originalCount}`)
  console.log(`After consolidation: ${analysis.consolidatedCount}`)
  console.log(`Reduction: ${analysis.reductionCount} topics (${analysis.reductionPercentage}% reduction)`)
  
  if (analysis.suggestions.length > 0) {
    console.log('\n💡 Consolidation Mappings Applied:')
    console.log('─'.repeat(50))
    analysis.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. [${suggestion.original.join(', ')}] → "${suggestion.consolidated}"`)
    })
  }

  console.log(`\n✨ Final Consolidated Topics (${analysis.consolidated.length} topics):`)
  console.log('─'.repeat(50))
  analysis.consolidated.forEach((topic, index) => {
    console.log(`${index + 1}. ${topic}`)
  })

  // Show the ChatGPT alternative
  console.log('\n🤖 Alternative: ChatGPT Approach')
  console.log('─'.repeat(50))
  console.log('Instead of building this complex mapping system, you could simply ask ChatGPT:')
  console.log('')
  console.log('💬 "Please consolidate these topics by removing duplicates and grouping similar terms:')
  console.log(sampleTopics.join(', '))
  console.log('')
  console.log('Return a clean, deduplicated list."')
  console.log('')
  console.log('✅ This would be much simpler and likely more accurate!')
  console.log('✅ No need to manually map hundreds of variations')
  console.log('✅ ChatGPT would understand context and nuance better')
  console.log('✅ Much less code to maintain')
}

// Run the demo
demoConsolidation().catch(console.error)
