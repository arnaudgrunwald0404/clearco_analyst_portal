import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: event, error } = await supabase
      .from('Event')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Parse JSON fields for response
    const eventWithParsedFields = {
      ...event,
      audienceGroups: event.audienceGroups ? JSON.parse(event.audienceGroups) : [],
      participationStatus: event.participationStatus ? JSON.parse(event.participationStatus) : []
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

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    console.log('PATCH /api/events/[id] - Event ID:', id)
    
    const body = await request.json()
    const { participationStatus } = body || {}
    console.log('Request body:', { participationStatus })

    // Allow null (Not Attending) or one of the known statuses
    const allowed = new Set(['SPONSORING', 'ATTENDING', 'CONSIDERING', null])
    if (!allowed.has(participationStatus ?? null)) {
      console.error('Invalid participationStatus:', participationStatus)
      return NextResponse.json(
        { error: 'Invalid participationStatus' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication failed:', authError)
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }
    console.log('User authenticated:', user.email)

    const { error } = await supabase
      .from('Event')
      .update({ participationStatus: participationStatus ?? null, updatedAt: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error updating participationStatus:', error)
      console.error('Supabase error details:', JSON.stringify(error, null, 2))
      return NextResponse.json(
        { error: 'Failed to update participationStatus', details: error.message },
        { status: 500 }
      )
    }

    console.log('Successfully updated participationStatus for event:', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
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
      participationStatus,
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

    const supabase = await createClient()

    const updateData = {
      eventName: eventName.trim(),
      link: link?.trim() || null,
      type: type || 'CONFERENCE',
      audienceGroups: audienceGroups ? JSON.stringify(audienceGroups) : null,
      startDate: new Date(startDate).toISOString(),
      participationStatus: participationStatus ? JSON.stringify(participationStatus) : null,
      owner: owner?.trim() || null,
      location: location?.trim() || null,
      status: status || 'EVALUATING',
      notes: notes?.trim() || null,
      updatedAt: new Date().toISOString()
    }

    const { data: event, error } = await supabase
      .from('Event')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !event) {
      console.error('Error updating event:', error)
      return NextResponse.json(
        { error: 'Failed to update event or event not found' },
        { status: error?.code === '23503' ? 404 : 500 }
      )
    }

    console.log(`📅 Updated event: ${event.eventName}`)

    return NextResponse.json({
      success: true,
      data: event
    })

  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('Event')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting event:', error)
      return NextResponse.json(
        { error: 'Failed to delete event' },
        { status: 500 }
      )
    }

    console.log(`🗑️ Deleted event: ${id}`)

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
