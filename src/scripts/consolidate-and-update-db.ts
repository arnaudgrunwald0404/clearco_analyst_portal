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

// ChatGPT-style consolidation mapping
const consolidationMap: Record<string, string> = {
  // AI/ML consolidation
  "artificial intelligence": "AI & Machine Learning",
  "ai": "AI & Machine Learning", 
  "machine learning": "AI & Machine Learning",
  "ml": "AI & Machine Learning",
  "ai strategy": "AI & Machine Learning",
  "ai/ml": "AI & Machine Learning",
  "data science": "Data & Analytics",
  
  // Cloud & Technology
  "cloud computing": "Cloud Technology",
  "cloud": "Cloud Technology",
  "cloud strategy": "Cloud Technology", 
  "digital infrastructure": "Cloud Technology",
  "saas": "Cloud Technology",
  "software as a service": "Cloud Technology",
  
  // Security
  "cybersecurity": "Security",
  "information security": "Security",
  "data security": "Security",
  "security": "Security",
  
  // Data & Analytics
  "data analytics": "Data & Analytics",
  "big data": "Data & Analytics", 
  "business intelligence": "Data & Analytics",
  "predictive analytics": "Data & Analytics",
  "analytics": "Data & Analytics",
  "people analytics": "Data & Analytics",
  "hr analytics": "Data & Analytics",
  "workforce analytics": "Data & Analytics",
  
  // Digital Transformation
  "digital transformation": "Digital Transformation",
  "digitalization": "Digital Transformation",
  "digital": "Digital Transformation",
  "digital strategy": "Digital Transformation",
  
  // Automation
  "process automation": "Automation",
  "automation": "Automation",
  "rpa": "Automation",
  "robotic process automation": "Automation",
  "workflow optimization": "Automation",
  
  // HR & Talent
  "hr technology": "HR Technology",
  "human resources": "HR Technology",
  "talent management": "Talent Management",
  "performance management": "Performance Management",
  "performance review": "Performance Management",
  "performance evaluation": "Performance Management",
  
  // Talent Acquisition (separate from talent management)
  "talent acquisition": "Talent Acquisition", 
  "recruiting": "Talent Acquisition",
  "recruitment": "Talent Acquisition",
  "hiring": "Talent Acquisition",
  
  // Learning & Development
  "learning": "Learning & Development",
  "learning and development": "Learning & Development",
  "l&d": "Learning & Development",
  "training": "Learning & Development",
  "employee training": "Learning & Development",
  "professional development": "Learning & Development",
  "skill development": "Learning & Development",
  "learning management systems": "Learning & Development",
  "lms": "Learning & Development",
  "e-learning": "Learning & Development",
  
  // Leadership
  "leadership": "Leadership",
  "leadership development": "Leadership",
  "management development": "Leadership",
  "executive development": "Leadership",
  
  // Employee Experience
  "employee experience": "Employee Experience",
  "ex": "Employee Experience",
  "employee engagement": "Employee Experience",
  "employee satisfaction": "Employee Experience",
  "workplace culture": "Employee Experience",
  "company culture": "Employee Experience",
  "organizational culture": "Employee Experience",
  "culture": "Employee Experience",
  "employee wellbeing": "Employee Experience",
  "work-life balance": "Employee Experience",
  
  // Future of Work
  "future of work": "Future of Work",
  "remote work": "Future of Work",
  "hybrid work": "Future of Work",
  "flexible work": "Future of Work",
  "distributed workforce": "Future of Work",
  "virtual teams": "Future of Work",
  "workplace technology": "Future of Work",
  
  // Diversity & Inclusion
  "diversity and inclusion": "Diversity & Inclusion",
  "d&i": "Diversity & Inclusion",
  "dei": "Diversity & Inclusion",
  "diversity": "Diversity & Inclusion",
  "inclusion": "Diversity & Inclusion",
  "equity": "Diversity & Inclusion",
  
  // Customer Experience
  "customer experience": "Customer Experience",
  "cx": "Customer Experience",
  "cx strategy": "Customer Experience",
  "user experience": "User Experience",
  "ux": "User Experience",
  
  // Business Strategy
  "business strategy": "Strategy",
  "strategy": "Strategy",
  "strategic planning": "Strategy",
  "technology strategy": "Strategy",
  
  // ERP & Enterprise Systems
  "erp systems": "Enterprise Systems",
  "erp": "Enterprise Systems",
  "enterprise resource planning": "Enterprise Systems",
  "hris": "Enterprise Systems",
  "hr information systems": "Enterprise Systems",
  "hr systems": "Enterprise Systems",
  "hrms": "Enterprise Systems",
  "hcm": "Enterprise Systems",
  "human capital management": "Enterprise Systems",
  
  // Innovation & Research
  "innovation": "Innovation",
  "innovation management": "Innovation",
  "r&d": "Innovation",
  "research and development": "Innovation",
  "emerging technologies": "Innovation",
  "market research": "Market Research",
  "competitive intelligence": "Market Research",
  "industry analysis": "Market Research",
  "market analysis": "Market Research",
  
  // Operations
  "operations": "Operations",
  "supply chain management": "Operations",
  "logistics": "Operations",
  "operational excellence": "Operations",
  "process improvement": "Operations",
  
  // Finance
  "financial technology": "Finance",
  "fintech": "Finance",
  "financial services": "Finance",
  "finance": "Finance",
  
  // Compliance
  "compliance": "Compliance",
  "regulatory compliance": "Compliance",
  "gdpr": "Compliance",
  "data privacy": "Compliance",
  
  // Change Management
  "change management": "Change Management",
  "organizational change": "Change Management",
  "transformation": "Change Management",
  
  // Communications
  "communication": "Communication",
  "internal communication": "Communication",
  "collaboration": "Communication",
  
  // Technology categories
  "robotics": "Technology",
  "manufacturing technology": "Technology",
  "healthcare technology": "Technology",
  "retail technology": "Technology",
  "industry 4.0": "Technology"
}

function consolidateTopic(topic: string): string {
  const normalizedTopic = topic.toLowerCase().trim()
  return consolidationMap[normalizedTopic] || topic
}

function consolidateTopics(topics: string[]): string[] {
  if (!topics || topics.length === 0) return []
  
  // Map topics to consolidated versions
  const consolidated = topics.map(topic => consolidateTopic(topic))
  
  // Remove duplicates while preserving order
  const seen = new Set<string>()
  const unique = consolidated.filter(topic => {
    if (seen.has(topic.toLowerCase())) {
      return false
    }
    seen.add(topic.toLowerCase())
    return true
  })
  
  return unique
}

async function consolidateAndUpdateDatabase() {
  console.log('🔄 Consolidating Topics in Database')
  console.log('═'.repeat(50))
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Fetch all analysts with their topics
    console.log('📊 Fetching analysts and their topics...')
    const { data: analysts, error: fetchError } = await supabase
      .from('analysts')
      .select('id, name, covered_topics')
    
    if (fetchError) {
      console.error('❌ Error fetching analysts:', fetchError)
      return
    }

    if (!analysts || analysts.length === 0) {
      console.log('ℹ️  No analysts found')
      return
    }

    console.log(`📋 Found ${analysts.length} analysts`)

    // Collect all unique topics
    const allTopics = new Set<string>()
    let analystsWithTopics = 0
    
    analysts.forEach(analyst => {
      if (analyst.covered_topics && Array.isArray(analyst.covered_topics)) {
        analystsWithTopics++
        analyst.covered_topics.forEach((topic: string) => {
          if (topic && topic.trim()) {
            allTopics.add(topic.trim())
          }
        })
      }
    })

    const uniqueTopics = Array.from(allTopics).sort()
    console.log(`🔍 Found ${uniqueTopics.length} unique topics across ${analystsWithTopics} analysts`)

    // Show sample of current topics
    console.log('\n📋 Sample of current topics:')
    uniqueTopics.slice(0, 15).forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`)
    })
    if (uniqueTopics.length > 15) {
      console.log(`... and ${uniqueTopics.length - 15} more`)
    }

    // Apply consolidation
    console.log('\n🔄 Applying ChatGPT-style consolidation...')
    const consolidatedTopics = consolidateTopics(uniqueTopics)
    
    console.log('\n📈 Consolidation Results:')
    console.log('─'.repeat(50))
    console.log(`Original topics: ${uniqueTopics.length}`)
    console.log(`After consolidation: ${consolidatedTopics.length}`)
    console.log(`Reduction: ${uniqueTopics.length - consolidatedTopics.length} topics (${Math.round(((uniqueTopics.length - consolidatedTopics.length) / uniqueTopics.length) * 100)}% reduction)`)

    console.log('\n✨ Consolidated topics:')
    consolidatedTopics.forEach((topic, index) => {
      console.log(`${index + 1}. ${topic}`)
    })

    // Update each analyst's topics
    console.log('\n🔄 Updating analyst records...')
    let updatedCount = 0
    
    for (const analyst of analysts) {
      if (analyst.covered_topics && Array.isArray(analyst.covered_topics)) {
        const originalTopics = analyst.covered_topics
        const newTopics = consolidateTopics(originalTopics)
        
        // Only update if there's a change
        if (JSON.stringify(originalTopics.sort()) !== JSON.stringify(newTopics.sort())) {
          const { error: updateError } = await supabase
            .from('analysts')
            .update({ covered_topics: newTopics })
            .eq('id', analyst.id)
          
          if (updateError) {
            console.error(`❌ Error updating ${analyst.name}:`, updateError)
          } else {
            console.log(`✅ Updated ${analyst.name}: ${originalTopics.length} → ${newTopics.length} topics`)
            updatedCount++
          }
        }
      }
    }

    console.log('\n🎉 Consolidation Complete!')
    console.log('─'.repeat(50))
    console.log(`✅ Updated ${updatedCount} analyst records`)
    console.log(`✅ Reduced topics from ${uniqueTopics.length} to ${consolidatedTopics.length}`)
    console.log(`✅ ${Math.round(((uniqueTopics.length - consolidatedTopics.length) / uniqueTopics.length) * 100)}% reduction in topic count`)
    console.log('✅ Topics are now streamlined and consistent')
    console.log('\n🔄 Please refresh your UI to see the simplified topics!')

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the consolidation
consolidateAndUpdateDatabase().catch(console.error)
