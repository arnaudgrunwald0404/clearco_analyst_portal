import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import CryptoJS from 'crypto-js'

type calendar_connections = Database['public']['Tables']['calendar_connections']['Row']
type CalendarMeeting = Database['public']['Tables']['calendar_meetings']['Row']
type CalendarMeetingInsert = Database['public']['Tables']['calendar_meetings']['Insert']
type BriefingInsert = Database['public']['Tables']['briefings']['Insert']
type BriefingAnalystInsert = Database['public']['Tables']['briefing_analysts']['Insert']

// Initialize Google OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

// Encryption key for storing tokens
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production'

function decryptToken(encryptedToken: string): string {
  const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY)
  return bytes.toString(CryptoJS.enc.Utf8)
}

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

// Store for SSE connections
const syncConnections = new Map<string, any>()

// Store for active sync locks (user_id -> { connectionId, start_time, is_active })
const syncLocks = new Map<string, { connectionId: string; start_time: Date; is_active: boolean }>()

// Function to check if a sync is already in progress for a user
function isSyncInProgress(user_id: string): boolean {
  const lock = syncLocks.get(user_id)
  
  if (!lock) return false
  
  // Check if the lock is still active and not older than 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  const is_active = lock.is_active && lock.start_time > thirtyMinutesAgo
  
  return is_active
}

// Function to acquire a sync lock
function acquireSyncLock(user_id: string, connectionId: string): boolean {
  if (isSyncInProgress(user_id)) {
    return false
  }
  
  syncLocks.set(user_id, {
    connectionId,
    start_time: new Date(),
    is_active: true
  })
  
  return true
}

// Function to release a sync lock
function releaseSyncLock(user_id: string) {
  const lock = syncLocks.get(user_id)
  if (lock) {
    lock.is_active = false
    syncLocks.delete(user_id)
  }
}

// Function to send SSE message
function sendSSEMessage(connectionId: string, data: any) {
  const connection = syncConnections.get(connectionId)
  if (connection) {
    connection.write(`data: ${JSON.stringify(data)}\n\n`)
  }
}

// Function to match analysts by email with fuzzy matching
function matchAnalystByEmail(email: string, analysts: any[]): any | null {
  if (!email || !analysts.length) return null
  
  const cleanEmail = email.toLowerCase().trim()
  
  // Direct match
  let match = analysts.find(analyst => 
    analyst.email?.toLowerCase().trim() === cleanEmail
  )
  
  if (match) return match
  
  // Fuzzy match - check if email starts with first.last pattern
  const emailParts = cleanEmail.split('@')[0].split('.')
  if (emailParts.length >= 2) {
    const firstName = emailParts[0]
    const lastName = emailParts[1]
    
    match = analysts.find(analyst => {
      const analystFirst = analyst.firstName?.toLowerCase().trim()
      const analystLast = analyst.lastName?.toLowerCase().trim()
      return analystFirst === firstName && analystLast === lastName
    })
  }
  
  return match || null
}

async function startCalendarSync(connectionId: string, user_id: string, forceSync: boolean = false) {
  const supabase = await createClient()
  
  try {
    sendSSEMessage(connectionId, { 
      type: 'progress', 
      message: 'Starting calendar sync...', 
      progress: 0 
    })

    // Get calendar connection
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .eq('user_id', user_id)
      .single()

    if (connectionError || !connection) {
      throw new Error('Calendar connection not found')
    }

    if (!connection.is_active) {
      throw new Error('Calendar connection is not active')
    }

    sendSSEMessage(connectionId, { 
      type: 'progress', 
      message: 'Validating calendar connection...', 
      progress: 10 
    })

    // Set up Google Calendar API
    const access_token = decryptToken(connection.access_token)
    oauth2Client.setCredentials({ access_token: access_token })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    sendSSEMessage(connectionId, { 
      type: 'progress', 
      message: 'Fetching calendar events...', 
      progress: 20 
    })

    // Get time range for sync
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Fetch events from Google Calendar
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: thirtyDaysAgo.toISOString(),
      timeMax: thirtyDaysFromNow.toISOString(),
      singleEvents: true,
      orderBy: 'start_time',
    })

    const events = response.data.items || []
    
    sendSSEMessage(connectionId, { 
      type: 'progress', 
      message: `Found ${events.length} calendar events`, 
      progress: 40 
    })

    // Get all analysts for matching
    const { data: analysts, error: analystsError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, email, company, title')
      .eq('status', 'ACTIVE')

    if (analystsError) {
      throw new Error('Failed to fetch analysts')
    }

    sendSSEMessage(connectionId, { 
      type: 'progress', 
      message: 'Processing events and matching analysts...', 
      progress: 50 
    })

    // Pre-fetch existing briefings to prevent duplicates
    const { data: existingBriefings } = await supabase
      .from('briefings')
      .select('title, scheduledAt')

    const briefingSet = new Set(
      existingBriefings?.map(b => `${b.title}|${b.scheduledAt}`) || []
    )

    let processedEvents = 0
    let createdBriefings = 0
    let createdMeetings = 0

    // Process events
    for (const event of events) {
      try {
        if (!event.start?.dateTime || !event.end?.dateTime) continue

        const start_time = new Date(event.start.dateTime)
        const end_time = new Date(event.end.dateTime)
        const attendeeEmails = event.attendees?.map(a => a.email).filter(Boolean) || []
        
        // Check for duplicate briefing
        const briefingKey = `${event.summary}|${start_time.toISOString()}`
        const isDuplicate = briefingSet.has(briefingKey)

        if (!isDuplicate) {
          // Try to match attendees with analysts
          const matchedAnalysts = attendeeEmails
            .map(email => email ? matchAnalystByEmail(email, analysts) : null)
            .filter(Boolean)

                     // Create calendar meeting record
           const meetingData: CalendarMeetingInsert = {
             id: generateId(),
             analyst_id: matchedAnalysts[0]?.id || '',
             calendarConnectionId: connection.id,
             google_event_id: event.id || generateId(),
             title: event.summary || 'Untitled Meeting',
             start_time: start_time.toISOString(),
             end_time: end_time.toISOString(),
             attendees: JSON.stringify(attendeeEmails)
           }

          if (matchedAnalysts.length > 0) {
            const { error: meetingError } = await supabase
              .from('calendar_meetings')
              .upsert(meetingData, { onConflict: 'google_event_id' })

            if (!meetingError) {
              createdMeetings++
            }

            // Create briefing if it's a relevant meeting
            if (event.summary && matchedAnalysts.length > 0) {
              const briefingData: BriefingInsert = {
                id: generateId(),
                title: event.summary,
                description: event.description || `Meeting with ${matchedAnalysts.map(a => `${a.firstName} ${a.lastName}`).join(', ')}`,
                scheduledAt: start_time.toISOString(),
                status: start_time > now ? 'SCHEDULED' : 'COMPLETED',
                agenda: event.location ? `Location: ${event.location}` : null
              }

              const { data: newBriefing, error: briefingError } = await supabase
                .from('briefings')
                .insert(briefingData)
                .select()
                .single()

              if (!briefingError && newBriefing) {
                // Add to our duplicate check set
                briefingSet.add(briefingKey)
                createdBriefings++

                // Associate analysts with briefing
                const briefingAnalysts: BriefingAnalystInsert[] = matchedAnalysts.map(analyst => ({
                  id: generateId(),
                  briefingId: newBriefing.id,
                  analyst_id: analyst.id
                }))

                await supabase
                  .from('briefing_analysts')
                  .insert(briefingAnalysts)
              }
            }
          }
        }

        processedEvents++
        
        // Update progress
        const progress = 50 + Math.floor((processedEvents / events.length) * 40)
        sendSSEMessage(connectionId, { 
          type: 'progress', 
          message: `Processed ${processedEvents}/${events.length} events`, 
          progress 
        })

      } catch (eventError) {
        console.error('Error processing event:', eventError)
        // Continue with other events
      }
    }

    // Update connection sync timestamp
    await supabase
      .from('calendar_connections')
              .update({ last_sync: new Date().toISOString() })
      .eq('id', connection.id)

    sendSSEMessage(connectionId, { 
      type: 'progress', 
      message: 'Calendar sync completed successfully', 
      progress: 100 
    })

    sendSSEMessage(connectionId, { 
      type: 'complete', 
      summary: {
        totalEvents: events.length,
        processedEvents,
        createdBriefings,
        createdMeetings
      }
    })

    console.log(`✅ Calendar sync completed: ${createdBriefings} briefings, ${createdMeetings} meetings`)

  } catch (error) {
    console.error('Calendar sync error:', error)
    sendSSEMessage(connectionId, { 
      type: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error occurred' 
    })
  } finally {
    releaseSyncLock(user_id)
    setTimeout(() => {
      const connection = syncConnections.get(connectionId)
      if (connection) {
        connection.end()
        syncConnections.delete(connectionId)
      }
    }, 1000)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const connectionId = id
    const { user_id, forceSync } = await request.json()

    if (!user_id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check if sync is already in progress
    if (!acquireSyncLock(user_id, connectionId)) {
      return NextResponse.json(
        { error: 'Calendar sync already in progress' },
        { status: 409 }
      )
    }

    // Start the sync process asynchronously
    startCalendarSync(connectionId, user_id, forceSync)

    return NextResponse.json({
      success: true,
      message: 'Calendar sync started'
    })

  } catch (error) {
    console.error('Error starting calendar sync:', error)
    return NextResponse.json(
      { 
        error: 'Failed to start calendar sync',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const connectionId = id
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')

  if (!user_id) {
    return new NextResponse('User ID is required', { status: 400 })
  }

  // Set up SSE
  const stream = new ReadableStream({
    start(controller) {
      const connection = {
        write: (data: string) => {
          controller.enqueue(new TextEncoder().encode(data))
        },
        end: () => {
          controller.close()
        }
      }
      
      syncConnections.set(connectionId, connection)
      
      // Send initial connection confirmation
      connection.write('data: {"type":"connected"}\n\n')
    },
    cancel() {
      syncConnections.delete(connectionId)
    }
  })

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}