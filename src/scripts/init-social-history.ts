#!/usr/bin/env node

/**
 * One-Time Social Media History Initialization Script
 * 
 * This script performs a comprehensive 7-day historical crawl to build
 * the initial social media post history for all industry analysts.
 * 
 * Features:
 * - Crawls past 7 days of posts for all analysts with social handles
 * - Builds comprehensive initial dataset for analysis
 * - Processes and analyzes all discovered posts
 * - Provides detailed statistics and progress reporting
 * - Safe to run multiple times (prevents duplicates)
 * 
 * Usage:
 *   node src/scripts/init-social-history.ts
 *   or
 *   npm run social:init-history
 * 
 * Environment Variables Required:
 *   - DATABASE_URL
 *   - TWITTER_BEARER_TOKEN (optional but recommended)
 *   - LINKEDIN_ACCESS_TOKEN (optional but recommended)
 */

import { PrismaClient } from '@prisma/client'
import { SocialMediaCrawler } from '../lib/social-crawler/crawler'

const prisma = new PrismaClient()

interface InitializationStats {
  totalAnalysts: number
  analystsWithHandles: number
  platformsProcessed: string[]
  totalPostsFound: number
  totalPostsStored: number
  duplicatesSkipped: number
  irrelevantPostsSkipped: number
  failedAnalysts: number
  averageRelevanceScore: number
  topThemes: Array<{ theme: string; count: number }>
  processingTimeMs: number
  errors: Array<{ analyst: string; platform: string; error: string }>
}

async function main() {
  console.log('🚀 Starting One-Time Social Media History Initialization')
  console.log('=====================================\n')
  console.log(`⏰ Started at: ${new Date().toISOString()}`)
  console.log(`📅 Building history for past 7 days\n`)

  const startTime = Date.now()
  const stats: InitializationStats = {
    totalAnalysts: 0,
    analystsWithHandles: 0,
    platformsProcessed: [],
    totalPostsFound: 0,
    totalPostsStored: 0,
    duplicatesSkipped: 0,
    irrelevantPostsSkipped: 0,
    failedAnalysts: 0,
    averageRelevanceScore: 0,
    topThemes: [],
    processingTimeMs: 0,
    errors: []
  }

  try {
    // Check environment and prerequisites
    await checkPrerequisites()

    // Initialize crawler
    console.log('🔧 Initializing social media crawler...')
    const crawler = new SocialMediaCrawler(prisma)

    // Get all analysts
    const allAnalysts = await getAllAnalysts()
    stats.totalAnalysts = allAnalysts.length
    console.log(`📊 Total analysts in database: ${stats.totalAnalysts}`)

    if (stats.totalAnalysts === 0) {
      console.log('⚠️  No analysts found in database. Please add analysts first.')
      console.log('💡 You can use: npm run add-test-analysts')
      return
    }

    // Get analysts with social handles
    const analystsWithHandles = await getAnalystsWithSocialHandles()
    stats.analystsWithHandles = analystsWithHandles.length
    console.log(`🔗 Analysts with social handles: ${stats.analystsWithHandles}`)

    if (stats.analystsWithHandles === 0) {
      console.log('⚠️  No analysts have social media handles configured.')
      console.log('💡 Add Twitter handles to analyst profiles to enable crawling.')
      return
    }

    // Show platform distribution
    const platformCounts = countPlatforms(analystsWithHandles)
    console.log('\n📱 Platform Distribution:')
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`   ${platform}: ${count} analysts`)
      if (!stats.platformsProcessed.includes(platform)) {
        stats.platformsProcessed.push(platform)
      }
    })

    // Calculate lookback date (7 days ago)
    const lookbackDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    console.log(`\n📅 Crawling posts since: ${lookbackDate.toISOString()}`)

    // Process each analyst
    console.log(`\n🔄 Processing ${stats.analystsWithHandles} analysts...\n`)
    
    let processedCount = 0
    const relevanceScores: number[] = []

    for (const analyst of analystsWithHandles) {
      processedCount++
      console.log(`[${processedCount}/${stats.analystsWithHandles}] Processing: ${analyst.firstName} ${analyst.lastName}`)
      
      // Process each social handle for this analyst
      for (const handle of analyst.handles) {
        try {
          console.log(`   🔍 Crawling ${handle.platform}: ${handle.handle}`)
          
          const result = await crawlAnalystHistory(
            crawler, 
            analyst.id, 
            handle, 
            lookbackDate
          )
          
          stats.totalPostsFound += result.postsFound
          stats.totalPostsStored += result.postsStored
          stats.duplicatesSkipped += result.duplicatesSkipped
          stats.irrelevantPostsSkipped += result.irrelevantSkipped
          
          relevanceScores.push(...result.relevanceScores)
          
          console.log(`   ✅ Found: ${result.postsFound}, Stored: ${result.postsStored}, Skipped: ${result.duplicatesSkipped + result.irrelevantSkipped}`)
          
          // Rate limiting delay
          await sleep(3000) // 3 second delay between handles
          
        } catch (error) {
          stats.failedAnalysts++
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          stats.errors.push({
            analyst: `${analyst.firstName} ${analyst.lastName}`,
            platform: handle.platform,
            error: errorMsg
          })
          console.log(`   ❌ Failed: ${errorMsg}`)
        }
      }
      
      // Longer delay between analysts
      if (processedCount < stats.analystsWithHandles) {
        console.log('   ⏳ Waiting 5 seconds before next analyst...\n')
        await sleep(5000)
      }
    }

    // Calculate final statistics
    stats.averageRelevanceScore = relevanceScores.length > 0 
      ? Math.round(relevanceScores.reduce((a, b) => a + b, 0) / relevanceScores.length)
      : 0

    // Get trending themes
    console.log('\n🔄 Analyzing themes...')
    stats.topThemes = await crawler.getTrendingThemes(7)

    stats.processingTimeMs = Date.now() - startTime

    // Print final report
    await printFinalReport(stats)

    // Store initialization metadata
    await storeInitializationRecord(stats)

    console.log('\n✅ Social media history initialization completed successfully!')

  } catch (error) {
    console.error('\n❌ History initialization failed:', error)
    stats.errors.push({
      analyst: 'SYSTEM',
      platform: 'ALL',
      error: error instanceof Error ? error.message : 'Unknown system error'
    })
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...')
  
  // Check required environment variables
  const requiredEnvVars = ['DATABASE_URL']
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingVars)
    process.exit(1)
  }

  // Check optional API tokens
  const hasTwitter = !!process.env.TWITTER_BEARER_TOKEN
  const hasLinkedIn = !!process.env.LINKEDIN_ACCESS_TOKEN

  console.log(`   📱 Twitter API: ${hasTwitter ? '✅ Configured' : '⚠️  Not configured'}`)
  console.log(`   📱 LinkedIn API: ${hasLinkedIn ? '✅ Configured' : '⚠️  Not configured'}`)

  if (!hasTwitter && !hasLinkedIn) {
    console.log('⚠️  No social media API tokens configured. Crawling will be limited.')
  }

  // Test database connection
  try {
    await prisma.$connect()
    console.log('   💾 Database: ✅ Connected')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    process.exit(1)
  }

  console.log('✅ Prerequisites check passed\n')
}

async function getAllAnalysts() {
  return await prisma.analyst.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      status: true
    }
  })
}

async function getAnalystsWithSocialHandles() {
  const analysts = await prisma.analyst.findMany({
    where: {
      status: 'ACTIVE',
      socialHandles: {
        some: {
          isActive: true
        }
      }
    },
    include: {
      socialHandles: {
        where: {
          isActive: true
        },
        select: {
          platform: true,
          handle: true,
          displayName: true,
          lastCrawledAt: true
        }
      }
    }
  })

  return analysts.map(analyst => ({
    id: analyst.id,
    firstName: analyst.firstName,
    lastName: analyst.lastName,
    company: analyst.company,
    handles: analyst.socialHandles.map(socialHandle => ({
      platform: socialHandle.platform.toLowerCase() as 'twitter' | 'linkedin',
      handle: socialHandle.handle,
      displayName: socialHandle.displayName,
      lastCrawledAt: socialHandle.lastCrawledAt
    }))
  }))
}

function countPlatforms(analysts: any[]): Record<string, number> {
  const counts: Record<string, number> = {}
  
  analysts.forEach(analyst => {
    analyst.handles.forEach((handle: any) => {
      counts[handle.platform] = (counts[handle.platform] || 0) + 1
    })
  })
  
  return counts
}

async function crawlAnalystHistory(
  crawler: SocialMediaCrawler,
  analystId: string,
  handle: { platform: string; handle: string },
  sinceDate: Date
) {
  const result = {
    postsFound: 0,
    postsStored: 0,
    duplicatesSkipped: 0,
    irrelevantSkipped: 0,
    relevanceScores: [] as number[]
  }

  // Create a mock AnalystSocialHandle object for the crawler
  const socialHandle = {
    analystId,
    platform: handle.platform,
    handle: handle.handle,
    lastCrawledAt: sinceDate
  }

  const job = await crawler.crawlAnalyst(analystId, socialHandle)
  
  result.postsFound = job.postsFound
  result.postsStored = job.postsStored

  // Get stored posts to calculate additional metrics
  const storedPosts = await prisma.socialPost.findMany({
    where: {
      analystId,
      platform: handle.platform.toUpperCase(),
      postedAt: { gte: sinceDate }
    },
    select: {
      engagements: true,
      themes: true
    }
  })

  // Calculate relevance scores (simplified)
  result.relevanceScores = storedPosts.map(post => {
    // Simple relevance calculation based on engagement
    return Math.min(100, Math.max(0, post.engagements / 10))
  })

  result.duplicatesSkipped = Math.max(0, result.postsFound - result.postsStored)
  
  return result
}

async function printFinalReport(stats: InitializationStats) {
  console.log('\n📊 INITIALIZATION REPORT')
  console.log('========================\n')
  
  console.log('📈 Overall Statistics:')
  console.log(`   📋 Total Analysts: ${stats.totalAnalysts}`)
  console.log(`   🔗 Analysts with Social Handles: ${stats.analystsWithHandles}`)
  console.log(`   📱 Platforms Processed: ${stats.platformsProcessed.join(', ')}`)
  console.log(`   📄 Total Posts Found: ${stats.totalPostsFound}`)
  console.log(`   💾 Total Posts Stored: ${stats.totalPostsStored}`)
  console.log(`   ⏭️  Duplicates Skipped: ${stats.duplicatesSkipped}`)
  console.log(`   🚫 Irrelevant Posts Skipped: ${stats.irrelevantPostsSkipped}`)
  console.log(`   ❌ Failed Analysts: ${stats.failedAnalysts}`)
  
  const successRate = stats.analystsWithHandles > 0 
    ? Math.round(((stats.analystsWithHandles - stats.failedAnalysts) / stats.analystsWithHandles) * 100)
    : 0
  console.log(`   ✅ Success Rate: ${successRate}%`)
  
  if (stats.totalPostsStored > 0) {
    console.log(`   📊 Average Relevance Score: ${stats.averageRelevanceScore}`)
    const storageRate = Math.round((stats.totalPostsStored / stats.totalPostsFound) * 100)
    console.log(`   📈 Storage Rate: ${storageRate}% (relevant posts)`)
  }

  console.log(`   ⏱️  Processing Time: ${Math.round(stats.processingTimeMs / 1000)} seconds`)

  if (stats.topThemes.length > 0) {
    console.log('\n🔥 Top Themes Discovered:')
    stats.topThemes.slice(0, 10).forEach((theme, index) => {
      console.log(`   ${index + 1}. ${theme.theme} (${theme.count} posts)`)
    })
  }

  if (stats.errors.length > 0) {
    console.log('\n⚠️  Errors Encountered:')
    stats.errors.forEach(error => {
      console.log(`   ❌ ${error.analyst} (${error.platform}): ${error.error}`)
    })
  }

  console.log('\n💡 Next Steps:')
  console.log('   - Review the stored posts in your application')
  console.log('   - Set up hourly monitoring: npm run social:hourly')
  console.log('   - Configure alerts for important analyst activity')
  console.log('   - Analyze trending themes and engagement patterns')
}

async function storeInitializationRecord(stats: InitializationStats) {
  try {
    await prisma.monitoringStats.create({
      data: {
        type: 'INITIAL_HISTORY_BUILD',
        timestamp: new Date(),
        analystsChecked: stats.analystsWithHandles,
        postsFound: stats.totalPostsFound,
        postsStored: stats.totalPostsStored,
        newMentions: 0, // Not tracked in initialization
        highRelevancePosts: stats.topThemes.length,
        errorCount: stats.errors.length,
        duration: Math.round(stats.processingTimeMs / 1000),
        metadata: JSON.stringify({
          totalAnalysts: stats.totalAnalysts,
          platformsProcessed: stats.platformsProcessed,
          duplicatesSkipped: stats.duplicatesSkipped,
          irrelevantPostsSkipped: stats.irrelevantPostsSkipped,
          averageRelevanceScore: stats.averageRelevanceScore,
          successRate: Math.round(((stats.analystsWithHandles - stats.failedAnalysts) / Math.max(1, stats.analystsWithHandles)) * 100)
        })
      }
    })
    console.log('📝 Initialization record stored in database')
  } catch (error) {
    console.error('⚠️  Failed to store initialization record:', error)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Add cleanup handlers
process.on('SIGINT', async () => {
  console.log('\n⏹️  Received SIGINT, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Received SIGTERM, shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

// Run the script
if (require.main === module) {
  main().catch(console.error)
}

export { main }
