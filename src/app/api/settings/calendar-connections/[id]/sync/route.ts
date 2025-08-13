export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'
import type { Database } from '@/types/supabase'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import CryptoJS from 'crypto-js'
import { decrypt as decryptGcm } from '@/lib/crypto'

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

// Support decrypting tokens stored via either our GCM helper (ENCRYPTION_SECRET)
// or legacy CryptoJS AES with ENCRYPTION_KEY
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'fallback-key-change-in-production'

function decryptToken(encryptedToken: string): string {
  // Try GCM decrypt first (current storage method)
  try {
    return decryptGcm(encryptedToken)
  } catch {}
  // Fallback to CryptoJS AES with ENCRYPTION_KEY (legacy)
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedToken, ENCRYPTION_KEY)
    const decrypted = bytes.toString(CryptoJS.enc.Utf8)
    if (!decrypted) throw new Error('Empty decrypt result')
    return decrypted
  } catch (err) {
    throw new Error('Failed to decrypt access token')
  }
}

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

// Store for SSE connections
const syncConnections = new Map<string, any>()

// Store for active sync locks (connectionId -> { start_time, is_active })
const syncLocks = new Map<string, { start_time: Date; is_active: boolean }>()

// Function to check if a sync is already in progress for a connection
function isSyncInProgress(connectionId: string): boolean {
  const lock = syncLocks.get(connectionId)
  
  if (!lock) return false
  
  // Check if the lock is still active and not older than 30 minutes
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000)
  const is_active = lock.is_active && lock.start_time > thirtyMinutesAgo
  
  return is_active
}

// Function to acquire a sync lock (by connection)
function acquireSyncLock(connectionId: string): boolean {
  if (isSyncInProgress(connectionId)) {
    return false
  }
  
  syncLocks.set(connectionId, { start_time: new Date(), is_active: true })
  
  return true
}

// Function to release a sync lock
function releaseSyncLock(connectionId: string) {
  const lock = syncLocks.get(connectionId)
  if (lock) {
    lock.is_active = false
    syncLocks.delete(connectionId)
  }
}

// Function to send SSE message and persist progress
async function recordProgress(supabase: SupabaseClient<Database>, connectionId: string, data: any) {
  try {
    // Persist only known event types
    const payload: any = {
      connection_id: connectionId,
      type: data.type || 'progress',
      month: data.month || null,
      message: data.message || null,
      found_analyst_meetings: data.foundAnalystMeetings ?? null,
      total_events_processed: data.totalEventsProcessed ?? null,
      relevant_meetings_count: data.relevantMeetingsCount ?? null,
    }
    await supabase.from('calendar_sync_progress').insert(payload)
  } catch (err) {
    console.error('Failed to record sync progress:', err)
  }
}

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

async function startCalendarSync(
  connectionId: string, 
  forceSync: boolean = false, 
  supabase: SupabaseClient<Database>,
  timeWindowOptions?: {
    timeWindow: 'future' | 'custom' | 'all'
    startDate?: string
    endDate?: string
    includePast: boolean
  }
) {
  try {
    sendSSEMessage(connectionId, { type: 'progress', message: 'Starting calendar sync...', progress: 0 })
    await recordProgress(supabase, connectionId, { type: 'progress', message: 'Starting calendar sync...' })

    // Get calendar connection
    const { data: connection, error: connectionError } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (connectionError || !connection) {
      throw new Error('Calendar connection not found')
    }

    if (!connection.is_active) {
      throw new Error('Calendar connection is not active')
    }

    sendSSEMessage(connectionId, { type: 'progress', message: 'Validating calendar connection...', progress: 10 })
    await recordProgress(supabase, connectionId, { type: 'progress', message: 'Validating calendar connection...' })

    // Set up Google Calendar API
    const access_token = decryptToken(connection.access_token)
    oauth2Client.setCredentials({ access_token: access_token })
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    sendSSEMessage(connectionId, { type: 'progress', message: 'Fetching calendar events...', progress: 20 })
    await recordProgress(supabase, connectionId, { type: 'progress', message: 'Fetching calendar events...' })

    // Calculate time range based on options
    const now = new Date()
    let timeMin: Date
    let timeMaxDate: Date

    if (timeWindowOptions?.timeWindow === 'future') {
      // Future meetings only: from today to 6 months ahead
      timeMin = new Date(now.getFullYear(), now.getMonth(), now.getDate()) // Start of today
      timeMaxDate = new Date(now)
      timeMaxDate.setMonth(timeMaxDate.getMonth() + 6)
    } else if (timeWindowOptions?.timeWindow === 'custom' && timeWindowOptions.startDate && timeWindowOptions.endDate) {
      // Custom date range
      timeMin = new Date(timeWindowOptions.startDate)
      timeMaxDate = new Date(timeWindowOptions.endDate)
      timeMaxDate.setHours(23, 59, 59, 999) // End of the end date
    } else {
      // Default: all meetings from Jan 1, 2024 to 6 months ahead
      timeMin = new Date(Date.UTC(2024, 0, 1, 0, 0, 0))
      timeMaxDate = new Date(now)
      timeMaxDate.setMonth(timeMaxDate.getMonth() + 6)
    }

    // Validate date range
    if (timeMin >= timeMaxDate) {
      throw new Error('Invalid date range: start date must be before end date')
    }

    // Log the time range being used
    console.log(`📅 Calendar sync time range: ${timeMin.toISOString()} to ${timeMaxDate.toISOString()}`)
    
    sendSSEMessage(connectionId, { 
      type: 'progress', 
      message: `Fetching events from ${timeMin.toLocaleDateString()} to ${timeMaxDate.toLocaleDateString()}...`, 
      progress: 25 
    })

    // Fetch events from Google Calendar with pagination
    const events: any[] = []
    let pageToken: string | undefined = undefined
    do {
      const resp = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMaxDate.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 2500,
        pageToken
      })
      events.push(...(resp.data.items || []))
      pageToken = resp.data.nextPageToken || undefined
    } while (pageToken)
    
    sendSSEMessage(connectionId, { type: 'progress', message: `Found ${events.length} calendar events`, progress: 40 })
    await recordProgress(supabase, connectionId, { type: 'progress', message: `Found ${events.length} calendar events` })

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

    // Process events grouped by month
    let currentMonthKey: string | null = null
    let currentMonthLabel: string | null = null
    let currentMonthAnalystCount = 0

    const formatMonthLabel = (d: Date) => d.toLocaleString('en-US', { month: 'long', year: 'numeric' })

    for (const event of events) {
      try {
        if (!event.start?.dateTime || !event.end?.dateTime) continue

        const start_time = new Date(event.start.dateTime)
        const end_time = new Date(event.end.dateTime)
        const durationMinutes = Math.max(1, Math.round((end_time.getTime() - start_time.getTime()) / (60 * 1000)))
        const attendeeEmails = event.attendees?.map(a => a.email).filter(Boolean) || []

        // Month boundary handling
        const monthKey = `${start_time.getUTCFullYear()}-${String(start_time.getUTCMonth() + 1).padStart(2, '0')}`
        if (currentMonthKey === null) {
          currentMonthKey = monthKey
          currentMonthLabel = formatMonthLabel(start_time)
          sendSSEMessage(connectionId, { type: 'month_started', month: currentMonthLabel })
          await recordProgress(supabase, connectionId, { type: 'month_started', month: currentMonthLabel })
        } else if (monthKey !== currentMonthKey) {
          // Emit summary for previous month
          if (currentMonthLabel) {
            sendSSEMessage(connectionId, { type: 'month_result', month: currentMonthLabel, foundAnalystMeetings: currentMonthAnalystCount })
            await recordProgress(supabase, connectionId, { type: 'month_result', month: currentMonthLabel, foundAnalystMeetings: currentMonthAnalystCount })
          }
          // Start new month
          currentMonthKey = monthKey
          currentMonthLabel = formatMonthLabel(start_time)
          currentMonthAnalystCount = 0
          sendSSEMessage(connectionId, { type: 'month_started', month: currentMonthLabel })
          await recordProgress(supabase, connectionId, { type: 'month_started', month: currentMonthLabel })
        }
        
        // Check for duplicate briefing
        const briefingKey = `${event.summary}|${start_time.toISOString()}`
        const isDuplicate = briefingSet.has(briefingKey)

        if (!isDuplicate) {
          // Try to match attendees with analysts
          const matchedAnalysts = attendeeEmails
            .map(email => email ? matchAnalystByEmail(email, analysts) : null)
            .filter(Boolean) as any[]

          // Create or upsert calendar meeting record
          const meetingData: CalendarMeetingInsert = {
            id: generateId(),
            calendar_connection_id: connection.id,
            google_event_id: event.id || generateId(),
            title: event.summary || 'Untitled Meeting',
            description: event.description || null,
            start_time: start_time.toISOString(),
            end_time: end_time.toISOString(),
            attendees: attendeeEmails.length ? JSON.stringify(attendeeEmails) : null,
            analyst_id: matchedAnalysts[0]?.id || null,
            is_analyst_meeting: matchedAnalysts.length > 0,
            confidence: matchedAnalysts.length > 0 ? 0.8 : 0.0,
            tags: null
          }

          const { error: meetingError } = await supabase
            .from('calendar_meetings')
            .upsert(meetingData, { onConflict: 'google_event_id' })

          if (!meetingError) {
            createdMeetings++
          }

          // Create briefing if it's a relevant meeting and not duplicate
          if (event.summary && matchedAnalysts.length > 0) {
            currentMonthAnalystCount += 1
            // Emit realtime increment for analyst meetings discovered
            sendSSEMessage(connectionId, { type: 'analyst_meeting_found' })
            await recordProgress(supabase, connectionId, { type: 'analyst_meeting_found' })
            const briefingData: BriefingInsert = {
              id: generateId(),
              title: event.summary,
              description: event.description || `Meeting with ${matchedAnalysts.map(a => `${a.firstName} ${a.lastName}`).join(', ')}`,
              scheduledAt: start_time.toISOString(),
              status: start_time > now ? 'SCHEDULED' : 'COMPLETED',
              agenda: event.location ? `Location: ${event.location}` : null,
              duration: durationMinutes as any,
              notes: null
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
                analystId: analyst.id
              }))

              await supabase
                .from('briefing_analysts')
                .insert(briefingAnalysts)
            }
          }
        }

        processedEvents++
        // Emit total processed counter increment
        sendSSEMessage(connectionId, {
          type: 'event_processed'
        })
        // No per-event progress row to keep UI concise

      } catch (eventError) {
        console.error('Error processing event:', eventError)
        // Continue with other events
      }
    }

    // Emit summary for last month
    if (currentMonthLabel) {
      sendSSEMessage(connectionId, { type: 'month_result', month: currentMonthLabel, foundAnalystMeetings: currentMonthAnalystCount })
      await recordProgress(supabase, connectionId, { type: 'month_result', month: currentMonthLabel, foundAnalystMeetings: currentMonthAnalystCount })
    }

    // Update connection sync timestamp
    await supabase
      .from('calendar_connections')
      .update({ last_sync_at: new Date().toISOString() })
      .eq('id', connection.id)

    sendSSEMessage(connectionId, { type: 'progress', message: 'Calendar sync completed successfully', progress: 100 })
    await recordProgress(supabase, connectionId, { type: 'progress', message: 'Calendar sync completed successfully' })

    sendSSEMessage(connectionId, { type: 'complete', summary: { totalEvents: events.length, processedEvents, createdBriefings, createdMeetings } })
    await recordProgress(supabase, connectionId, { type: 'complete' })

    console.log(`✅ Calendar sync completed: ${createdBriefings} briefings, ${createdMeetings} meetings`)

  } catch (error) {
    console.error('Calendar sync error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error occurred'
    sendSSEMessage(connectionId, { type: 'error', message: errMsg })
    try { await recordProgress(supabase, connectionId, { type: 'error', message: errMsg }) } catch {}
  } finally {
    releaseSyncLock(connectionId)
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
    const body = await request.json().catch(() => ({})) as { 
      user_id?: string; 
      forceSync?: boolean;
      timeWindowOptions?: {
        timeWindow: 'future' | 'custom' | 'all'
        startDate?: string
        endDate?: string
        includePast: boolean
      }
    }
    const forceSync = body.forceSync
    const timeWindowOptions = body.timeWindowOptions

    // Allow internal jobs to bypass user authentication using a shared secret
    const internalSecret = process.env.INTERNAL_JOB_SECRET
    const providedSecret = request.headers.get('x-internal-job')
    let isInternal = false
    if (internalSecret && providedSecret && providedSecret === internalSecret) {
      isInternal = true
    }

    if (!isInternal) {
      // Require auth to start sync when not an internal job
      const authResult = await requireAuth()
      if (authResult instanceof NextResponse) {
        return authResult
      }
      // const authUser = authResult // currently unused
    }

    // Check if sync is already in progress
    if (!acquireSyncLock(connectionId)) {
      return NextResponse.json(
        { error: 'Calendar sync already in progress' },
        { status: 409 }
      )
    }

    // Build appropriate Supabase client
    let supabaseClient: SupabaseClient<Database>
    if (isInternal) {
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!serviceRoleKey || !supabaseUrl) {
        return NextResponse.json(
          { error: 'Server misconfiguration: missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL' },
          { status: 500 }
        )
      }
      supabaseClient = createServiceClient<Database>(supabaseUrl, serviceRoleKey)
    } else {
      supabaseClient = await createClient()
    }

    // Start the sync process asynchronously with time window options
    startCalendarSync(connectionId, forceSync, supabaseClient, timeWindowOptions)

    return NextResponse.json({
      success: true,
      message: 'Calendar sync started'
    })

  } catch (error) {
    console.error('Error starting calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to start calendar sync' },
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

  // Set up SSE
  console.log(`🔌 [SSE] GET connect for connectionId=${connectionId} at ${new Date().toISOString()}`)
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()
      const connection = {
        write: (data: string) => {
          controller.enqueue(encoder.encode(data))
        },
        end: () => {
          try { controller.close() } catch {}
        }
      } as any
      
      // Heartbeat to keep the connection alive through proxies/runtimes
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':keepalive\n\n'))
        } catch {}
      }, 15000)
      ;(connection as any).heartbeat = heartbeat

      syncConnections.set(connectionId, connection)
      
      // Send initial connection confirmation
      connection.write('data: {"type":"connected"}\n\n')
      console.log(`✅ [SSE] Stream opened for connectionId=${connectionId}`)
    },
    cancel() {
      console.log(`❌ [SSE] Stream canceled for connectionId=${connectionId}`)
      const existing = syncConnections.get(connectionId) as any
      if (existing && existing.heartbeat) {
        clearInterval(existing.heartbeat)
      }
      syncConnections.delete(connectionId)
    }
  })

  return new NextResponse(stream, {
    headers: {
'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
