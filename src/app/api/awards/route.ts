import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      link,
      organization,
      productTopics,
      priority,
      submissionDate,
      publicationDate,
      owner,
      status,
      cost,
      notes
    } = body

    // Validate required fields
    if (!name || !publicationDate || !submissionDate || !organization) {
      return NextResponse.json(
        { error: 'Award name, publication date, submission date, and organization are required' },
        { status: 400 }
      )
    }

    // Create the award
    const award = await prisma.award.create({
      data: {
        name,
        link: link || null,
        organization,
        productTopics: productTopics ? JSON.stringify(Array.isArray(productTopics) ? productTopics : [productTopics]) : null,
        priority: priority || 'MEDIUM',
        submissionDate: new Date(submissionDate),
        publicationDate: new Date(publicationDate),
        owner: owner || null,
        status: status || 'EVALUATING',
        cost: cost || null,
        notes: notes || null
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
