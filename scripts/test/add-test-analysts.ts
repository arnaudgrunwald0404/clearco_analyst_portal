#!/usr/bin/env node

/**
 * Add Test Analysts with Twitter Handles
 * 
 * This script adds some well-known HR tech analysts to the database
 * with their Twitter handles for testing the social media monitoring system.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const testAnalysts = [
  {
    firstName: 'Josh',
    lastName: 'Bersin',
    company: 'Josh Bersin Company',
    email: 'josh@joshbersin.com',
    influence: 'VERY_HIGH',
    twitter: 'joshbersin',
    status: 'ACTIVE',
    notes: 'Leading HR industry analyst and founder of the Josh Bersin Academy. Expert on workforce analytics, employee experience, and HR technology.'
  },
  {
    firstName: 'Jason',
    lastName: 'Averbook',
    company: 'Leapgen',
    email: 'jason@leapgen.com',
    influence: 'VERY_HIGH',
    twitter: 'jasonaverbook',
    status: 'ACTIVE',
    notes: 'Senior Partner and Global Leader of Digital HR Strategy at Leapgen. Expert on digital transformation and future of work.'
  },
  {
    firstName: 'Stacey',
    lastName: 'Harris',
    company: 'Unbridled Talent',
    email: 'stacey@unbridledtalent.com',
    influence: 'HIGH',
    twitter: 'staceyharris',
    status: 'ACTIVE',
    notes: 'Principal Analyst and founder of Unbridled Talent. Expert on workforce analytics and HR technology.'
  },
  {
    firstName: 'William',
    lastName: 'Tincup',
    company: 'RecruitingDaily',
    email: 'william@recruitingdaily.com',
    influence: 'HIGH',
    twitter: 'williamtincup',
    status: 'ACTIVE',
    notes: 'President of RecruitingDaily. Expert on talent acquisition technology and recruiting innovation.'
  },
  {
    firstName: 'Holger',
    lastName: 'Mueller',
    company: 'Constellation Research',
    email: 'holger@constellationr.com',
    influence: 'HIGH',
    twitter: 'holgermu',
    status: 'ACTIVE',
    notes: 'VP and Principal Analyst at Constellation Research. Expert on enterprise software and HR technology.'
  }
]

async function addTestAnalysts() {
  console.log('🚀 Adding test analysts with Twitter handles...')
  
  try {
    for (const analyst of testAnalysts) {
      // Check if analyst already exists
      const existing = await prisma.analyst.findFirst({
        where: {
          firstName: analyst.firstName,
          lastName: analyst.lastName
        }
      })
      
      if (existing) {
        console.log(`⏭️  Analyst ${analyst.firstName} ${analyst.lastName} already exists, updating...`)
        
        await prisma.analyst.update({
          where: { id: existing.id },
          data: {
            twitter: analyst.twitter,
            influence: analyst.influence as any,
            status: analyst.status as any,
            notes: analyst.notes
          }
        })
      } else {
        console.log(`✅ Adding ${analyst.firstName} ${analyst.lastName} (@${analyst.twitter})`)
        
        await prisma.analyst.create({
          data: {
            ...analyst,
            influence: analyst.influence as any,
            status: analyst.status as any
          }
        })
      }
    }
    
    console.log('\n📊 Test analysts summary:')
    const totalAnalysts = await prisma.analyst.count()
    const activeWithTwitter = await prisma.analyst.count({
      where: {
        status: 'ACTIVE',
        twitter: { not: null }
      }
    })
    
    console.log(`   - Total analysts: ${totalAnalysts}`)
    console.log(`   - Active with Twitter: ${activeWithTwitter}`)
    
    // Show the analysts we can monitor
    const monitoringAnalysts = await prisma.analyst.findMany({
      where: {
        status: 'ACTIVE',
        twitter: { not: null }
      },
      select: {
        firstName: true,
        lastName: true,
        twitter: true,
        influence: true
      }
    })
    
    console.log('\n🐦 Analysts ready for Twitter monitoring:')
    monitoringAnalysts.forEach(analyst => {
      console.log(`   - ${analyst.firstName} ${analyst.lastName} (@${analyst.twitter}) - ${analyst.influence}`)
    })
    
    console.log('\n✅ Test analysts added successfully!')
    console.log('Now you can run: npm run social:hourly')
    
  } catch (error) {
    console.error('❌ Error adding test analysts:', error)
    throw error
  }
}

async function main() {
  try {
    await addTestAnalysts()
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main()
}

export { addTestAnalysts }
