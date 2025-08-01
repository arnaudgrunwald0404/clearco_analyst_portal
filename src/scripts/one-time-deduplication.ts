#!/usr/bin/env tsx

/**
 * One-time script to deduplicate analyst topics
 * Removes exact duplicates and consolidates similar topics
 * 
 * Usage: npx tsx src/scripts/one-time-deduplication.ts [--dry-run]
 */

import { PrismaClient } from '@prisma/client'
import { consolidateTopics } from '../lib/topic-consolidation'
import { getAnalystsWithTopics, logAnalystCount } from '../lib/utils/database-queries'

const prisma = new PrismaClient()

async function runDeduplication(dryRun: boolean = false) {
  console.log('🔧 One-Time Topic Deduplication Script')
  console.log('═'.repeat(50))
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be applied')
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied to database')
  }
  
  console.log('─'.repeat(50))

  try {
    // Get all analysts with their covered topics
    console.log('📊 Fetching analysts and their topics...')
    const analysts = await getAnalystsWithTopics()

    if (analysts.length === 0) {
      console.log('ℹ️  No analysts found with topics')
      return
    }

    logAnalystCount(analysts.length, 'analysts with topics')

    let totalUpdated = 0
    let totalTopicsRemoved = 0
    let totalOriginalTopics = 0
    let totalFinalTopics = 0

    // Process each analyst
    for (const analyst of analysts) {
      if (analyst.coveredTopics && Array.isArray(analyst.coveredTopics)) {
        const originalTopics = analyst.coveredTopics.map(t => t.topic)
        const consolidatedTopics = consolidateTopics(originalTopics)
        
        totalOriginalTopics += originalTopics.length
        totalFinalTopics += consolidatedTopics.length
        
        // Check if there are duplicates to remove
        if (JSON.stringify(originalTopics.sort()) !== JSON.stringify(consolidatedTopics.sort())) {
          const duplicatesRemoved = originalTopics.length - consolidatedTopics.length
          totalTopicsRemoved += duplicatesRemoved
          
          console.log(`\n👤 ${analyst.firstName} ${analyst.lastName} (${analyst.email})`)
          console.log(`   Original topics (${originalTopics.length}): ${originalTopics.join(', ')}`)
          console.log(`   Deduplicated topics (${consolidatedTopics.length}): ${consolidatedTopics.join(', ')}`)
          console.log(`   ✂️  Removed ${duplicatesRemoved} duplicate/similar topics`)
          
          if (!dryRun) {
            // Delete existing topics
            await prisma.analystCoveredTopic.deleteMany({
              where: { analystId: analyst.id }
            })
            
            // Insert deduplicated topics
            const topicInserts = consolidatedTopics.map(topic => ({
              analystId: analyst.id,
              topic: topic
            }))
            
            await prisma.analystCoveredTopic.createMany({
              data: topicInserts
            })
            
            console.log(`   ✅ Database updated`)
          }
          
          totalUpdated++
        } else {
          console.log(`✅ ${analyst.firstName} ${analyst.lastName}: No duplicates found`)
        }
      }
    }

    console.log('\n🎉 Deduplication Complete!')
    console.log('═'.repeat(50))
    console.log(`📊 Summary:`)
    console.log(`   • Analysts processed: ${analysts.length}`)
    console.log(`   • Analysts with duplicates: ${totalUpdated}`)
    console.log(`   • Total original topics: ${totalOriginalTopics}`)
    console.log(`   • Total final topics: ${totalFinalTopics}`)
    console.log(`   • Total duplicates removed: ${totalTopicsRemoved}`)
    
    if (totalTopicsRemoved > 0) {
      const reductionPercentage = Math.round((totalTopicsRemoved / totalOriginalTopics) * 100)
      console.log(`   • Reduction: ${reductionPercentage}%`)
    }
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No changes applied')
      console.log('💡 To apply changes, run: npx tsx src/scripts/one-time-deduplication.ts')
    } else {
      console.log('\n✅ DEDUPLICATION APPLIED TO DATABASE')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// Run the script
runDeduplication(dryRun).catch(console.error)
