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

async function viewCurrentTopics() {
  console.log('🔍 Current Topics in Database')
  console.log('═'.repeat(50))
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Fetch all analysts with their topics
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

    // Collect all unique topics
    const allTopics = new Set<string>()
    let analystsWithTopics = 0
    
    analysts.forEach(analyst => {
      if (analyst.AnalystCoveredTopic && Array.isArray(analyst.AnalystCoveredTopic)) {
        analystsWithTopics++
        analyst.AnalystCoveredTopic.forEach((topicEntry: any) => {
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
  }
}

// Run the script
viewCurrentTopics().catch(console.error)
