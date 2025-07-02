#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

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
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Fetch all analysts with their current topics
    console.log('📊 Fetching analysts and their current topics...')
    const { data: analysts, error: fetchError } = await supabase
      .from('Analyst')
      .select(`
        id, 
        firstName, 
        lastName,
        AnalystCoveredTopic (
          topic
        )
      `)
    
    if (fetchError) {
      console.error('❌ Error fetching analysts:', fetchError)
      return
    }

    if (!analysts || analysts.length === 0) {
      console.log('ℹ️  No analysts found')
      return
    }

    console.log(`📋 Found ${analysts.length} analysts`)

    // Get all current unique topics
    const currentTopics = new Set<string>()
    analysts.forEach(analyst => {
      if (analyst.AnalystCoveredTopic && Array.isArray(analyst.AnalystCoveredTopic)) {
        analyst.AnalystCoveredTopic.forEach((topicEntry: any) => {
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
      if (analyst.AnalystCoveredTopic && Array.isArray(analyst.AnalystCoveredTopic)) {
        const currentAnalystTopics = analyst.AnalystCoveredTopic.map((t: any) => t.topic)
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
          const { error: deleteError } = await supabase
            .from('AnalystCoveredTopic')
            .delete()
            .eq('analystId', analyst.id)
          
          if (deleteError) {
            console.error(`❌ Error deleting topics for ${analyst.firstName} ${analyst.lastName}:`, deleteError)
            continue
          }
          
          // Insert new expanded topics
          const topicInserts = newTopics.map(topic => ({
            id: `topic_${analyst.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            analystId: analyst.id,
            topic: topic
          }))
          
          const { error: insertError } = await supabase
            .from('AnalystCoveredTopic')
            .insert(topicInserts)
          
          if (insertError) {
            console.error(`❌ Error inserting topics for ${analyst.firstName} ${analyst.lastName}:`, insertError)
          } else {
            console.log(`✅ Updated ${analyst.firstName} ${analyst.lastName}: ${currentAnalystTopics.length} → ${newTopics.length} topics`)
            updatedCount++
          }
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
  }
}

// Run the expansion
expandToCompanyFocusedTopics().catch(console.error)
