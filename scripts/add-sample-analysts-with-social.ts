#!/usr/bin/env node

/**
 * Add Sample Analysts with Social Media Handles
 * 
 * This script adds a few sample industry analysts with their Twitter handles
 * to test the social media initialization and crawling functionality.
 * 
 * Usage:
 *   npx tsx scripts/add-sample-analysts-with-social.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SampleAnalyst {
  firstName: string
  lastName: string
  company: string
  title: string
  bio: string
  twitter: string
  keyThemes: string
  influence: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW'
  influenceScore: number
}

// Sample HR industry analysts with real Twitter handles (for testing purposes)
const sampleAnalysts: SampleAnalyst[] = [
  {
    firstName: 'Josh',
    lastName: 'Bersin',
    company: 'Bersin Academy',
    title: 'Global Industry Analyst',
    bio: 'Global HR industry analyst, author, and thought leader focused on corporate learning, talent management, and HR technology.',
    twitter: 'joshbersin',
    keyThemes: 'HR Technology, Learning and Development, Talent Management, Employee Experience',
    influence: 'VERY_HIGH',
    influenceScore: 95
  },
  {
    firstName: 'Jason',
    lastName: 'Averbook',
    company: 'Leapgen',
    title: 'CEO and Co-Founder',
    bio: 'Global thought leader in HR transformation and technology, helping organizations navigate the future of work.',
    twitter: 'jasonaverbook',
    keyThemes: 'HR Transformation, Future of Work, Digital HR, Employee Experience',
    influence: 'VERY_HIGH',
    influenceScore: 92
  },
  {
    firstName: 'Kathi',
    lastName: 'Enderes',
    company: 'Deloitte',
    title: 'Vice President, Future of Work',
    bio: 'Research leader focused on the future of work, HR technology, and organizational design.',
    twitter: 'kendered',
    keyThemes: 'Future of Work, HR Analytics, Organizational Design, Workforce Planning',
    influence: 'HIGH',
    influenceScore: 85
  },
  {
    firstName: 'Meghan',
    lastName: 'Biro',
    company: 'TalentCulture',
    title: 'CEO',
    bio: 'HR analyst and brand strategist focused on talent acquisition, employer branding, and workplace culture.',
    twitter: 'MeghanMBiro',
    keyThemes: 'Talent Acquisition, Employer Branding, Workplace Culture, Social Recruiting',
    influence: 'HIGH',
    influenceScore: 82
  },
  {
    firstName: 'Holger',
    lastName: 'Mueller',
    company: 'Constellation Research',
    title: 'VP and Principal Analyst',
    bio: 'Enterprise software analyst covering HR technology, ERP, and digital transformation.',
    twitter: 'holgermu',
    keyThemes: 'HR Technology, Enterprise Software, Digital Transformation, Cloud Computing',
    influence: 'HIGH',
    influenceScore: 80
  }
]

async function main() {
  console.log('🔄 Adding sample analysts with social media handles...\n')

  let addedCount = 0
  let skippedCount = 0

  for (const analyst of sampleAnalysts) {
    try {
      // Check if analyst already exists
      const existing = await prisma.analyst.findFirst({
        where: {
          firstName: analyst.firstName,
          lastName: analyst.lastName
        }
      })

      if (existing) {
        console.log(`⏭️  Skipping ${analyst.firstName} ${analyst.lastName} - already exists`)
        skippedCount++
        continue
      }

      // Create the analyst
      const created = await prisma.analyst.create({
        data: {
          firstName: analyst.firstName,
          lastName: analyst.lastName,
          email: `${analyst.firstName.toLowerCase()}.${analyst.lastName.toLowerCase()}@${analyst.company.toLowerCase().replace(' ', '')}.com`,
          company: analyst.company,
          title: analyst.title,
          bio: analyst.bio,
          twitter: analyst.twitter,
          keyThemes: analyst.keyThemes,
          influence: analyst.influence,
          influenceScore: analyst.influenceScore,
          status: 'ACTIVE',
          lastContactDate: new Date(),
          nextContactDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      })

      console.log(`✅ Added: ${analyst.firstName} ${analyst.lastName} (@${analyst.twitter})`)
      addedCount++

    } catch (error) {
      console.error(`❌ Failed to add ${analyst.firstName} ${analyst.lastName}:`, error)
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Added: ${addedCount} analysts`)
  console.log(`   ⏭️  Skipped: ${skippedCount} analysts (already existed)`)

  if (addedCount > 0) {
    console.log(`\n💡 Next steps:`)
    console.log(`   1. Run the social media history initialization:`)
    console.log(`      npm run social:init-history`)
    console.log(`   2. Set up API keys in .env file for actual crawling:`)
    console.log(`      TWITTER_BEARER_TOKEN=your_token_here`)
    console.log(`   3. Monitor the results in your application`)
  }

  await prisma.$disconnect()
}

if (require.main === module) {
  main().catch(console.error)
}

export { main }
