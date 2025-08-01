import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const topics = [
  // Core Topics (12) - These represent Clear Company's key strengths
  {
    name: 'Talent Acquisition',
    category: 'CORE' as const,
    description: 'Recruiting, hiring processes, candidate experience, and talent sourcing strategies',
    order: 1
  },
  {
    name: 'Employee Engagement',
    category: 'CORE' as const,
    description: 'Employee satisfaction, motivation, retention, and workplace culture initiatives',
    order: 2
  },
  {
    name: 'Performance Management',
    category: 'CORE' as const,
    description: 'Goal setting, performance reviews, feedback systems, and performance improvement',
    order: 3
  },
  {
    name: 'Learning & Development',
    category: 'CORE' as const,
    description: 'Training programs, skill development, career pathing, and leadership development',
    order: 4
  },
  {
    name: 'HR Analytics',
    category: 'CORE' as const,
    description: 'People analytics, workforce planning, HR metrics, and data-driven decision making',
    order: 5
  },
  {
    name: 'Compensation & Benefits',
    category: 'CORE' as const,
    description: 'Salary structures, benefits administration, total rewards, and pay equity',
    order: 6
  },
  {
    name: 'Employee Experience',
    category: 'CORE' as const,
    description: 'Employee journey, workplace experience, digital employee experience, and satisfaction',
    order: 7
  },
  {
    name: 'HR Technology',
    category: 'CORE' as const,
    description: 'HRIS, HCM platforms, HR software solutions, and digital transformation',
    order: 8
  },
  {
    name: 'Workplace Culture',
    category: 'CORE' as const,
    description: 'Organizational culture, values, cultural transformation, and culture measurement',
    order: 9
  },
  {
    name: 'Diversity & Inclusion',
    category: 'CORE' as const,
    description: 'DEI strategies, inclusive hiring, bias reduction, and belonging initiatives',
    order: 10
  },
  {
    name: 'Future of Work',
    category: 'CORE' as const,
    description: 'Remote work, hybrid models, digital transformation, and workforce evolution',
    order: 11
  },
  {
    name: 'Employee Communications',
    category: 'CORE' as const,
    description: 'Internal communications, employee feedback, surveys, and engagement platforms',
    order: 12
  },

  // Additional Topics (14) - Broader HR and business topics
  {
    name: 'Organizational Design',
    category: 'ADDITIONAL' as const,
    description: 'Org structure, team design, reporting relationships, and organizational effectiveness',
    order: 13
  },
  {
    name: 'Change Management',
    category: 'ADDITIONAL' as const,
    description: 'Organizational change, transformation management, and change communication',
    order: 14
  },
  {
    name: 'Leadership Development',
    category: 'ADDITIONAL' as const,
    description: 'Executive coaching, leadership training, succession planning, and leadership pipeline',
    order: 15
  },
  {
    name: 'Workforce Planning',
    category: 'ADDITIONAL' as const,
    description: 'Strategic workforce planning, skills forecasting, and talent pipeline management',
    order: 16
  },
  {
    name: 'HR Compliance',
    category: 'ADDITIONAL' as const,
    description: 'Employment law, regulatory compliance, policy management, and risk mitigation',
    order: 17
  },
  {
    name: 'Onboarding & Offboarding',
    category: 'ADDITIONAL' as const,
    description: 'New hire onboarding, employee transitions, and exit processes',
    order: 18
  },
  {
    name: 'Wellbeing & Mental Health',
    category: 'ADDITIONAL' as const,
    description: 'Employee wellness programs, mental health support, and work-life balance',
    order: 19
  },
  {
    name: 'Skills Management',
    category: 'ADDITIONAL' as const,
    description: 'Skills assessment, competency frameworks, and skills-based hiring',
    order: 20
  },
  {
    name: 'HR Operations',
    category: 'ADDITIONAL' as const,
    description: 'HR service delivery, process optimization, and operational efficiency',
    order: 21
  },
  {
    name: 'Employee Relations',
    category: 'ADDITIONAL' as const,
    description: 'Conflict resolution, grievance handling, and workplace relationship management',
    order: 22
  },
  {
    name: 'Artificial Intelligence in HR',
    category: 'ADDITIONAL' as const,
    description: 'AI applications in HR, machine learning, and intelligent automation',
    order: 23
  },
  {
    name: 'Global HR',
    category: 'ADDITIONAL' as const,
    description: 'International HR management, cross-cultural considerations, and global compliance',
    order: 24
  },
  {
    name: 'HR Strategy',
    category: 'ADDITIONAL' as const,
    description: 'Strategic HR planning, business alignment, and organizational strategy',
    order: 25
  },
  {
    name: 'Employee Advocacy',
    category: 'ADDITIONAL' as const,
    description: 'Employee brand ambassadorship, social advocacy, and employee-generated content',
    order: 26
  }
]

async function seedTopics() {
  console.log('🌱 Starting to seed predefined topics...')
  
  try {
    // Clear existing topics
    await prisma.predefinedTopic.deleteMany({})
    console.log('🗑️  Cleared existing topics')
    
    // Insert new topics
    for (const topic of topics) {
      await prisma.predefinedTopic.create({
        data: topic
      })
      console.log(`✅ Created ${topic.category.toLowerCase()} topic: ${topic.name}`)
    }
    
    console.log(`\n🎉 Successfully seeded ${topics.length} topics!`)
    
    // Summary
    const coreCount = topics.filter(t => t.category === 'CORE').length
    const additionalCount = topics.filter(t => t.category === 'ADDITIONAL').length
    
    console.log(`📊 Summary:`)
    console.log(`   • Core topics: ${coreCount}`)
    console.log(`   • Additional topics: ${additionalCount}`)
    console.log(`   • Total topics: ${topics.length}`)
    
  } catch (error) {
    console.error('❌ Error seeding topics:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run the seeder
if (require.main === module) {
  seedTopics()
    .then(() => {
      console.log('✨ Topic seeding completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Topic seeding failed:', error)
      process.exit(1)
    })
}

export default seedTopics
