#!/usr/bin/env node

/**
 * Hourly Social Media Monitoring Script
 * 
 * This script runs every hour to check for new social media posts from analysts.
 * It's designed to be more frequent and focused than the daily crawler.
 * 
 * Usage:
 * - Via cron: 0 * * * * cd /path/to/project && npm run social:hourly
 * - Manually: npm run social:hourly
 */

import { PrismaClient } from '@prisma/client'
import { SocialMediaCrawler } from '../lib/social-crawler/crawler'

const prisma = new PrismaClient()

interface HourlyStats {
  analystsChecked: number
  postsFound: number
  postsStored: number
  newMentions: number
  highRelevancePosts: number
  errors: string[]
}

async function runHourlyMonitoring(): Promise<HourlyStats> {
  const stats: HourlyStats = {
    analystsChecked: 0,
    postsFound: 0,
    postsStored: 0,
    newMentions: 0,
    highRelevancePosts: 0,
    errors: []
  }

  console.log('🔍 Starting hourly social media monitoring...')
  console.log(`⏰ Time: ${new Date().toISOString()}`)

  try {
    const crawler = new SocialMediaCrawler(prisma)

    // Get analysts with recent activity or high priority
    const priorityAnalysts = await getPriorityAnalysts()
    stats.analystsChecked = priorityAnalysts.length

    console.log(`📊 Found ${priorityAnalysts.length} priority analysts to check`)

    // Process each priority analyst
    for (const analyst of priorityAnalysts) {
      try {
        console.log(`🔍 Checking ${analyst.firstName} ${analyst.lastName} (${analyst.company})`)

        // Check LinkedIn and Twitter handles
        const handles = getAnalystSocialHandles(analyst)
        
        for (const handle of handles) {
          try {
            const job = await crawler.crawlAnalyst(analyst.id, handle)
            stats.postsFound += job.postsFound
            stats.postsStored += job.postsStored

            // Count high-relevance posts and company mentions
            if (job.postsStored > 0) {
              const recentPosts = await prisma.socialPost.findMany({
                where: {
                  analystId: analyst.id,
                  createdAt: {
                    gte: new Date(Date.now() - 60 * 60 * 1000) // Last hour
                  }
                }
              })

              stats.newMentions += recentPosts.filter(p => p.mentionsCompany).length
              stats.highRelevancePosts += recentPosts.filter(p => (p.relevanceScore || 0) >= 80).length
            }

            // Longer delay to respect Twitter rate limits
            await new Promise(resolve => setTimeout(resolve, 12000)) // 12 seconds
          } catch (error) {
            const errorMsg = `Error crawling ${handle.platform} for ${analyst.firstName} ${analyst.lastName}: ${error.message}`
            console.error(`❌ ${errorMsg}`)
            stats.errors.push(errorMsg)
            
            // If rate limited, wait longer before next request
            if (error.message.includes('429')) {
              console.log('   ⏳ Rate limited, waiting 60 seconds...')
              await new Promise(resolve => setTimeout(resolve, 60000))
            }
          }
        }
      } catch (error) {
        const errorMsg = `Error processing analyst ${analyst.firstName} ${analyst.lastName}: ${error.message}`
        console.error(`❌ ${errorMsg}`)
        stats.errors.push(errorMsg)
      }
    }

    // Log summary
    console.log(`\n✅ Hourly monitoring completed:`)
    console.log(`   - Analysts checked: ${stats.analystsChecked}`)
    console.log(`   - Posts found: ${stats.postsFound}`)
    console.log(`   - Posts stored: ${stats.postsStored}`)
    console.log(`   - New company mentions: ${stats.newMentions}`)
    console.log(`   - High-relevance posts: ${stats.highRelevancePosts}`)
    console.log(`   - Errors: ${stats.errors.length}`)

    // Send alerts if there are important findings
    await sendAlertsIfNeeded(stats)

    // Store monitoring stats
    await storeMonitoringStats(stats)

  } catch (error) {
    console.error('💥 Critical error in hourly monitoring:', error)
    stats.errors.push(`Critical error: ${error.message}`)
    
    // Send critical error alert
    await sendCriticalErrorAlert(error)
  }

  return stats
}

/**
 * Get priority analysts based on:
 * - High influence analysts
 * - Analysts with recent posts
 * - Analysts with upcoming briefings
 * - Analysts who frequently mention the company
 */
async function getPriorityAnalysts() {
  const highInfluenceAnalysts = await prisma.analyst.findMany({
    where: {
      status: 'ACTIVE',
      influence: {
        in: ['VERY_HIGH', 'HIGH']
      },
      // Focus on Twitter for now (LinkedIn API access is restrictive)
      twitter: { not: null }
      // OR: [
      //   { linkedIn: { not: null } },
      //   { twitter: { not: null } }
      // ]
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      linkedIn: true,
      twitter: true,
      influence: true
    }
  })

  // Also include analysts with recent activity
  const recentActivityAnalysts = await prisma.analyst.findMany({
    where: {
      status: 'ACTIVE',
      socialPosts: {
        some: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      }
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      linkedIn: true,
      twitter: true,
      influence: true
    }
  })

  // Combine and deduplicate
  const combined = [...highInfluenceAnalysts, ...recentActivityAnalysts]
  const unique = combined.filter((analyst, index, self) => 
    index === self.findIndex(a => a.id === analyst.id)
  )

  return unique
}

/**
 * Extract social handles for an analyst
 */
function getAnalystSocialHandles(analyst: any) {
  const handles = []

  // LinkedIn temporarily commented out due to API restrictions
  // if (analyst.linkedIn) {
  //   handles.push({
  //     platform: 'linkedin' as const,
  //     handle: analyst.linkedIn,
  //     lastCrawledAt: null // Will be updated by crawler
  //   })
  // }

  if (analyst.twitter) {
    handles.push({
      platform: 'twitter' as const,
      handle: analyst.twitter,
      lastCrawledAt: null // Will be updated by crawler
    })
  }

  return handles
}

/**
 * Send alerts for important findings
 */
async function sendAlertsIfNeeded(stats: HourlyStats) {
  try {
    // Alert on new company mentions
    if (stats.newMentions > 0) {
      console.log(`🚨 ALERT: ${stats.newMentions} new company mentions found!`)
      // TODO: Implement actual alert system (email, Slack, etc.)
    }

    // Alert on high-relevance posts
    if (stats.highRelevancePosts > 2) {
      console.log(`📈 ALERT: ${stats.highRelevancePosts} high-relevance posts found!`)
      // TODO: Implement actual alert system
    }

    // Alert on high error rate
    if (stats.errors.length > stats.analystsChecked * 0.3) {
      console.log(`⚠️  ALERT: High error rate (${stats.errors.length}/${stats.analystsChecked})`)
      // TODO: Implement actual alert system
    }
  } catch (error) {
    console.error('Error sending alerts:', error)
  }
}

/**
 * Send critical error alert
 */
async function sendCriticalErrorAlert(error: Error) {
  try {
    console.log(`💥 CRITICAL ERROR ALERT: ${error.message}`)
    // TODO: Implement critical error alerting (PagerDuty, etc.)
  } catch (alertError) {
    console.error('Error sending critical alert:', alertError)
  }
}

/**
 * Store monitoring statistics for tracking
 */
async function storeMonitoringStats(stats: HourlyStats) {
  try {
    const monitoringRecord = {
      id: `hourly-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type: 'HOURLY_MONITORING',
      analystsChecked: stats.analystsChecked,
      postsFound: stats.postsFound,
      postsStored: stats.postsStored,
      newMentions: stats.newMentions,
      highRelevancePosts: stats.highRelevancePosts,
      errorCount: stats.errors.length,
      errors: JSON.stringify(stats.errors),
      hostname: process.env.HOSTNAME || 'unknown'
    }

    // Store in database
    await prisma.$executeRaw`
      INSERT INTO monitoring_stats (
        id, timestamp, type, analysts_checked, posts_found, posts_stored, 
        new_mentions, high_relevance_posts, error_count, errors, hostname
      ) VALUES (
        ${monitoringRecord.id}, ${monitoringRecord.timestamp}, ${monitoringRecord.type},
        ${monitoringRecord.analystsChecked}, ${monitoringRecord.postsFound}, ${monitoringRecord.postsStored},
        ${monitoringRecord.newMentions}, ${monitoringRecord.highRelevancePosts}, 
        ${monitoringRecord.errorCount}, ${monitoringRecord.errors}, ${monitoringRecord.hostname}
      )
    `

    console.log('📊 Monitoring stats stored to database:', {
      timestamp: monitoringRecord.timestamp.toISOString(),
      type: monitoringRecord.type,
      analystsChecked: monitoringRecord.analystsChecked,
      postsFound: monitoringRecord.postsFound,
      postsStored: monitoringRecord.postsStored,
      newMentions: monitoringRecord.newMentions,
      highRelevancePosts: monitoringRecord.highRelevancePosts,
      errorCount: monitoringRecord.errorCount
    })
  } catch (error) {
    console.error('Error storing monitoring stats:', error)
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const stats = await runHourlyMonitoring()
    
    // Exit with error code if there were significant issues
    if (stats.errors.length > stats.analystsChecked * 0.5) {
      console.error('⚠️  Exiting with error due to high failure rate')
      process.exit(1)
    }
    
    console.log('✅ Hourly monitoring completed successfully')
    process.exit(0)
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

export { runHourlyMonitoring, getPriorityAnalysts }
