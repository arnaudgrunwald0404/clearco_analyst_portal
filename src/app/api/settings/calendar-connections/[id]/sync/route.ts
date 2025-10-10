import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'
import { requireAuth } from '@/lib/auth-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST - Start calendar sync for a specific connection
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const authResult = await requireAuth()
    
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = await createClient()
    const { timeWindowOptions, user_id } = await request.json().catch(() => ({} as any))

    // Get the calendar connection
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', id)
      .eq('user_id', user_id || authResult.id)
      .single()

    if (connectionError || !connection) {
      console.error('[Calendar Sync] Connection not found:', connectionError)
      return NextResponse.json(
        { error: 'Calendar connection not found or access denied' },
        { status: 404 }
      )
    }

    if (!connection.is_active) {
      return NextResponse.json(
        { error: 'Calendar connection is not active' },
        { status: 400 }
      )
    }

    // Simple check for recent sync to prevent concurrent syncs
    const recentSyncThreshold = new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
    if (connection.last_sync_at && new Date(connection.last_sync_at) > recentSyncThreshold) {
      return NextResponse.json(
        { error: 'Sync already completed recently. Please wait before syncing again.' },
        { status: 409 }
      )
    }

    // Set up Google Calendar API client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google-calendar/callback`
    )

    // Set credentials from stored tokens
    if (connection.access_token && connection.refresh_token) {
      oauth2Client.setCredentials({
        access_token: connection.access_token,
        refresh_token: connection.refresh_token
      })
    } else {
      return NextResponse.json(
        { error: 'No valid access tokens found for this connection. Please reconnect your calendar.' },
        { status: 400 }
      )
    }

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Ensure access token is valid (attempt refresh if needed)
    try {
      // getAccessToken triggers refresh flow if access token is expired and refresh_token exists
      await oauth2Client.getAccessToken()
    } catch (tokenErr: any) {
      console.error('[Calendar Sync] Token refresh failed:', tokenErr)
      const code = tokenErr?.code || tokenErr?.response?.status
      const message = tokenErr?.message || 'Token refresh failed'
      return NextResponse.json(
        { error: 'Calendar authorization expired. Please reconnect your calendar.', details: message, code },
        { status: 401 }
      )
    }

    // Calculate time window for fetching events
    const now = new Date()
    const hasCustomWindow = typeof timeWindowOptions?.pastDays === 'number' || typeof timeWindowOptions?.futureDays === 'number'
    const pastDays = typeof timeWindowOptions?.pastDays === 'number' ? Math.max(0, timeWindowOptions.pastDays) : (timeWindowOptions?.days || 30)
    const futureDays = typeof timeWindowOptions?.futureDays === 'number' ? Math.max(0, timeWindowOptions.futureDays) : (timeWindowOptions?.days || 30)
    const startTime = new Date(now.getTime() - (pastDays * 24 * 60 * 60 * 1000))
    const endTime = new Date(now.getTime() + (futureDays * 24 * 60 * 60 * 1000))

    console.log(`[Calendar Sync] Fetching events from ${startTime.toISOString()} to ${endTime.toISOString()}`)

    // Fetch calendar events
    let events
    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: startTime.toISOString(),
        timeMax: endTime.toISOString(),
        singleEvents: true,
        orderBy: 'startTime'
      })
      events = response.data
    } catch (eventsError: any) {
      console.error('[Calendar Sync] Failed to fetch events:', eventsError)
      const status = eventsError?.code || eventsError?.response?.status || 500
      const message = eventsError?.message || 'Failed to fetch calendar events'
      return NextResponse.json(
        { error: 'Failed to fetch calendar events', details: message, code: status },
        { status }
      )
    }

    const calendarEvents = events.items || []
    console.log(`[Calendar Sync] Found ${calendarEvents.length} events`)

    // Process events and extract meetings
    let relevantMeetingsCount = 0
    const meetingsToStore: any[] = []

    for (const event of calendarEvents) {
      // Skip events without attendees or with only the owner
      if (!event.attendees || event.attendees.length <= 1) {
        continue
      }

      // Skip all-day events
      if (!event.start?.dateTime) {
        continue
      }

      // Extract attendee emails
      const attendeeEmails = event.attendees
        .filter(attendee => attendee.email && attendee.responseStatus !== 'declined')
        .map(attendee => attendee.email?.toLowerCase())
        .filter(Boolean)

      if (attendeeEmails.length <= 1) {
        continue
      }

      // Check if this is an analyst meeting (has analyst emails)
      const { data: analysts } = await supabase
        .from('analysts')
        .select('email')
        .in('email', attendeeEmails.filter(email => email !== undefined) as string[])

      const isAnalystMeeting = analysts && analysts.length > 0

      // Store meeting in database (using the correct schema)
      const meetingData = {
        id: event.id || `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        calendarConnectionId: id,
        googleEventId: event.id || `meeting_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: event.summary || 'Untitled Meeting',
        description: event.description || null,
        startTime: event.start?.dateTime || new Date().toISOString(),
        endTime: event.end?.dateTime || new Date().toISOString(),
        attendees: JSON.stringify(event.attendees || []),
        analystId: null, // Could be populated if we match to specific analyst
        isAnalystMeeting: isAnalystMeeting,
        confidence: isAnalystMeeting ? 1.0 : 0.0,
        tags: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      meetingsToStore.push(meetingData)
      if (isAnalystMeeting) {
        relevantMeetingsCount++
      }
    }

    // Store meetings in database (upsert to handle duplicates)
    if (meetingsToStore.length > 0) {
      const { error: storeError } = await supabase
        .from('calendar_meetings')
        .upsert(meetingsToStore, { 
          onConflict: 'googleEventId',
          ignoreDuplicates: false 
        })

      if (storeError) {
        console.error('[Calendar Sync] Failed to store meetings:', storeError)
      }
    }

    // Update connection with last sync time
    await supabase
      .from('calendar_connections')
      .update({
        last_sync_at: new Date().toISOString()
      })
      .eq('id', id)

    console.log(`[Calendar Sync] Completed successfully. Processed ${calendarEvents.length} events, found ${relevantMeetingsCount} analyst meetings.`)

    return NextResponse.json({
      success: true,
      message: 'Calendar sync completed successfully',
      eventsProcessed: calendarEvents.length,
      relevantMeetingsFound: relevantMeetingsCount,
      meetingsStored: meetingsToStore.length
    })

  } catch (error) {
    console.error('[Calendar Sync] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error during calendar sync' },
      { status: 500 }
    )
  }
}

// GET - Get sync progress via Server-Sent Events
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const url = new URL(request.url)
    const userId = url.searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      )
    }

    // Verify user has access to this connection
    const supabase = await createClient()
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (connectionError || !connection) {
      return NextResponse.json(
        { error: 'Calendar connection not found or access denied' },
        { status: 404 }
      )
    }

    // Set up Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Send initial connection message
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to sync progress stream' })}\n\n`)
        )

        // Poll for connection updates (simplified without progress table)
        const pollInterval = setInterval(async () => {
          try {
            const { data: connection } = await supabase
              .from('calendar_connections')
              .select('last_sync_at')
              .eq('id', id)
              .single()

            if (connection?.last_sync_at) {
              const progressMessage = {
                type: 'progress',
                status: 'completed',
                message: 'Calendar sync completed successfully',
                relevantMeetingsCount: 0,
                startedAt: new Date().toISOString(),
                completedAt: connection.last_sync_at
              }

              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(progressMessage)}\n\n`)
              )

              clearInterval(pollInterval)
              controller.close()
            }
          } catch (error) {
            console.error('[Calendar Sync] Progress polling error:', error)
          }
        }, 2000) // Poll every 2 seconds

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(pollInterval)
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      }
    })

  } catch (error) {
    console.error('[Calendar Sync] SSE error:', error)
    return NextResponse.json(
      { error: 'Failed to establish progress stream' },
      { status: 500 }
    )
  }
}
