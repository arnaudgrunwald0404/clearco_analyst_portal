import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const event = await prisma.event.findUnique({
      where: { id }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields for response
    const eventWithParsedFields = {
      ...event,
      audienceGroups: event.audienceGroups ? JSON.parse(event.audienceGroups) : [],
      participationTypes: event.participationTypes ? JSON.parse(event.participationTypes) : []
    }

    return NextResponse.json({
      success: true,
      data: eventWithParsedFields
    })

  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const event = await prisma.event.update({
      where: { id },
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

    // Parse JSON fields for response
    const eventWithParsedFields = {
      ...event,
      audienceGroups: event.audienceGroups ? JSON.parse(event.audienceGroups) : [],
      participationTypes: event.participationTypes ? JSON.parse(event.participationTypes) : []
    }

    return NextResponse.json({
      success: true,
      data: eventWithParsedFields
    })

  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.event.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    )
  }
}
