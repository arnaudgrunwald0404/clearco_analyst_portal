#!/usr/bin/env node

/**
 * Add Social Media Handles to Analysts
 * 
 * This script allows you to add multiple social media handles to analysts.
 * It supports Twitter, LinkedIn, and other platforms.
 * 
 * Usage:
 *   npx tsx scripts/add-social-handles.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface SocialHandleInput {
  analystEmail: string
  platform: 'TWITTER' | 'LINKEDIN' | 'MEDIUM' | 'BLOG' | 'OTHER'
  handle: string
  displayName?: string
}

// Sample handles to add (you can modify this)
const socialHandlesToAdd: SocialHandleInput[] = [
  // Josh Bersin - multiple Twitter handles
  {
    analystEmail: 'josh.bersin@bersinacademy.com',
    platform: 'TWITTER',
    handle: 'joshbersin',
    displayName: '@joshbersin'
  },
  {
    analystEmail: 'josh.bersin@bersinacademy.com',
    platform: 'TWITTER',
    handle: 'bersinacademy',
    displayName: '@bersinacademy'
  },
  {
    analystEmail: 'josh.bersin@bersinacademy.com',
    platform: 'LINKEDIN',
    handle: 'joshbersin',
    displayName: 'Josh Bersin'
  },
  
  // Jason Averbook
  {
    analystEmail: 'jason.averbook@leapgen.com',
    platform: 'TWITTER',
    handle: 'jasonaverbook',
    displayName: '@jasonaverbook'
  },
  {
    analystEmail: 'jason.averbook@leapgen.com',
    platform: 'TWITTER',
    handle: 'leapgen',
    displayName: '@leapgen'
  },
  {
    analystEmail: 'jason.averbook@leapgen.com',
    platform: 'LINKEDIN',
    handle: 'jasonaverbook',
    displayName: 'Jason Averbook'
  },
  
  // Kathi Enderes
  {
    analystEmail: 'kathi.enderes@deloitte.com',
    platform: 'TWITTER',
    handle: 'kendered',
    displayName: '@kendered'
  },
  {
    analystEmail: 'kathi.enderes@deloitte.com',
    platform: 'TWITTER',
    handle: 'DeloitteHC',
    displayName: '@DeloitteHC'
  },
  
  // Meghan Biro
  {
    analystEmail: 'meghan.biro@talentculture.com',
    platform: 'TWITTER',
    handle: 'MeghanMBiro',
    displayName: '@MeghanMBiro'
  },
  {
    analystEmail: 'meghan.biro@talentculture.com',
    platform: 'TWITTER',
    handle: 'TalentCulture',
    displayName: '@TalentCulture'
  },
  
  // Holger Mueller
  {
    analystEmail: 'holger.mueller@constellationresearch.com',
    platform: 'TWITTER',
    handle: 'holgermu',
    displayName: '@holgermu'
  },
  {
    analystEmail: 'holger.mueller@constellationresearch.com',
    platform: 'TWITTER',
    handle: 'constellationr',
    displayName: '@constellationr'
  }
]

async function main() {
  console.log('🔄 Adding multiple social media handles to analysts...\n')

  let added = 0
  let skipped = 0
  let errors = 0

  for (const socialHandle of socialHandlesToAdd) {
    try {
      // Find the analyst by email
      const analyst = await prisma.analyst.findUnique({
        where: { email: socialHandle.analystEmail },
        select: { id: true, firstName: true, lastName: true }
      })

      if (!analyst) {
        console.log(`❌ Analyst not found: ${socialHandle.analystEmail}`)
        errors++
        continue
      }

      // Check if this handle already exists
      const existing = await prisma.socialHandle.findFirst({
        where: {
          analystId: analyst.id,
          platform: socialHandle.platform,
          handle: socialHandle.handle
        }
      })

      if (existing) {
        console.log(`⏭️  Skipping ${analyst.firstName} ${analyst.lastName} - ${socialHandle.platform}:${socialHandle.handle} already exists`)
        skipped++
        continue
      }

      // Add the social handle
      await prisma.socialHandle.create({
        data: {
          analystId: analyst.id,
          platform: socialHandle.platform,
          handle: socialHandle.handle,
          displayName: socialHandle.displayName || socialHandle.handle,
          isActive: true
        }
      })

      console.log(`✅ Added: ${analyst.firstName} ${analyst.lastName} - ${socialHandle.platform}:${socialHandle.handle}`)
      added++

    } catch (error) {
      console.error(`❌ Failed to add ${socialHandle.analystEmail} - ${socialHandle.platform}:${socialHandle.handle}:`, error)
      errors++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Added: ${added} handles`)
  console.log(`   ⏭️  Skipped: ${skipped} handles (already existed)`)
  console.log(`   ❌ Errors: ${errors} handles`)

  // Show current distribution
  console.log(`\n📱 Current Social Handle Distribution:`)
  
  const handleStats = await prisma.socialHandle.groupBy({
    by: ['platform'],
    _count: {
      platform: true
    },
    orderBy: {
      _count: {
        platform: 'desc'
      }
    }
  })

  handleStats.forEach(stat => {
    console.log(`   ${stat.platform}: ${stat._count.platform} handles`)
  })

  // Show analysts with multiple handles
  console.log(`\n👥 Analysts with Multiple Handles:`)
  
  const analystsWithHandles = await prisma.analyst.findMany({
    include: {
      socialHandles: {
        where: { isActive: true },
        select: {
          platform: true,
          handle: true,
          displayName: true
        }
      }
    },
    where: {
      socialHandles: {
        some: {}
      }
    }
  })

  analystsWithHandles.forEach(analyst => {
    if (analyst.socialHandles.length > 0) {
      console.log(`   ${analyst.firstName} ${analyst.lastName}: ${analyst.socialHandles.length} handles`)
      analyst.socialHandles.forEach(handle => {
        console.log(`     - ${handle.platform}: ${handle.handle}`)
      })
    }
  })

  await prisma.$disconnect()
}

if (require.main === module) {
  main().catch(console.error)
}

export { main }
