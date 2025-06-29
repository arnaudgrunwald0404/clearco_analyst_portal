#!/usr/bin/env node

/**
 * Test Single Analyst Twitter Crawling
 * 
 * This script tests the Twitter API integration by crawling a single analyst
 */

import { PrismaClient } from '@prisma/client'
import { SocialMediaCrawler } from '../src/lib/social-crawler/crawler'

const prisma = new PrismaClient()

async function testSingleAnalyst() {
  try {
    console.log('🧪 Testing single analyst Twitter crawling...')
    
    const crawler = new SocialMediaCrawler(prisma)
    
    // Get Josh Bersin (most likely to have recent posts)
    const analyst = await prisma.analyst.findFirst({
      where: {
        firstName: 'Josh',
        lastName: 'Bersin',
        twitter: { not: null }
      }
    })
    
    if (!analyst) {
      console.log('❌ Josh Bersin not found in database')
      return
    }
    
    console.log(`📊 Testing with: ${analyst.firstName} ${analyst.lastName} (@${analyst.twitter})`)
    
    const handle = {
      analystId: analyst.id,
      platform: 'twitter' as const,
      handle: analyst.twitter!
    }
    
    console.log('🔍 Starting crawl...')
    const job = await crawler.crawlAnalyst(analyst.id, handle)
    
    console.log('\n📋 Results:')
    console.log(`   - Status: ${job.status}`)
    console.log(`   - Posts found: ${job.postsFound}`)
    console.log(`   - Posts stored: ${job.postsStored}`)
    if (job.error) {
      console.log(`   - Error: ${job.error}`)
    }
    
    if (job.postsStored > 0) {
      console.log('\n📄 Recent stored posts:')
      const recentPosts = await prisma.socialPost.findMany({
        where: {
          analystId: analyst.id
        },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          content: true,
          url: true,
          postedAt: true,
          sentiment: true,
          engagements: true
        }
      })
      
      recentPosts.forEach((post, i) => {
        console.log(`   ${i + 1}. ${post.content.substring(0, 100)}...`)
        console.log(`      URL: ${post.url}`)
        console.log(`      Posted: ${post.postedAt}`)
        console.log(`      Sentiment: ${post.sentiment} | Engagements: ${post.engagements}`)
        console.log('')
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function main() {
  try {
    await testSingleAnalyst()
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  main()
}
