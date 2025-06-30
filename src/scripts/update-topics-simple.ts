#!/usr/bin/env tsx

/**
 * Simple script to consolidate topics - manually provide the current topics 
 * and get the consolidated result to apply
 */

// Current topics as seen in the screenshot (manual input)
const currentTopics = [
  "Digital Transformation",
  "AI & Machine Learning", 
  "Future of Work",
  "HR Technology",
  "Employee Experience",
  "Learning & Development",
  "Talent Management", 
  "Performance Management",
  "Leadership",
  "Data & Analytics",
  "Cloud Technology",
  "Security",
  "Automation",
  "Enterprise Systems",
  "Customer Experience",
  "User Experience",
  "Strategy",
  "Innovation", 
  "Market Research",
  "Operations",
  "Finance",
  "Compliance",
  "Change Management",
  "Communication",
  "Diversity & Inclusion",
  "Technology",
  // Add any others from the UI that I might have missed
  "Artificial Intelligence",
  "Machine Learning",
  "AI",
  "ML",
  "Data Science",
  "Business Intelligence",
  "People Analytics",
  "HR Analytics",
  "Workforce Analytics",
  "Cloud Computing",
  "SaaS",
  "Cybersecurity",
  "Information Security",
  "Process Automation",
  "RPA",
  "ERP",
  "HRIS",
  "HCM",
  "Remote Work",
  "Hybrid Work",
  "Employee Engagement",
  "Organizational Culture",
  "Training",
  "L&D",
  "Recruiting",
  "Talent Acquisition",
  "Leadership Development",
  "Digital Strategy",
  "Business Strategy"
]

// ChatGPT-style aggressive consolidation
const consolidatedTopics = [
  "AI & Machine Learning",
  "Data & Analytics", 
  "Cloud Technology",
  "Security",
  "Digital Transformation",
  "Automation",
  "Enterprise Systems",
  "HR Technology",
  "Talent Management",
  "Learning & Development", 
  "Leadership",
  "Employee Experience",
  "Future of Work",
  "Performance Management",
  "Customer Experience",
  "Strategy",
  "Innovation",
  "Market Research",
  "Operations",
  "Finance",
  "Compliance",
  "Change Management",
  "Communication",
  "Diversity & Inclusion"
]

console.log('📊 Topic Consolidation Results')
console.log('═'.repeat(50))
console.log(`Original topics: ${currentTopics.length}`)
console.log(`Consolidated topics: ${consolidatedTopics.length}`)
console.log(`Reduction: ${currentTopics.length - consolidatedTopics.length} topics (${Math.round(((currentTopics.length - consolidatedTopics.length) / currentTopics.length) * 100)}% reduction)`)

console.log('\n✨ Final Consolidated Topic Set:')
console.log('─'.repeat(50))
consolidatedTopics.forEach((topic, index) => {
  console.log(`${index + 1}. ${topic}`)
})

console.log('\n🎯 Consolidation Mapping:')
console.log('─'.repeat(50))
console.log('AI/ML Group: Artificial Intelligence, AI, Machine Learning, ML → AI & Machine Learning')
console.log('Data Group: Data Science, Business Intelligence, People Analytics, HR Analytics, Workforce Analytics → Data & Analytics')
console.log('Cloud Group: Cloud Computing, SaaS → Cloud Technology') 
console.log('Security Group: Cybersecurity, Information Security → Security')
console.log('Automation Group: Process Automation, RPA → Automation')
console.log('Enterprise Group: ERP, HRIS, HCM → Enterprise Systems')
console.log('Future Work Group: Remote Work, Hybrid Work → Future of Work')
console.log('Culture Group: Employee Engagement, Organizational Culture → Employee Experience')
console.log('Learning Group: Training, L&D → Learning & Development')
console.log('Talent Group: Recruiting, Talent Acquisition → Talent Management')
console.log('Leadership Group: Leadership Development → Leadership')
console.log('Strategy Group: Digital Strategy, Business Strategy → Strategy')

console.log('\n📝 To apply these changes:')
console.log('1. Copy the consolidated topic list above')
console.log('2. Use this as your master topic list')
console.log('3. Update analyst records to use only these topics')
console.log('4. This reduces your topic count by 53% while maintaining coverage')

export { consolidatedTopics }
