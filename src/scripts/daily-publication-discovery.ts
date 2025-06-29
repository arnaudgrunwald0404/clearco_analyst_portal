#!/usr/bin/env node

/**
 * Daily Publication Discovery Script
 * 
 * This script is designed to be run as a daily cron job to automatically
 * discover new analyst publications across various sources.
 * 
 * Usage:
 *   node src/scripts/daily-publication-discovery.ts
 *   or
 *   npm run discover:daily
 * 
 * Environment Variables Required:
 *   - DATABASE_URL
 *   - GOOGLE_SEARCH_API_KEY (optional but recommended)
 *   - GOOGLE_SEARCH_ENGINE_ID (optional but recommended)
 *   - BING_SEARCH_API_KEY (optional but recommended)
 */

import { PrismaClient } from '@prisma/client'
import { PublicationDiscoveryCrawler } from '../lib/publication-discovery/crawler'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Starting daily publication discovery job...')
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
    if (!process.env.GOOGLE_SEARCH_API_KEY) {
      console.warn('⚠️  GOOGLE_SEARCH_API_KEY not set - Google search will be disabled')
    }
    
    if (!process.env.BING_SEARCH_API_KEY) {
      console.warn('⚠️  BING_SEARCH_API_KEY not set - Bing search will be disabled')
    }

    if (!process.env.GOOGLE_SEARCH_API_KEY && !process.env.BING_SEARCH_API_KEY) {
      console.warn('⚠️  No search API keys configured - running in limited mode')
    }

    // Initialize crawler
    const crawler = new PublicationDiscoveryCrawler(prisma)

    // Start the daily discovery
    const stats = await crawler.startFullDiscovery()

    // Log results
    console.log('\n📊 Discovery Statistics:')
    console.log(`   📋 Total Analysts: ${stats.totalAnalysts}`)
    console.log(`   🔍 Searches Performed: ${stats.searchesPerformed}`)
    console.log(`   📄 Publications Found: ${stats.publicationsFound}`)
    console.log(`   💾 Publications Stored: ${stats.publicationsStored}`)
    console.log(`   ❌ Failed Searches: ${stats.failedSearches}`)
    console.log(`   📈 Avg Relevance Score: ${stats.avgRelevanceScore.toFixed(2)}`)

    if (stats.topSources.length > 0) {
      console.log('   🌐 Top Sources:')
      stats.topSources.forEach((source, index) => {
        console.log(`      ${index + 1}. ${source}`)
      })
    }

    // Calculate success rate
    const successRate = stats.searchesPerformed > 0 
      ? Math.round(((stats.searchesPerformed - stats.failedSearches) / stats.searchesPerformed) * 100)
      : 0

    console.log(`   ✅ Success Rate: ${successRate}%`)

    // Send alert if too many failures
    if (stats.failedSearches > stats.searchesPerformed * 0.5) {
      console.error(`🚨 HIGH FAILURE RATE: ${stats.failedSearches} out of ${stats.searchesPerformed} searches failed`)
      
      // Here you could implement alerting (email, Slack, etc.)
      await sendFailureAlert(stats)
    }

    // Get trending themes
    console.log('\n🔄 Updating trending themes...')
    const trendingThemes = await crawler.getTrendingThemes(7)
    console.log(`   📈 Found ${trendingThemes.length} trending themes`)
    
    if (trendingThemes.length > 0) {
      console.log('   🔥 Top 5 themes:')
      trendingThemes.slice(0, 5).forEach((theme, index) => {
        console.log(`      ${index + 1}. ${theme.theme} (${theme.count} publications)`)
      })
    }

    // Show recent discoveries
    console.log('\n📰 Recent Discoveries:')
    const recentDiscoveries = await crawler.getRecentDiscoveries(5)
    if (recentDiscoveries.length > 0) {
      recentDiscoveries.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.title}`)
        console.log(`      By: ${item.metadata?.analystName}`)
        console.log(`      URL: ${item.url}`)
      })
    } else {
      console.log('   📭 No recent discoveries found')
    }

    console.log(`\n✅ Daily publication discovery completed successfully at ${new Date().toISOString()}`)
    
  } catch (error) {
    console.error('❌ Daily publication discovery failed:', error)
    
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
Publication Discovery Alert 🚨

High failure rate detected in daily discovery:
- Total Searches: ${stats.searchesPerformed}
- Failed Searches: ${stats.failedSearches}
- Success Rate: ${Math.round(((stats.searchesPerformed - stats.failedSearches) / stats.searchesPerformed) * 100)}%

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
Publication Discovery Critical Error 🚨

The daily publication discovery has failed completely:

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
