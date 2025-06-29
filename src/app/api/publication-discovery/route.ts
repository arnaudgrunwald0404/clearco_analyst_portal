import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PublicationDiscoveryCrawler } from '@/lib/publication-discovery/crawler'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    const crawler = new PublicationDiscoveryCrawler(prisma)

    switch (action) {
      case 'recent':
        const limit = parseInt(searchParams.get('limit') || '20')
        const recentDiscoveries = await crawler.getRecentDiscoveries(limit)
        return NextResponse.json({
          success: true,
          data: recentDiscoveries
        })

      case 'trending':
        const days = parseInt(searchParams.get('days') || '7')
        const trendingThemes = await crawler.getTrendingThemes(days)
        return NextResponse.json({
          success: true,
          data: trendingThemes
        })

      case 'stats':
        const stats = {
          totalPublications: await prisma.publication.count(),
          recentPublications: await prisma.publication.count({
            where: {
              createdAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              }
            }
          }),
          uniqueAnalysts: await prisma.publication.groupBy({
            by: ['analystId'],
            where: {
              createdAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
            }
          }).then(groups => groups.length)
        }
        return NextResponse.json({
          success: true,
          data: stats
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action parameter'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Publication discovery API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, analystId } = body

    const crawler = new PublicationDiscoveryCrawler(prisma)

    switch (action) {
      case 'discover-all':
        // Trigger discovery for all analysts
        const stats = await crawler.startFullDiscovery()
        return NextResponse.json({
          success: true,
          message: 'Discovery completed',
          data: stats
        })

      case 'discover-analyst':
        if (!analystId) {
          return NextResponse.json({
            success: false,
            error: 'analystId is required'
          }, { status: 400 })
        }

        // Fetch the specific analyst
        const analyst = await prisma.analyst.findUnique({
          where: { id: analystId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            keyThemes: true,
            coveredTopics: {
              select: {
                topic: true
              }
            }
          }
        })

        if (!analyst) {
          return NextResponse.json({
            success: false,
            error: 'Analyst not found'
          }, { status: 404 })
        }

        // Run discovery for specific analyst
        const analystStats = await crawler.discoverPublicationsForAnalyst(analyst)
        
        return NextResponse.json({
          success: true,
          message: `Discovery completed for ${analyst.firstName} ${analyst.lastName}`,
          data: analystStats
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Publication discovery POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process discovery request' },
      { status: 500 }
    )
  }
}
