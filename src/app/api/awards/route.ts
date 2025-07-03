import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      awardName,
      publicationDate,
      processStartDate,
      contactInfo,
      priority,
      topics
    } = body

    // Validate required fields
    if (!awardName || !publicationDate || !processStartDate || !contactInfo) {
      return NextResponse.json(
        { error: 'Award name, publication date, process start date, and contact information are required' },
        { status: 400 }
      )
    }

    // Create the award
    const award = await prisma.award.create({
      data: {
        awardName,
        publicationDate: new Date(publicationDate),
        processStartDate: new Date(processStartDate),
        contactInfo,
        priority: priority || 'MEDIUM',
        topics: topics || ''
      }
    })

    return NextResponse.json({
      success: true,
      data: award
    })

  } catch (error) {
    console.error('Error creating award:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create award' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const awards = await prisma.award.findMany({
      orderBy: {
        publicationDate: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      data: awards
    })

  } catch (error) {
    console.error('Error fetching awards:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch awards from database' },
      { status: 500 }
    )
  }
}
