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
      analystIds
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Delete briefing (associations will be deleted via CASCADE)
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
        const prompt = `Generate a professional briefing summary for the following meeting:

Title: ${briefing.title}
Description: ${briefing.description || 'No description provided'}
Duration: ${briefing.duration} minutes
Participants: ${analysts.map((a: any) => `${a.firstName} ${a.lastName} (${a.title} at ${a.company})`).join(', ')}

Create a structured summary with:
1. Meeting Overview
2. Key Discussion Points
3. Outcomes/Decisions
4. Next Steps

Keep it professional and concise.`

        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1000
        })

        const generatedSummary = completion.choices[0]?.message?.content || 'Unable to generate summary'

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
