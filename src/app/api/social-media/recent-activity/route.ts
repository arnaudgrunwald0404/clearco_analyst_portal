import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { success: false, error: 'Missing DATABASE_URL environment variable' },
      { status: 500 }
    )
  }
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent posts with analysis
    const recentPosts = await prisma.socialPost.findMany({
      where: {
        isRelevant: true,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
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
      orderBy: {
        postedAt: 'desc'
      },
      take: limit
    })

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const [
      postsToday,
      totalPostsThisWeek,
      avgRelevanceResult,
      topThemesResult
    ] = await Promise.all([
      // Posts today
      prisma.socialPost.count({
        where: {
          isRelevant: true,
          postedAt: {
            gte: today
          }
        }
      }),
      
      // Posts this week
      prisma.socialPost.count({
        where: {
          isRelevant: true,
          postedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      
      // Average engagements
      prisma.socialPost.aggregate({
        where: {
          isRelevant: true,
          postedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        },
        _avg: {
          engagements: true
        }
      }),
      
      // Top themes (this would need to be implemented based on your themes storage)
      prisma.socialPost.findMany({
        where: {
          isRelevant: true,
          postedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          },
          themes: {
            not: null
          }
        },
        select: {
          themes: true
        }
      })
    ])

    // Process themes
    const themeCount: Record<string, number> = {}
    topThemesResult.forEach(post => {
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
      postsToday,
      avgRelevanceScore: Math.round(avgRelevanceResult._avg.engagements || 0), // Using avg engagements as proxy
      topThemes
    }

    return NextResponse.json({
      success: true,
      posts: formattedPosts,
      stats
    })

  } catch (error) {
    console.error('Error fetching recent social media activity:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social media activity' },
      { status: 500 }
    )
  }
}
