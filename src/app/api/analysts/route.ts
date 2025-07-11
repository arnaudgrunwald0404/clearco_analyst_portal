import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      company,
      title,
      phone,
      linkedIn,
      twitter,
      website,
      bio,
      type,
      eligibleNewsletters,
      coveredTopics,
      influence,
      status
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if analyst with email already exists
    const existingAnalyst = await prisma.analyst.findUnique({
      where: { email }
    })

    if (existingAnalyst) {
      return NextResponse.json(
        { error: 'An analyst with this email already exists' },
        { status: 409 }
      )
    }

    // Create the analyst with covered topics in a single transaction
    const analyst = await prisma.analyst.create({
      data: {
        firstName,
        lastName,
        email,
        company: company || null,
        title: title || null,
        phone: phone || null,
        linkedIn: linkedIn || null,
        twitter: twitter || null,
        website: website || null,
        bio: bio || null,
        type: type || 'Analyst',
        eligibleNewsletters: eligibleNewsletters || null,
        influence: influence || 'MEDIUM',
        status: status || 'ACTIVE',
        coveredTopics: coveredTopics && coveredTopics.length > 0 ? {
          create: coveredTopics.map(topic => ({
            topic
          }))
        } : undefined
      },
      include: {
        coveredTopics: true
      }
    })

    return NextResponse.json({
      success: true,
      data: analyst
    })

  } catch (error) {
    console.error('Error creating analyst:', error)
    return NextResponse.json(
      { error: 'Failed to create analyst' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const includeArchived = searchParams.get('includeArchived') === 'true'
    
    const analysts = await prisma.analyst.findMany({
      where: includeArchived ? undefined : {
        status: { not: 'ARCHIVED' }
      },
      include: {
        coveredTopics: true
      },
      orderBy: {
        lastName: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      data: analysts
    })

  } catch (error) {
    console.error('Error fetching analysts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysts from database' },
      { status: 500 }
    )
  }
}
