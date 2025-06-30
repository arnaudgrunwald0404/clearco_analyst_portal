#!/usr/bin/env tsx

/**
 * Production script to consolidate duplicate/similar topics in the analyst database
 * 
 * Usage: npx tsx src/scripts/apply-topic-consolidation.ts [--dry-run]
 * 
 * --dry-run: Preview changes without applying them
 */

import { createClient } from '@supabase/supabase-js'
import { consolidateTopics, analyzeTopicConsolidation } from '../lib/topic-consolidation'
import * as dotenv from 'dotenv'
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
  console.log('⚠️  Could not load .env file, using existing environment variables')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

async function applyTopicConsolidation(dryRun: boolean = false) {
  console.log('🔄 Topic Consolidation Script')
  console.log('═'.repeat(50))
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be applied')
  } else {
    console.log('⚠️  LIVE MODE - Changes will be applied to database')
  }
  
  console.log('─'.repeat(50))

  // Skip actual database operations for demo
  if (!supabaseUrl || !supabaseKey) {
    console.log('⚠️  Supabase credentials not configured. Running in demo mode...\n')
    await demoConsolidation()
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Get all analysts with their covered topics
    console.log('📊 Fetching analysts and their topics...')
    const { data: analysts, error } = await supabase
      .from('analysts')
      .select('id, name, covered_topics')
      .not('covered_topics', 'is', null)
    
    if (error) {
      console.error('❌ Error fetching analysts:', error)
      return
    }

    if (!analysts || analysts.length === 0) {
      console.log('ℹ️  No analysts found with topics')
      return
    }

    console.log(`📋 Found ${analysts.length} analysts with topics`)

    // Extract all unique topics
    const allTopics = new Set<string>()
    analysts.forEach(analyst => {
      if (analyst.covered_topics && Array.isArray(analyst.covered_topics)) {
        analyst.covered_topics.forEach((topic: string) => {
          if (topic && topic.trim()) {
            allTopics.add(topic.trim())
          }
        })
      }
    })

    const uniqueTopics = Array.from(allTopics).sort()
    console.log(`🔍 Found ${uniqueTopics.length} unique topics across all analysts`)

    // Analyze consolidation
    const analysis = analyzeTopicConsolidation(uniqueTopics)
    
    console.log('\n📈 Consolidation Analysis:')
    console.log('─'.repeat(50))
    console.log(`Original topics: ${analysis.originalCount}`)
    console.log(`After consolidation: ${analysis.consolidatedCount}`)
    console.log(`Reduction: ${analysis.reductionCount} topics (${analysis.reductionPercentage}% reduction)`)
    
    if (analysis.suggestions.length > 0) {
      console.log('\n💡 Topics to be consolidated:')
      console.log('─'.repeat(50))
      analysis.suggestions.forEach((suggestion, index) => {
        console.log(`${index + 1}. [${suggestion.original.join(', ')}] → "${suggestion.consolidated}"`)
      })
    } else {
      console.log('\n✅ No consolidation needed - all topics are already unique!')
      return
    }

    if (dryRun) {
      console.log('\n🔍 DRY RUN COMPLETE - No changes applied')
      return
    }

    // Apply consolidation to each analyst
    console.log('\n🔄 Applying consolidation to analyst records...')
    let updatedCount = 0
    
    for (const analyst of analysts) {
      if (analyst.covered_topics && Array.isArray(analyst.covered_topics)) {
        const originalTopics = analyst.covered_topics
        const consolidatedTopics = consolidateTopics(originalTopics)
        
        // Only update if there's a difference
        if (JSON.stringify(originalTopics.sort()) !== JSON.stringify(consolidatedTopics.sort())) {
          const { error: updateError } = await supabase
            .from('analysts')
            .update({ covered_topics: consolidatedTopics })
            .eq('id', analyst.id)
          
          if (updateError) {
            console.error(`❌ Error updating analyst ${analyst.name}:`, updateError)
          } else {
            console.log(`✅ Updated ${analyst.name}: ${originalTopics.length} → ${consolidatedTopics.length} topics`)
            updatedCount++
          }
        }
      }
    }

    console.log('\n🎉 Consolidation Complete!')
    console.log('─'.repeat(50))
    console.log(`Updated ${updatedCount} analyst records`)
    console.log(`Reduced ${analysis.reductionCount} duplicate topics system-wide`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function demoConsolidation() {
  // Demo with sample data when database isn't available
  const sampleTopics = [
    "ERP systems", "enterprise resource planning", "Learning", "L&D", 
    "Leadership", "leadership development", "AI", "artificial intelligence",
    "machine learning", "talent management", "recruiting", "HR analytics"
  ]

  console.log('📊 Demo with sample topics:')
  console.log(sampleTopics.join(', '))
  
  const analysis = analyzeTopicConsolidation(sampleTopics)
  
  console.log(`\n📈 Demo Results: ${analysis.originalCount} → ${analysis.consolidatedCount} topics (${analysis.reductionPercentage}% reduction)`)
  console.log('\n✨ Consolidated topics:', analysis.consolidated.join(', '))
  
  console.log('\n💡 To use with real database:')
  console.log('1. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.log('2. Run: npx tsx src/scripts/apply-topic-consolidation.ts --dry-run')
  console.log('3. If satisfied, run: npx tsx src/scripts/apply-topic-consolidation.ts')
}

// Parse command line arguments
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')

// Run the script
applyTopicConsolidation(dryRun).catch(console.error)
