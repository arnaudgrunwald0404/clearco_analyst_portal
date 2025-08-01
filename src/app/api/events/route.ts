import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET() {
  try {
    console.log('📅 [Events API] Fetching events...')
    
    const supabase = await createClient()

    const { data: events, error } = await supabase
      .from('Event')
      .select('*')
      .order('startDate', { ascending: false })

    if (error) {
      console.error('Error fetching events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    console.log(`📅 [Events API] Found ${events?.length || 0} events`)

    return NextResponse.json({
      success: true,
      data: events || []
    })

  } catch (error) {
    console.error('Error in events GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📅 [Events API] Creating event...')
    
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

    console.log('📅 [Events API] Request data:', { eventName, type, startDate, status })

    // Validate required fields
    if (!eventName || !startDate) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Event name and start date are required' 
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create the event
    const eventData = {
      id: generateId(),
      eventName: eventName.trim(),
      link: link?.trim() || null,
      type: type || 'CONFERENCE',
      audienceGroups: audienceGroups ? JSON.stringify(audienceGroups) : null,
      startDate: new Date(startDate).toISOString(),
      participationTypes: participationTypes ? JSON.stringify(participationTypes) : null,
      owner: owner?.trim() || null,
      location: location?.trim() || null,
      status: status || 'EVALUATING',
      notes: notes?.trim() || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: event, error } = await supabase
      .from('Event')
      .insert(eventData)
      .select()
      .single()

    if (error) {
      console.error('Error creating event:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create event' 
        },
        { status: 500 }
      )
    }

    console.log(`📅 [Events API] Event created: ${event.eventName}`)

    return NextResponse.json({
      success: true,
      data: event
    }, { status: 201 })

  } catch (error) {
    console.error('Error in events POST:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
