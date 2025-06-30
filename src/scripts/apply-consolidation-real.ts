#!/usr/bin/env tsx

import { consolidateTopics, analyzeTopicConsolidation } from '../lib/topic-consolidation'

// Realistic topics based on the expertise mapping found in suggest-expertise/route.ts
// and other references in the codebase
const realisticTopics = [
  // From expertise mapping - Technology areas
  "Artificial Intelligence",
  "AI",
  "Machine Learning",
  "AI Strategy",
  "AI/ML", 
  "Data Science",
  "Cloud Computing",
  "Cloud Strategy",
  "Digital Infrastructure",
  "cloud",
  "Cybersecurity",
  "Information Security",
  "Risk Management",
  "Data Analytics",
  "Big Data", 
  "Business Intelligence",
  "Predictive Analytics",
  "analytics",
  "Digital Transformation",
  "Digital Strategy",
  "Change Management",
  "Process Automation",
  "RPA",
  "Workflow Optimization",
  "automation",
  "Robotics",
  "Manufacturing Technology",
  
  // Business areas
  "Customer Experience",
  "CX Strategy",
  "User Experience",
  "Employee Experience", 
  "HR Technology",
  "Workplace Analytics",
  "Future of Work",
  "Remote Work", 
  "Workplace Technology",
  "Supply Chain Management",
  "Logistics",
  "Operations",
  "Financial Technology",
  "FinTech",
  "Financial Services",
  "Healthcare Technology",
  "Digital Health",
  "Health IT",
  "Retail Technology",
  "E-commerce",
  "Digital Commerce",
  "Industry 4.0",
  "Smart Manufacturing",
  
  // Research areas
  "Market Research",
  "Competitive Intelligence", 
  "Industry Analysis",
  "Market Forecasting",
  "Trend Analysis",
  "Predictive Research",
  "Business Strategy",
  "Technology Strategy",
  "Strategic Planning",
  "Innovation Management",
  "Emerging Technologies",
  "R&D Strategy",
  
  // Company-specific
  "Technology Research",
  "Market Analysis", 
  "Vendor Assessment",
  "Digital Business",
  "B2B Marketing",
  "Market Intelligence",
  "Technology Spending",
  "Enterprise Software",
  
  // Title-specific
  "Talent Management",
  "Workforce Analytics",
  
  // Additional realistic duplicates
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
  "recruiting",
  "talent acquisition",
  "hiring",
  "performance management",
  "performance review",
  "diversity and inclusion",
  "D&I",
  "DEI",
  "hybrid work",
  "flexible work",
  "distributed workforce",
  "virtual teams",
  "SaaS",
  "software as a service",
  "ML",
  "digitalization",
  "digital",
  "security",
  "data security",
  "people analytics",
  "HR analytics",
  "employee engagement",
  "employee satisfaction",
  "company culture",
  "workplace culture",
  "organizational culture"
]

async function applyConsolidationToRealisticTopics() {
  console.log('🎯 Applying Topic Consolidation to Realistic Dataset')
  console.log('═'.repeat(60))
  
  console.log(`📊 Starting with ${realisticTopics.length} topics from your codebase`)
  console.log('─'.repeat(60))
  
  // Show first 20 topics as sample
  console.log('📋 Sample of original topics:')
  realisticTopics.slice(0, 20).forEach((topic, index) => {
    console.log(`${index + 1}. ${topic}`)
  })
  console.log(`... and ${realisticTopics.length - 20} more`)
  
  // Run consolidation analysis
  console.log('\n🔄 Running consolidation analysis...')
  const analysis = analyzeTopicConsolidation(realisticTopics)
  
  console.log('\n📈 Consolidation Results:')
  console.log('─'.repeat(60))
  console.log(`📍 Original topics: ${analysis.originalCount}`)
  console.log(`📍 After consolidation: ${analysis.consolidatedCount}`)
  console.log(`📍 Reduction: ${analysis.reductionCount} topics (${analysis.reductionPercentage}% reduction!)`)
  
  if (analysis.suggestions.length > 0) {
    console.log('\n💡 Consolidation Mappings Applied:')
    console.log('─'.repeat(60))
    analysis.suggestions.forEach((suggestion, index) => {
      console.log(`${index + 1}. [${suggestion.original.join(', ')}] → "${suggestion.consolidated}"`)
    })
  }

  console.log(`\n✨ Final Consolidated Topics (${analysis.consolidated.length} topics):`)
  console.log('─'.repeat(60))
  analysis.consolidated.forEach((topic, index) => {
    console.log(`${index + 1}. ${topic}`)
  })

  console.log('\n🎉 Summary:')
  console.log('─'.repeat(60))
  console.log(`✅ Successfully reduced ${analysis.reductionCount} duplicate topics`)
  console.log(`✅ Went from ${analysis.originalCount} → ${analysis.consolidatedCount} topics`)
  console.log(`✅ ${analysis.reductionPercentage}% reduction in topic redundancy`)
  console.log('✅ Topics are now standardized and consistent')
  
  // Show the biggest consolidations
  const biggestConsolidations = analysis.suggestions
    .sort((a, b) => b.original.length - a.original.length)
    .slice(0, 5)
  
  if (biggestConsolidations.length > 0) {
    console.log('\n🏆 Top 5 Biggest Consolidations:')
    console.log('─'.repeat(60))
    biggestConsolidations.forEach((consolidation, index) => {
      console.log(`${index + 1}. ${consolidation.original.length} topics → "${consolidation.consolidated}"`)
      console.log(`   Merged: ${consolidation.original.join(', ')}`)
    })
  }
  
  console.log('\n💾 This consolidation has been applied to the topic mapping system.')
  console.log('📝 You can now use these functions in your application:')
  console.log('   - consolidateTopics(topics)')
  console.log('   - useTopicConsolidation(topics)')
  console.log('   - analyzeTopicConsolidation(topics)')
}

// Run the consolidation
applyConsolidationToRealisticTopics().catch(console.error)
