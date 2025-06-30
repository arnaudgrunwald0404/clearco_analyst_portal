#!/usr/bin/env node

/**
 * Migration Script: Convert Twitter Handles to SocialHandle Records
 * 
 * This script migrates existing Twitter handles from the legacy `twitter` 
 * column in the Analyst table to the new SocialHandle table, which supports
 * multiple social media handles per analyst.
 * 
 * Usage:
 *   npx tsx scripts/migrate-twitter-handles.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Migrating existing Twitter handles to SocialHandle table...\n')

  try {
    // Get all analysts with Twitter handles
    const analystsWithTwitter = await prisma.analyst.findMany({
      where: {
        twitter: {
          not: null
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        twitter: true
      }
    })

    console.log(`📊 Found ${analystsWithTwitter.length} analysts with Twitter handles`)

    if (analystsWithTwitter.length === 0) {
      console.log('✅ No migration needed - no analysts have Twitter handles')
      return
    }

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const analyst of analystsWithTwitter) {
      try {
        // Check if SocialHandle already exists for this analyst/platform/handle
        const existing = await prisma.socialHandle.findFirst({
          where: {
            analystId: analyst.id,
            platform: 'TWITTER',
            handle: analyst.twitter!
          }
        })

        if (existing) {
          console.log(`⏭️  Skipping ${analyst.firstName} ${analyst.lastName} - SocialHandle already exists`)
          skipped++
          continue
        }

        // Create new SocialHandle record
        await prisma.socialHandle.create({
          data: {
            analystId: analyst.id,
            platform: 'TWITTER',
            handle: analyst.twitter!,
            displayName: `@${analyst.twitter}`,
            isActive: true
          }
        })

        console.log(`✅ Migrated: ${analyst.firstName} ${analyst.lastName} (@${analyst.twitter})`)
        migrated++

      } catch (error) {
        console.error(`❌ Failed to migrate ${analyst.firstName} ${analyst.lastName}:`, error)
        errors++
      }
    }

    console.log(`\n📊 Migration Summary:`)
    console.log(`   ✅ Migrated: ${migrated} handles`)
    console.log(`   ⏭️  Skipped: ${skipped} handles (already existed)`)
    console.log(`   ❌ Errors: ${errors} handles`)

    if (migrated > 0) {
      console.log(`\n💡 Next steps:`)
      console.log(`   1. Verify the migration was successful`)
      console.log(`   2. Update your social media crawler to use the new SocialHandle table`)
      console.log(`   3. Consider removing the legacy 'twitter' column after testing`)
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main().catch(console.error)
}

export { main }
