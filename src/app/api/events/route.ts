import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      eventName,
      link,
      type,
      audienceGroups,
      startDate,
      participationTypes,
      owner,
      location,
      status,
      notes
    } = body

    // Validate required fields
    if (!eventName || !startDate) {
      return NextResponse.json(
        { error: 'Event name and start date are required' },
        { status: 400 }
      )
    }

    // Create the event
    const event = await prisma.event.create({
      data: {
        eventName,
        link: link || null,
        type: type || 'CONFERENCE',
        audienceGroups: audienceGroups ? JSON.stringify(audienceGroups) : null,
        startDate: new Date(startDate),
        participationTypes: participationTypes ? JSON.stringify(participationTypes) : null,
        owner: owner || null,
        location: location || null,
        status: status || 'EVALUATING',
        notes: notes || null
      }
    })

    return NextResponse.json({
      success: true,
      data: event
    })

  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create event' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      orderBy: {
        startDate: 'desc'
      }
    })

    // Parse JSON fields for response
    const eventsWithParsedFields = events.map(event => ({
      ...event,
      audienceGroups: event.audienceGroups ? JSON.parse(event.audienceGroups) : [],
      participationTypes: event.participationTypes ? JSON.parse(event.participationTypes) : []
    }))

    return NextResponse.json({
      success: true,
      data: eventsWithParsedFields
    })

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch events from database' },
      { status: 500 }
    )
  }
}
