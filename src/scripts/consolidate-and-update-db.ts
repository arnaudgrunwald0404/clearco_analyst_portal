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

// Clear Company-focused consolidation - preserving core expertise areas
const consolidationMap: Record<string, string> = {
  // CLEAR COMPANY CORE AREAS - KEEP SEPARATE
  
  // Sourcing - keep separate
  "sourcing": "Sourcing",
  "candidate sourcing": "Sourcing",
  "talent sourcing": "Sourcing",
  "recruiting sourcing": "Sourcing",
  
  // CRM/Candidate Relationship Management - keep separate
  "crm": "CRM/Candidate Relationship Management",
  "candidate relationship management": "CRM/Candidate Relationship Management",
  "candidate crm": "CRM/Candidate Relationship Management",
  "recruiting crm": "CRM/Candidate Relationship Management",
  "talent crm": "CRM/Candidate Relationship Management",
  
  // Talent Acquisition - keep separate (core Clear Company strength)
  "talent acquisition": "Talent Acquisition",
  "recruiting": "Talent Acquisition",
  "recruitment": "Talent Acquisition", 
  "hiring": "Talent Acquisition",
  "recruiting strategies": "Talent Acquisition",
  "recruiting technology": "Talent Acquisition",
  "recruitment marketing": "Talent Acquisition",
  "recruitment process outsourcing (rpo)": "Talent Acquisition",
  
  // Background Checks - keep separate if found
  "background checks": "Background Checks",
  "background screening": "Background Checks",
  "pre-employment screening": "Background Checks",
  
  // Onboarding - keep separate (core Clear Company strength)
  "onboarding": "Onboarding",
  "employee onboarding": "Onboarding",
  "new hire onboarding": "Onboarding",
  "preboarding": "Onboarding",
  
  // Talent Management - keep separate (core Clear Company strength)
  "talent management": "Talent Management",
  "and talent management": "Talent Management",
  "talent analytics": "Talent Management",
  "talent marketplace": "Talent Management",
  "talent transformation": "Talent Management",
  "talent": "Talent Management",
  
  // Performance Management - keep separate (core Clear Company strength)
  "performance management": "Performance Management",
  "performance": "Performance Management",
  "performance review": "Performance Management",
  "performance evaluation": "Performance Management",
  
  // Compensation Management - keep separate (core Clear Company strength)
  "compensation management": "Compensation Management",
  "compensation": "Compensation Management",
  "pay": "Compensation Management",
  "salary management": "Compensation Management",
  "rewards": "Compensation Management",
  "total rewards": "Compensation Management",
  "pay trends": "Compensation Management",
  "total rewards marketing": "Compensation Management",
  
  // Learning and Development - keep separate (core Clear Company strength)
  "learning & development": "Learning & Development",
  "learning and development": "Learning & Development",
  "learning & development (l&d)": "Learning & Development",
  "learning and performance": "Learning & Development",
  "l&d": "Learning & Development",
  "training": "Learning & Development",
  "employee training": "Learning & Development",
  "professional development": "Learning & Development",
  "skill development": "Learning & Development",
  "learning management systems": "Learning & Development",
  "lms": "Learning & Development",
  "e-learning": "Learning & Development",
  "digital learning strategy & technology": "Learning & Development",
  "corporate learning": "Learning & Development",
  "education technology": "Learning & Development",
  "learning technology": "Learning & Development",
  
  // People Analytics - keep separate (core Clear Company strength)
  "people analytics": "People Analytics",
  "hr analytics": "People Analytics",
  "workforce analytics": "People Analytics",
  
  // OTHER CONSOLIDATIONS (not core Clear Company areas)
  
  // AI/ML consolidation
  "ai in hr": "AI & Machine Learning",
  "ai in the workplace": "AI & Machine Learning",
  "artificial intelligence in hr": "AI & Machine Learning",
  "artificial intelligence": "AI & Machine Learning",
  "ai": "AI & Machine Learning",
  "machine learning": "AI & Machine Learning",
  "ml": "AI & Machine Learning",
  
  // HCM/Enterprise Systems
  "cloud hcm suites": "Enterprise Systems",
  "human capital management (hcm)": "Enterprise Systems",
  "human capital management (hcm) technology": "Enterprise Systems",
  "human capital management technologies": "Enterprise Systems",
  "and human capital management": "Enterprise Systems",
  "enterprise resource planning (erp)": "Enterprise Systems",
  "enterprise software implementation": "Enterprise Systems",
  "enterprise technology": "Enterprise Systems",
  "global employer of record (eor) services": "Enterprise Systems",
  "payroll services": "Enterprise Systems",
  
  // Employee Experience consolidation
  "employee experience management": "Employee Experience",
  "employee productivity": "Employee Experience",
  "employer brand strategy": "Employee Experience",
  "employee benefits": "Employee Experience",
  "health and benefits information": "Employee Experience",
  "wellness": "Employee Experience",
  
  // HR Technology variants
  "hr tech industry trends": "HR Technology",
  "hr tech vc investment": "HR Technology",
  "hr technology marketing": "HR Technology",
  "hr technology strategy": "HR Technology",
  "hr technology transformation": "HR Technology",
  "hris • digital strategy • hr transformation • talent management • hr tech": "HR Technology",
  "venture capital in hr tech": "HR Technology",
  
  // HR Strategy variants
  "hcm strategy": "HR Strategy",
  "hr content strategy": "HR Strategy",
  "hr innovation": "HR Strategy",
  "hr outsourcing": "HR Strategy",
  "hr software consulting": "HR Strategy",
  
  // Leadership variants
  "leadership in education": "Leadership",
  "executive branding": "Leadership",
  
  // Digital Workplace/Transformation
  "digital workplace": "Digital Transformation",
  "digital learning strategy & technology": "Learning & Development",
  
  // Customer Experience variants
  "customer experience in hr tech": "Customer Experience",
  
  // Communication variants
  "content management": "Communication",
  "strategic communications": "Communication",
  
  // Diversity & Inclusion variants
  "and inclusion": "Diversity & Inclusion",
  "social mobility": "Diversity & Inclusion",
  
  // Organizational Design
  "organization design": "Organizational Design",
  "organizational design": "Organizational Design",
  
  // Workforce/Future of Work variants
  "workforce development": "Future of Work",
  "workforce ecosystems": "Future of Work",
  "workforce strategy": "Future of Work",
  "workforce trends": "Future of Work",
  
  // Market Analysis variants
  "labour market analysis": "Market Research",
  "solution provider market": "Market Research",
  
  // Investment & Sales
  "investment strategies": "Investment & Finance",
  "private equity": "Investment & Finance",
  "sales enablement": "Sales Strategy",
  "sales strategy": "Sales Strategy",
  
  // Cloud & Technology
  "cloud computing": "Cloud Technology",
  "cloud": "Cloud Technology",
  "cloud strategy": "Cloud Technology",
  
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
  
  try {
    // Fetch all analysts with their topics
    console.log('📊 Fetching analysts and their topics...')
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
      if (analyst.coveredTopics && Array.isArray(analyst.coveredTopics)) {
        const originalTopics = analyst.coveredTopics.map((t) => t.topic)
        const newTopics = consolidateTopics(originalTopics)
        
        // Only update if there's a change
        if (JSON.stringify(originalTopics.sort()) !== JSON.stringify(newTopics.sort())) {
          // Delete existing topics for this analyst
          await prisma.analystCoveredTopic.deleteMany({
            where: { analystId: analyst.id }
          })
          
          // Insert new consolidated topics
          const topicInserts = newTopics.map(topic => ({
            analystId: analyst.id,
            topic: topic
          }))
          
          await prisma.analystCoveredTopic.createMany({
            data: topicInserts
          })
          
          console.log(`✅ Updated ${analyst.firstName} ${analyst.lastName}: ${originalTopics.length} → ${newTopics.length} topics`)
          updatedCount++
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
  } finally {
    await prisma.$disconnect()
  }
}

// Run the consolidation
consolidateAndUpdateDatabase().catch(console.error)
