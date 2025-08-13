import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get briefing with associated analysts
    const { data: briefing, error: briefingError } = await supabase
      .from('briefings')
      .select('*')
      .eq('id', id)
      .single()

    if (briefingError || !briefing) {
      return NextResponse.json(
        { error: 'Briefing not found' },
        { status: 404 }
      )
    }

    // Get associated analysts through briefing_analysts junction table
    const { data: briefingAnalysts, error: analystsError } = await supabase
      .from('briefing_analysts')
      .select(`
        id,
        briefingId,
        analystId,
        analysts!inner(
          id,
          firstName,
          lastName,
          email,
          company,
          title,
          profileImageUrl
        )
      `)
      .eq('briefingId', id)

    if (analystsError) {
      console.error('Error fetching briefing analysts:', analystsError)
    }

    // Format the response to match the expected structure
    const formattedBriefing = {
      ...briefing,
      // Normalize DB field name to camelCase for the client
      contentUrl: (briefing as any).contentUrl ?? (briefing as any).contenturl ?? null,
      analysts: (briefingAnalysts || []).map((ba: any) => ({
        id: ba.id,
        briefingId: briefing.id,
        analystId: ba.analystId,
        analyst: ba.analysts
      }))
    }

    return NextResponse.json(formattedBriefing)

  } catch (error) {
    console.error('Error fetching briefing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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
      title,
      description,
      scheduledAt,
      duration,
      status,
      outcomes,
      followUpActions,
      analystIds,
      contentUrl,
      contenturl
    } = body

    const supabase = await createClient()

    // Update briefing
    const { data: updatedBriefing, error: updateError } = await supabase
      .from('briefings')
      .update({
        title,
        description,
        scheduledAt,
        duration,
        status,
        outcomes,
        followUpActions,
        // Write to the actual DB column name (contenturl), prefer explicit body key then camelCase
        contenturl: contenturl !== undefined ? contenturl : (typeof contentUrl !== 'undefined' ? contentUrl : undefined),
        updatedAt: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating briefing:', updateError)
      return NextResponse.json(
        { error: 'Failed to update briefing' },
        { status: 500 }
      )
    }

    // Update analyst associations if provided
    if (analystIds && Array.isArray(analystIds)) {
      // Remove existing associations
      await supabase
        .from('briefing_analysts')
        .delete()
        .eq('briefingId', id)

      // Add new associations
      if (analystIds.length > 0) {
        const associations = analystIds.map((analystId: string) => ({
          id: generateId(),
          briefingId: id,
          analystId,
          createdAt: new Date().toISOString()
        }))

        const { error: associationError } = await supabase
          .from('briefing_analysts')
          .insert(associations)

        if (associationError) {
          console.error('Error updating briefing analysts:', associationError)
          // Continue anyway as the briefing was updated successfully
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Briefing updated successfully',
      data: updatedBriefing
    })

  } catch (error) {
    console.error('Error updating briefing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

    const supabase = await createClient()

    // Build update object with only defined keys
    const allowedKeys = [
      'title',
      'description',
      'scheduledAt',
      'duration',
      'status',
      'agenda',
      'notes',
      'outcomes',
      'followUpActions',
      'recordingUrl',
      'transcript',
      'ai_summary',
      'contentUrl', // client may send camelCase
      'contenturl', // actual DB column
    ] as const

    const updateData: Record<string, any> = { updatedAt: new Date().toISOString() }
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(body, key) && body[key] !== undefined) {
        updateData[key] = body[key]
      }
    }

    // Normalize to DB column name if client sent camelCase
    if (Object.prototype.hasOwnProperty.call(updateData, 'contentUrl')) {
      updateData['contenturl'] = updateData['contentUrl']
      delete updateData['contentUrl']
    }

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ success: false, error: 'No valid fields to update' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('briefings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error patching briefing:', error)
      const message = typeof (error as any)?.message === 'string' ? (error as any).message : 'Failed to update briefing'
      return NextResponse.json({ success: false, error: message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error in briefing PATCH:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Ensure junction rows are removed to keep data clean in case CASCADE is not present
    const { error: junctionError } = await supabase
      .from('briefing_analysts')
      .delete()
      .eq('briefingId', id)

    if (junctionError) {
      console.error('Error deleting briefing_analysts for briefing:', id, junctionError)
      // Continue anyway; we'll still attempt to delete the briefing
    }

    const { error: deleteError } = await supabase
      .from('briefings')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting briefing:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete briefing' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Briefing deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting briefing:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { action } = body

    if (action === 'generate-summary') {
      const supabase = await createClient()

      // Get briefing details
      const { data: briefing, error: briefingError } = await supabase
        .from('briefings')
        .select('*')
        .eq('id', id)
        .single()

      if (briefingError || !briefing) {
        return NextResponse.json(
          { error: 'Briefing not found' },
          { status: 404 }
        )
      }

      // Get associated analysts
      const { data: briefingAnalysts, error: analystsError } = await supabase
        .from('briefing_analysts')
        .select(`
          analysts!inner(firstName, lastName, company, title)
        `)
        .eq('briefingId', id)

      if (analystsError) {
        console.error('Error fetching briefing analysts:', analystsError)
        return NextResponse.json(
          { error: 'Failed to fetch briefing analysts' },
          { status: 500 }
        )
      }

      const analysts = (briefingAnalysts || []).map((ba: any) => ba.analysts)

      try {
        const transcript = (briefing as any).transcript || ''
        const prompt = `You are a helpful assistant that summarizes analyst briefings.

Summarize the following meeting into clear bullet points with exactly these sections:

- Key topics discussed
- Follow-up items
- Interesting quotes (FOCUS on what the INDUSTRY ANALYST is saying, not the PreferredDomain/client team)

Context:
Title: ${briefing.title}
Description: ${briefing.description || 'No description provided'}
Duration: ${briefing.duration || 'Unknown'} minutes
Industry Analysts: ${analysts.map((a: any) => `${a.firstName} ${a.lastName}${a.title ? ` (${a.title}` : ''}${a.company ? `${a.title ? ' at ' : ' ('}${a.company})` : a.title ? ')' : ''}`).join(', ')}

Transcript:
"""
${transcript}
"""

Instructions:
- Output must be concise and formatted as bullet lists under each section.
- Follow-up items: Each bullet MUST begin with the OWNER name followed by a colon and the action (e.g., "Sarah Chen: Send ROI case studies"). Use a participant/speaker from the transcript when possible; if unknown, use "TBD:".
- Interesting quotes: PRIORITIZE quotes from the INDUSTRY ANALYST(S), not from PreferredDomain team members. Look for moments where the analyst:
  * Shares opinions about market trends or industry insights
  * Gives advice or recommendations
  * Makes predictions about the future
  * Expresses surprise, concern, or strong views
  * Provides unique perspectives on the industry
  Use the exact text from the transcript enclosed in double quotes, and include the speaker name if identifiable.
- Do not fabricate content; if a section has no content, write "None".
- Output with clear section delimiters exactly as follows:
  [KEY_TOPICS_START]
  (bullet points here)
  [KEY_TOPICS_END]
  
  [FOLLOW_UP_START]
  (follow-up items here)
  [FOLLOW_UP_END]
  
  [QUOTES_START]
  (interesting quotes here)
  [QUOTES_END]
`

        console.log('AI Generation Prompt:', prompt)
        
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800
        })
        
        const generatedSummary = completion.choices[0]?.message?.content || 'Unable to generate summary'
        console.log('AI Generated Summary:', generatedSummary)

        return NextResponse.json({
          success: true,
          summary: generatedSummary
        })

      } catch (openaiError) {
        console.error('OpenAI API error:', openaiError)
        return NextResponse.json(
          { error: 'Failed to generate summary' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error in briefing POST action:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
