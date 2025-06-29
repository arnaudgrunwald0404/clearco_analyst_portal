import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch publications from the last 2 years
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const publications = await prisma.publication.findMany({
      where: {
        analystId: id,
        publishedAt: {
          gte: twoYearsAgo
        },
        isTracked: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: 20 // Limit to most recent 20 publications
    })

    return NextResponse.json({
      success: true,
      data: publications
    })

  } catch (error) {
    console.error('Error fetching publications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch publications' },
      { status: 500 }
    )
  }
}
