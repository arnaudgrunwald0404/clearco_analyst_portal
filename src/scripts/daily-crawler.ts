#!/usr/bin/env node

/**
 * Daily Social Media Crawler Script
 * 
 * This script is designed to be run as a daily cron job to automatically
 * crawl social media posts from all analysts in the database.
 * 
 * Usage:
 *   node src/scripts/daily-crawler.ts
 *   or
 *   npm run crawl:daily
 * 
 * Environment Variables Required:
 *   - DATABASE_URL
 *   - TWITTER_BEARER_TOKEN (optional)
 *   - LINKEDIN_ACCESS_TOKEN (optional)
 */

import { PrismaClient } from '@prisma/client'
import { SocialMediaCrawler } from '../lib/social-crawler/crawler'

const prisma = new PrismaClient()

async function main() {
  console.log('🕒 Starting daily social media crawl job...')
  console.log(`⏰ Started at: ${new Date().toISOString()}`)

  try {
    // Check environment variables
    const requiredEnvVars = ['DATABASE_URL']
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName])
    
    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:', missingVars)
      process.exit(1)
    }

    // Warn about optional API tokens
    if (!process.env.TWITTER_BEARER_TOKEN) {
      console.warn('⚠️  TWITTER_BEARER_TOKEN not set - Twitter crawling will be disabled')
    }
    
    if (!process.env.LINKEDIN_ACCESS_TOKEN) {
      console.warn('⚠️  LINKEDIN_ACCESS_TOKEN not set - LinkedIn crawling will be disabled')
    }

    // Initialize crawler
    const crawler = new SocialMediaCrawler(prisma)

    // Start the daily crawl
    const stats = await crawler.startDailyCrawl()

    // Log results
    console.log('\n📊 Crawl Statistics:')
    console.log(`   📋 Total Analysts: ${stats.totalAnalysts}`)
    console.log(`   🔄 Active Crawlers: ${stats.activeCrawlers}`)
    console.log(`   📄 Posts Found: ${stats.postsFoundToday}`)
    console.log(`   💾 Posts Stored: ${stats.postsStoredToday}`)
    console.log(`   ❌ Failed Jobs: ${stats.failedJobs}`)

    // Calculate success rate
    const successRate = stats.activeCrawlers > 0 
      ? Math.round(((stats.activeCrawlers - stats.failedJobs) / stats.activeCrawlers) * 100)
      : 0

    console.log(`   ✅ Success Rate: ${successRate}%`)

    // Send alert if too many failures
    if (stats.failedJobs > stats.activeCrawlers * 0.5) {
      console.error(`🚨 HIGH FAILURE RATE: ${stats.failedJobs} out of ${stats.activeCrawlers} jobs failed`)
      
      // Here you could implement alerting (email, Slack, etc.)
      await sendFailureAlert(stats)
    }

    // Update trending themes cache (if you have one)
    console.log('\n🔄 Updating trending themes...')
    const trendingThemes = await crawler.getTrendingThemes(7)
    console.log(`   📈 Found ${trendingThemes.length} trending themes`)
    
    if (trendingThemes.length > 0) {
      console.log('   🔥 Top 5 themes:')
      trendingThemes.slice(0, 5).forEach((theme, index) => {
        console.log(`      ${index + 1}. ${theme.theme} (${theme.count} posts)`)
      })
    }

    console.log(`\n✅ Daily crawl completed successfully at ${new Date().toISOString()}`)
    
  } catch (error) {
    console.error('❌ Daily crawl failed:', error)
    
    // Send critical error alert
    await sendCriticalErrorAlert(error)
    
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

async function sendFailureAlert(stats: any) {
  // Implement your alerting mechanism here
  // Examples: Send email, post to Slack, create monitoring alert
  
  console.log('📧 Sending failure alert to administrators...')
  
  const alertMessage = `
Social Media Crawler Alert 🚨

High failure rate detected in daily crawl:
- Total Jobs: ${stats.activeCrawlers}
- Failed Jobs: ${stats.failedJobs}
- Success Rate: ${Math.round(((stats.activeCrawlers - stats.failedJobs) / stats.activeCrawlers) * 100)}%

Please check the application logs for more details.

Time: ${new Date().toISOString()}
  `.trim()

  // TODO: Implement actual alerting
  // await sendEmail(alertMessage)
  // await postToSlack(alertMessage)
  
  console.log('Alert message prepared:', alertMessage)
}

async function sendCriticalErrorAlert(error: any) {
  console.log('🚨 Sending critical error alert...')
  
  const errorMessage = `
Social Media Crawler Critical Error 🚨

The daily social media crawl has failed completely:

Error: ${error instanceof Error ? error.message : 'Unknown error'}
Stack: ${error instanceof Error ? error.stack : 'N/A'}

Time: ${new Date().toISOString()}

Please investigate immediately.
  `.trim()

  // TODO: Implement actual alerting
  console.log('Critical error alert prepared:', errorMessage)
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
