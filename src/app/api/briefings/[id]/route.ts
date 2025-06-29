import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const briefing = await prisma.briefing.findUnique({
      where: { id },
      include: {
        analysts: {
          include: {
            analyst: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                title: true,
                profileImageUrl: true
              }
            }
          }
        },
        calendarMeeting: {
          select: {
            id: true,
            title: true,
            startTime: true,
            endTime: true,
            attendees: true,
            description: true
          }
        }
      }
    })

    if (!briefing) {
      return NextResponse.json(
        { success: false, error: 'Briefing not found' },
        { status: 404 }
      )
    }

    // Process briefing for better frontend consumption
    const processedBriefing = {
      ...briefing,
      agenda: briefing.agenda ? JSON.parse(briefing.agenda) : [],
      outcomes: briefing.outcomes ? JSON.parse(briefing.outcomes) : [],
      followUpActions: briefing.followUpActions ? JSON.parse(briefing.followUpActions) : [],
      attendeeEmails: briefing.attendeeEmails ? JSON.parse(briefing.attendeeEmails) : [],
      analysts: briefing.analysts.map(ba => ({
        ...ba.analyst,
        role: ba.role
      })),
      calendarMeeting: briefing.calendarMeeting ? {
        ...briefing.calendarMeeting,
        attendees: briefing.calendarMeeting.attendees ? JSON.parse(briefing.calendarMeeting.attendees) : []
      } : null
    }

    return NextResponse.json({
      success: true,
      data: processedBriefing
    })

  } catch (error) {
    console.error('Error fetching briefing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch briefing' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      title,
      description,
      status,
      notes,
      outcomes,
      followUpActions,
      transcript,
      recordingUrl,
      completedAt,
      analystIds
    } = body

    // Check if briefing exists
    const existingBriefing = await prisma.briefing.findUnique({
      where: { id },
      include: { analysts: true }
    })

    if (!existingBriefing) {
      return NextResponse.json(
        { success: false, error: 'Briefing not found' },
        { status: 404 }
      )
    }

    // Update briefing
    const updateData: any = {}
    
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED' && !existingBriefing.completedAt) {
        updateData.completedAt = new Date()
      }
    }
    if (completedAt !== undefined) updateData.completedAt = completedAt ? new Date(completedAt) : null
    if (notes !== undefined) updateData.notes = notes
    if (outcomes !== undefined) updateData.outcomes = JSON.stringify(outcomes)
    if (followUpActions !== undefined) updateData.followUpActions = JSON.stringify(followUpActions)
    if (transcript !== undefined) updateData.transcript = transcript
    if (recordingUrl !== undefined) updateData.recordingUrl = recordingUrl

    // Generate AI summary if transcript is provided and no existing summary
    if (transcript && !existingBriefing.aiSummary) {
      try {
        const summary = await generateAISummary(transcript, existingBriefing.title)
        updateData.aiSummary = summary.summary
        updateData.followUpSummary = summary.followUps
      } catch (error) {
        console.error('Error generating AI summary:', error)
        // Continue without AI summary
      }
    }

    const briefing = await prisma.briefing.update({
      where: { id },
      data: updateData,
      include: {
        analysts: {
          include: {
            analyst: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                company: true,
                title: true,
                profileImageUrl: true
              }
            }
          }
        }
      }
    })

    // Update analyst relationships if provided
    if (analystIds) {
      // Remove existing relationships
      await prisma.briefingAnalyst.deleteMany({
        where: { briefingId: id }
      })

      // Create new relationships
      await prisma.briefingAnalyst.createMany({
        data: analystIds.map((analystId: string, index: number) => ({
          briefingId: id,
          analystId,
          role: index === 0 ? 'PRIMARY' : 'SECONDARY'
        }))
      })

      // Fetch updated briefing with new relationships
      const updatedBriefing = await prisma.briefing.findUnique({
        where: { id },
        include: {
          analysts: {
            include: {
              analyst: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  company: true,
                  title: true,
                  profileImageUrl: true
                }
              }
            }
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          ...updatedBriefing,
          agenda: updatedBriefing?.agenda ? JSON.parse(updatedBriefing.agenda) : [],
          outcomes: updatedBriefing?.outcomes ? JSON.parse(updatedBriefing.outcomes) : [],
          followUpActions: updatedBriefing?.followUpActions ? JSON.parse(updatedBriefing.followUpActions) : [],
          attendeeEmails: updatedBriefing?.attendeeEmails ? JSON.parse(updatedBriefing.attendeeEmails) : [],
          analysts: updatedBriefing?.analysts.map(ba => ({
            ...ba.analyst,
            role: ba.role
          })) || []
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...briefing,
        agenda: briefing.agenda ? JSON.parse(briefing.agenda) : [],
        outcomes: briefing.outcomes ? JSON.parse(briefing.outcomes) : [],
        followUpActions: briefing.followUpActions ? JSON.parse(briefing.followUpActions) : [],
        attendeeEmails: briefing.attendeeEmails ? JSON.parse(briefing.attendeeEmails) : [],
        analysts: briefing.analysts.map(ba => ({
          ...ba.analyst,
          role: ba.role
        }))
      }
    })

  } catch (error) {
    console.error('Error updating briefing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update briefing' },
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

    await prisma.briefing.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Briefing deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting briefing:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete briefing' },
      { status: 500 }
    )
  }
}

async function generateAISummary(transcript: string, meetingTitle: string) {
  const prompt = `
You are an AI assistant analyzing a transcript from an analyst briefing meeting titled "${meetingTitle}".

Please provide:
1. A concise TLDR summary (2-3 sentences)
2. Key discussion points (3-5 bullet points)
3. Follow-up actions needed (if any)

Transcript:
${transcript}

Please format your response as JSON with the following structure:
{
  "summary": "TLDR summary here",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "followUps": ["Action 1", "Action 2"]
}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    max_tokens: 1000
  })

  const content = response.choices[0]?.message?.content
  if (!content) {
    throw new Error('No response from OpenAI')
  }

  try {
    const parsed = JSON.parse(content)
    return {
      summary: `**TLDR:** ${parsed.summary}\n\n**Key Points:**\n${parsed.keyPoints.map((point: string) => `• ${point}`).join('\n')}`,
      followUps: parsed.followUps?.join('\n• ') || ''
    }
  } catch (error) {
    // Fallback to raw content if JSON parsing fails
    return {
      summary: content,
      followUps: ''
    }
  }
}
