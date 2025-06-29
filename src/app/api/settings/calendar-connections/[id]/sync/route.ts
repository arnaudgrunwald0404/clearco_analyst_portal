import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { PrismaClient } from '@prisma/client'
import CryptoJS from 'crypto-js'

const prisma = new PrismaClient()

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

// Store for SSE connections
const syncConnections = new Map<string, any>()

// POST - Start calendar sync with real-time progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params
    const userId = 'user-1' // This should come from auth in production

    console.log(`🔄 Starting calendar sync for connection: ${connectionId}`)

    // Get the calendar connection
    const connection = await prisma.calendarConnection.findFirst({
      where: {
        id: connectionId,
        userId: userId,
        isActive: true,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Calendar connection not found or inactive' },
        { status: 404 }
      )
    }

    // Start the sync process asynchronously
    startCalendarSync(connection)

    return NextResponse.json({ 
      success: true, 
      message: 'Calendar sync started',
      connectionId 
    })

  } catch (error) {
    console.error('Error starting calendar sync:', error)
    return NextResponse.json(
      { error: 'Failed to start calendar sync' },
      { status: 500 }
    )
  }
}

// GET - Server-Sent Events endpoint for real-time sync progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: connectionId } = await params
  
  const stream = new ReadableStream({
    start(controller) {
      // Store the controller for this connection
      syncConnections.set(connectionId, controller)
      
      // Send initial connection message
      const data = `data: ${JSON.stringify({
        type: 'connected',
        connectionId,
        timestamp: new Date().toISOString()
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(data))
      
      console.log(`📡 SSE connection established for calendar: ${connectionId}`)
    },
    cancel() {
      // Clean up when client disconnects
      syncConnections.delete(connectionId)
      console.log(`📡 SSE connection closed for calendar: ${connectionId}`)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}

async function startCalendarSync(connection: any) {
  const connectionId = connection.id
  let relevantMeetingsCount = 0
  
  try {
    // Send sync started message
    sendProgressUpdate(connectionId, {
      type: 'sync_started',
      message: 'Starting calendar sync...',
      relevantMeetingsCount: 0
    })

    // Set up OAuth credentials
    const accessToken = decryptToken(connection.accessToken)
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: connection.refreshToken ? decryptToken(connection.refreshToken) : undefined,
    })

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

    // Get all analysts for matching
    const analysts = await prisma.analyst.findMany({
      where: { status: { not: 'ARCHIVED' } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
      }
    })

    sendProgressUpdate(connectionId, {
      type: 'analysts_loaded',
      message: `Loaded ${analysts.length} analysts for matching`,
      relevantMeetingsCount
    })

    // Get calendar events from the last 6 months
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    let pageToken: string | undefined = undefined
    let totalEventsProcessed = 0

    do {
      sendProgressUpdate(connectionId, {
        type: 'fetching_events',
        message: `Fetching calendar events... (${totalEventsProcessed} processed so far)`,
        relevantMeetingsCount
      })

      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: sixMonthsAgo.toISOString(),
        timeMax: new Date().toISOString(),
        maxResults: 50, // Process in smaller batches for better progress updates
        singleEvents: true,
        orderBy: 'startTime',
        pageToken,
      })

      const events = response.data.items || []
      pageToken = response.data.nextPageToken || undefined
      totalEventsProcessed += events.length

      sendProgressUpdate(connectionId, {
        type: 'processing_events',
        message: `Processing ${events.length} events...`,
        relevantMeetingsCount,
        totalEventsProcessed
      })

      // Process each event to find analyst meetings
      for (const event of events) {
        if (!event.attendees || !event.start?.dateTime) continue

        // Check if any attendees match our analysts
        const attendeeEmails = event.attendees.map(a => a.email?.toLowerCase()).filter(Boolean)
        
        for (const analyst of analysts) {
          if (attendeeEmails.includes(analyst.email.toLowerCase())) {
            // Found a relevant meeting!
            relevantMeetingsCount++
            
            const startTime = new Date(event.start.dateTime)
            const endTime = event.end?.dateTime ? new Date(event.end.dateTime) : new Date(startTime.getTime() + 60 * 60 * 1000) // Default 1 hour

            // Save or update the meeting
            await prisma.calendarMeeting.upsert({
              where: {
                calendarConnectionId_googleEventId: {
                  calendarConnectionId: connectionId,
                  googleEventId: event.id!,
                }
              },
              update: {
                title: event.summary || 'Untitled Meeting',
                description: event.description || null,
                startTime,
                endTime,
                attendees: JSON.stringify(attendeeEmails),
                analystId: analyst.id,
                isAnalystMeeting: true,
                confidence: 1.0, // High confidence for email match
                tags: JSON.stringify([analyst.company, 'calendar-sync'].filter(Boolean)),
                updatedAt: new Date(),
              },
              create: {
                calendarConnectionId: connectionId,
                googleEventId: event.id!,
                title: event.summary || 'Untitled Meeting',
                description: event.description || null,
                startTime,
                endTime,
                attendees: JSON.stringify(attendeeEmails),
                analystId: analyst.id,
                isAnalystMeeting: true,
                confidence: 1.0,
                tags: JSON.stringify([analyst.company, 'calendar-sync'].filter(Boolean)),
              }
            })

            sendProgressUpdate(connectionId, {
              type: 'meeting_found',
              message: `Found meeting with ${analyst.firstName} ${analyst.lastName} (${analyst.company})`,
              relevantMeetingsCount,
              totalEventsProcessed,
              lastAnalystFound: `${analyst.firstName} ${analyst.lastName}`
            })

            // Small delay to make the updates visible
            await new Promise(resolve => setTimeout(resolve, 100))
            break // Only match with the first analyst found in attendees
          }
        }
      }

      // Update progress after processing this batch
      sendProgressUpdate(connectionId, {
        type: 'batch_processed',
        message: `Processed ${totalEventsProcessed} events, found ${relevantMeetingsCount} relevant meetings`,
        relevantMeetingsCount,
        totalEventsProcessed
      })

    } while (pageToken)

    // Update the connection's last sync time
    await prisma.calendarConnection.update({
      where: { id: connectionId },
      data: {
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // Send completion message
    sendProgressUpdate(connectionId, {
      type: 'sync_completed',
      message: `Sync completed! Found ${relevantMeetingsCount} relevant meetings out of ${totalEventsProcessed} total events.`,
      relevantMeetingsCount,
      totalEventsProcessed,
      completed: true
    })

    console.log(`✅ Calendar sync completed for ${connectionId}: ${relevantMeetingsCount} meetings found`)

  } catch (error) {
    console.error(`❌ Calendar sync failed for ${connectionId}:`, error)
    
    sendProgressUpdate(connectionId, {
      type: 'sync_error',
      message: `Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      relevantMeetingsCount,
      error: true
    })
  } finally {
    // Close the SSE connection after a delay
    setTimeout(() => {
      const controller = syncConnections.get(connectionId)
      if (controller) {
        try {
          controller.close()
        } catch (e) {
          // Connection might already be closed
        }
        syncConnections.delete(connectionId)
      }
    }, 5000) // Keep connection open for 5 seconds after completion
  }
}

function sendProgressUpdate(connectionId: string, data: any) {
  const controller = syncConnections.get(connectionId)
  if (controller) {
    try {
      const message = `data: ${JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      })}\n\n`
      
      controller.enqueue(new TextEncoder().encode(message))
    } catch (error) {
      console.warn(`Failed to send progress update for ${connectionId}:`, error)
    }
  }
}
