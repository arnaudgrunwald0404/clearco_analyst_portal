import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/crypto'

// This is a placeholder for Gong API integration
// When ready to implement, install the Gong SDK or use direct HTTP calls

interface GongMeeting {
  id: string
  title: string
  startTime: string
  endTime: string
  participants: string[]
  recordingUrl?: string
  transcript?: string
}

class GongAPIService {
  private apiKey: string
  private subdomain: string
  private baseUrl: string

  constructor(apiKey: string, subdomain: string) {
    this.apiKey = apiKey
    this.subdomain = subdomain
    this.baseUrl = `https://${subdomain}.gong.io/v2/`
  }

  // Fetch meetings from Gong API
  async getMeetings(startDate: Date, endDate: Date): Promise<GongMeeting[]> {
    try {
      console.log('Fetching Gong meetings from', startDate.toISOString(), 'to', endDate.toISOString())
      
      const response = await fetch(`${this.baseUrl}calls`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        body: JSON.stringify({
          filter: {
            fromDateTime: startDate.toISOString(),
            toDateTime: endDate.toISOString()
          },
          contentSelector: {
            exposedFields: {
              parties: true,
              content: true,
              context: true
            }
          }
        })
      })
      
      if (!response.ok) {
        console.error('Gong API error:', response.status, response.statusText)
        return []
      }
      
      const data = await response.json()
      
      if (!data.calls || !Array.isArray(data.calls)) {
        console.log('No calls found in Gong response')
        return []
      }
      
      return data.calls.map((call: any) => ({
        id: call.id,
        title: call.title || 'Untitled Meeting',
        startTime: call.actualStart || call.scheduled,
        endTime: call.actualEnd || call.scheduled,
        participants: call.parties?.map((p: any) => p.emailAddress).filter(Boolean) || [],
        recordingUrl: call.recordingUrl,
        transcript: null // Will be fetched separately if needed
      }))
    } catch (error) {
      console.error('Error fetching Gong meetings:', error)
      return []
    }
  }

  // Fetch meeting transcript from Gong API
  async getMeetingTranscript(meetingId: string): Promise<string | null> {
    try {
      console.log('Fetching transcript for Gong meeting:', meetingId)
      
      const response = await fetch(`${this.baseUrl}calls/${meetingId}/transcript`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('Gong transcript API error:', response.status, response.statusText)
        return null
      }
      
      const data = await response.json()
      
      if (data.transcript && Array.isArray(data.transcript)) {
        // Convert Gong transcript format to plain text
        return data.transcript
          .map((segment: any) => `[${segment.speakerName || 'Speaker'}]: ${segment.transcript}`)
          .join('\n')
      }
      
      return data.transcript || null
    } catch (error) {
      console.error('Error fetching Gong transcript:', error)
      return null
    }
  }

  // Fetch meeting recording URL from Gong API
  async getMeetingRecording(meetingId: string): Promise<string | null> {
    try {
      console.log('Fetching recording for Gong meeting:', meetingId)
      
      const response = await fetch(`${this.baseUrl}calls/${meetingId}/media`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        console.error('Gong media API error:', response.status, response.statusText)
        return null
      }
      
      const data = await response.json()
      return data.recordingUrl || data.audioUrl || null
    } catch (error) {
      console.error('Error fetching Gong recording:', error)
      return null
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { days = 7 } = body

    // Check if Gong is configured and active
    const config = await prisma.gongConfig.findFirst()
    
    if (!config || !config.isActive) {
      return NextResponse.json({
        success: false,
        error: 'Gong integration is not configured or disabled'
      }, { status: 400 })
    }

    // Decrypt API key
    const apiKey = decrypt(config.apiKey)
    
    // Initialize Gong service
    const gongService = new GongAPIService(apiKey, config.subdomain)
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Fetch meetings from Gong
    const gongMeetings = await gongService.getMeetings(startDate, endDate)
    
    // Get all analysts to match against meeting participants
    const analysts = await prisma.analyst.findMany({
      select: { id: true, email: true, firstName: true, lastName: true }
    })
    
    const analystEmails = new Set(analysts.map(a => a.email.toLowerCase()))
    
    const syncResults = {
      processed: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0
    }

    // Process each Gong meeting
    for (const gongMeeting of gongMeetings) {
      try {
        syncResults.processed++
        
        // Find matching analysts by email
        const matchingAnalysts = gongMeeting.participants
          .filter(email => analystEmails.has(email.toLowerCase()))
          .map(email => analysts.find(a => a.email.toLowerCase() === email.toLowerCase()))
          .filter(Boolean)
        
        if (matchingAnalysts.length === 0) {
          syncResults.skipped++
          continue
        }
        
        // Check if briefing already exists for this Gong meeting
        const existingBriefing = await prisma.briefing.findFirst({
          where: { gongMeetingId: gongMeeting.id }
        })
        
        if (existingBriefing) {
          // Update existing briefing if needed
          const updateData: any = {}
          
          if (gongMeeting.transcript && !existingBriefing.transcript) {
            updateData.transcript = gongMeeting.transcript
          }
          
          if (gongMeeting.recordingUrl && !existingBriefing.recordingUrl) {
            updateData.recordingUrl = gongMeeting.recordingUrl
          }
          
          if (Object.keys(updateData).length > 0) {
            await prisma.briefing.update({
              where: { id: existingBriefing.id },
              data: updateData
            })
            syncResults.updated++
          } else {
            syncResults.skipped++
          }
        } else {
          // Create new briefing
          const briefing = await prisma.briefing.create({
            data: {
              title: gongMeeting.title,
              scheduledAt: new Date(gongMeeting.startTime),
              completedAt: new Date(gongMeeting.endTime),
              status: 'COMPLETED',
              gongMeetingId: gongMeeting.id,
              transcript: gongMeeting.transcript,
              recordingUrl: gongMeeting.recordingUrl,
              attendeeEmails: JSON.stringify(gongMeeting.participants),
              duration: Math.round(
                (new Date(gongMeeting.endTime).getTime() - new Date(gongMeeting.startTime).getTime()) / (1000 * 60)
              ),
              analysts: {
                create: matchingAnalysts.map((analyst, index) => ({
                  analystId: analyst!.id,
                  role: index === 0 ? 'PRIMARY' : 'SECONDARY'
                }))
              }
            }
          })
          
          syncResults.created++
        }
        
      } catch (error) {
        console.error(`Error processing Gong meeting ${gongMeeting.id}:`, error)
        syncResults.errors++
      }
    }

    // Update last sync time
    await prisma.gongConfig.update({
      where: { id: config.id },
      data: { lastSyncAt: new Date() }
    })

    return NextResponse.json({
      success: true,
      message: `Gong sync completed`,
      results: syncResults
    })

  } catch (error) {
    console.error('Error syncing with Gong:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to sync with Gong' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get sync status and configuration
    const config = await prisma.gongConfig.findFirst()
    
    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          isConfigured: false,
          isActive: false,
          lastSyncAt: null,
          totalBriefingsFromGong: 0
        }
      })
    }

    // Count briefings synced from Gong
    const totalBriefingsFromGong = await prisma.briefing.count({
      where: { gongMeetingId: { not: null } }
    })

    return NextResponse.json({
      success: true,
      data: {
        isConfigured: true,
        isActive: config.isActive,
        lastSyncAt: config.lastSyncAt,
        totalBriefingsFromGong,
        subdomain: config.subdomain
      }
    })

  } catch (error) {
    console.error('Error fetching Gong sync status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sync status' },
      { status: 500 }
    )
  }
}
