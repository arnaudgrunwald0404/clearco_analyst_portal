import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch latest 5 social media posts from LinkedIn and Twitter
    const socialPosts = await prisma.socialPost.findMany({
      where: {
        analystId: id,
        platform: {
          in: ['LINKEDIN', 'TWITTER']
        },
        isRelevant: true
      },
      orderBy: {
        postedAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json({
      success: true,
      data: socialPosts
    })

  } catch (error) {
    console.error('Error fetching social posts:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social posts' },
      { status: 500 }
    )
  }
}
