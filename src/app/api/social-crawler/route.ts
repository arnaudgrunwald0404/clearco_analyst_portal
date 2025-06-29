import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { SocialMediaCrawler } from '@/lib/social-crawler/crawler'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { action, analystId, platform, handle } = await request.json()

    const crawler = new SocialMediaCrawler(prisma)

    switch (action) {
      case 'start_daily_crawl':
        const stats = await crawler.startDailyCrawl()
        return NextResponse.json({
          success: true,
          message: 'Daily crawl completed',
          stats
        })

      case 'crawl_analyst':
        if (!analystId || !platform || !handle) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: analystId, platform, handle'
          }, { status: 400 })
        }

        const job = await crawler.crawlAnalyst(analystId, {
          analystId,
          platform,
          handle
        })

        return NextResponse.json({
          success: true,
          message: 'Analyst crawl completed',
          job
        })

      case 'add_social_handle':
        if (!analystId || !platform || !handle) {
          return NextResponse.json({
            success: false,
            error: 'Missing required parameters: analystId, platform, handle'
          }, { status: 400 })
        }

        const added = await crawler.addAnalystSocialHandle(analystId, platform, handle)
        return NextResponse.json({
          success: true,
          message: 'Social handle added and validated',
          added
        })

      case 'get_trending_themes':
        const days = parseInt(request.nextUrl.searchParams.get('days') || '7')
        const themes = await crawler.getTrendingThemes(days)
        return NextResponse.json({
          success: true,
          themes
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Supported actions: start_daily_crawl, crawl_analyst, add_social_handle, get_trending_themes'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Social crawler API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const analystId = searchParams.get('analystId')
    const platform = searchParams.get('platform') as 'twitter' | undefined // | 'linkedin'
    const themes = searchParams.get('themes')?.split(',')
    const sentiment = searchParams.get('sentiment') as 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' | undefined
    const minRelevanceScore = searchParams.get('minRelevanceScore') 
      ? parseInt(searchParams.get('minRelevanceScore')!) 
      : undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined

    if (!analystId) {
      return NextResponse.json({
        success: false,
        error: 'analystId parameter is required'
      }, { status: 400 })
    }

    const crawler = new SocialMediaCrawler(prisma)
    const posts = await crawler.getAnalystPosts(analystId, {
      platform,
      themes,
      sentiment,
      minRelevanceScore,
      limit,
      offset
    })

    return NextResponse.json({
      success: true,
      posts,
      total: posts.length
    })
  } catch (error) {
    console.error('Get analyst posts error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
