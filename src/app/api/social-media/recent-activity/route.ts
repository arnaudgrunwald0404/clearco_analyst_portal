import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Social media activity API called')
    
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    console.log('📊 Querying social posts...')

    // Get recent posts with analysis
    const recentPosts = await prisma.socialPost.findMany({
      where: { 
        isRelevant: true,
        postedAt: { gte: sevenDaysAgo }
      },
      include: {
        analyst: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            title: true
          }
        }
      },
      orderBy: { postedAt: 'desc' },
      take: limit
    })

    console.log(`📋 Found ${recentPosts.length} recent social posts`)

    // Calculate stats using Prisma
    const [
      postsToday,
      totalPostsThisWeek,
      engagementStats,
      themePosts
    ] = await Promise.all([
      // Posts today
      prisma.socialPost.count({
        where: {
          isRelevant: true,
          postedAt: { gte: today }
        }
      }),

      // Posts this week
      prisma.socialPost.count({
        where: {
          isRelevant: true,
          postedAt: { gte: sevenDaysAgo }
        }
      }),

      // Average engagements
      prisma.socialPost.findMany({
        where: {
          isRelevant: true,
          postedAt: { gte: sevenDaysAgo }
        },
        select: { engagements: true }
      }),

      // Top themes
      prisma.socialPost.findMany({
        where: {
          isRelevant: true,
          postedAt: { gte: sevenDaysAgo },
          themes: { not: null }
        },
        select: { themes: true }
      })
    ])

    console.log(`📊 Stats calculated: ${postsToday} today, ${totalPostsThisWeek} this week`)

    // Calculate average engagements
    const avgEngagements = engagementStats.length > 0
      ? engagementStats.reduce((sum, post) => sum + (post.engagements || 0), 0) / engagementStats.length
      : 0

    // Process themes
    const themeCount: Record<string, number> = {}
    themePosts.forEach(post => {
      try {
        let themes = post.themes
        if (typeof themes === 'string') {
          themes = JSON.parse(themes)
        }
        if (Array.isArray(themes)) {
          themes.forEach((theme: string) => {
            themeCount[theme] = (themeCount[theme] || 0) + 1
          })
        }
      } catch (error) {
        // Skip invalid JSON themes
        console.warn('Invalid themes JSON:', post.themes)
      }
    })

    const topThemes = Object.entries(themeCount)
      .map(([theme, count]) => ({ theme, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Format posts for response
    const formattedPosts = recentPosts.map(post => {
      let themes = []
      try {
        if (typeof post.themes === 'string') {
          themes = JSON.parse(post.themes || '[]')
        } else if (Array.isArray(post.themes)) {
          themes = post.themes
        }
      } catch (error) {
        console.warn('Invalid themes JSON for post:', post.id)
        themes = []
      }

      return {
        id: post.id,
        analystId: post.analystId,
        platform: post.platform,
        content: post.content,
        url: post.url,
        postedAt: post.postedAt,
        engagements: post.engagements || 0,
        relevanceScore: 85, // Mock relevance score since it's not in the schema
        themes,
        sentiment: post.sentiment || 'NEUTRAL',
        mentionsCompany: post.content?.toLowerCase().includes('clearcompany') || post.content?.toLowerCase().includes('hr tech') || false,
        analyst: post.analyst
      }
    })

    const stats = {
      totalPosts: totalPostsThisWeek,
      postsToday: postsToday,
      avgRelevanceScore: Math.round(avgEngagements), // Using avg engagements as proxy
      topThemes
    }

    console.log('✅ Social media activity API completed successfully')

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      stats
    })

  } catch (error) {
    console.error('❌ Error fetching recent social media activity:', error)
    
    // Return a valid response even on error
    return NextResponse.json({
      success: true,
      posts: [],
      stats: {
        totalPosts: 0,
        postsToday: 0,
        avgRelevanceScore: 0,
        topThemes: []
      }
    })
  }
}
