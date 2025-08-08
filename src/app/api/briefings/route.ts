import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type Briefing = Database['public']['Tables']['briefings']['Row']
type BriefingInsert = Database['public']['Tables']['briefings']['Insert']
type BriefingAnalystInsert = Database['public']['Tables']['briefing_analysts']['Insert']

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const upcoming = searchParams.get('upcoming') === 'true'
    const analystId = searchParams.get('analystId')
    const limit = parseInt(searchParams.get('limit') || '1000', 10)

    const supabase = await createClient()

    // Build briefings query
    let briefingsQuery = supabase
      .from('briefings')
      .select('*')
      .order('scheduledAt', { ascending: upcoming ? true : false })
      .limit(limit)

    // Apply filters
    if (status) {
      briefingsQuery = briefingsQuery.eq('status', status.toUpperCase())
    }

    if (upcoming) {
      const now = new Date().toISOString()
      briefingsQuery = briefingsQuery.gte('scheduledAt', now)
    }

    const { data: briefings, error: briefingsError } = await briefingsQuery

    if (briefingsError) {
      console.error('Error fetching briefings:', briefingsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch briefings' },
        { status: 500 }
      )
    }

    let filteredBriefings = briefings || []

    // If filtering by analyst, get briefing-analyst associations
    if (analystId) {
      const { data: briefingAnalysts, error: baError } = await supabase
        .from('briefing_analysts')
        .select('briefingId')
        .eq('analystId', analystId)

      if (baError) {
        console.error('Error fetching briefing analysts:', baError)
        return NextResponse.json(
          { success: false, error: 'Failed to fetch briefing analysts' },
          { status: 500 }
        )
      }

      const briefingIds = briefingAnalysts.map(ba => ba.briefingId)
      filteredBriefings = filteredBriefings.filter(briefing => 
        briefingIds.includes(briefing.id)
      )
    }

    // For each briefing, get associated analysts
    const briefingsWithAnalysts = await Promise.all(
      filteredBriefings.map(async (briefing) => {
        const { data: briefingAnalysts } = await supabase
          .from('briefing_analysts')
          .select(`
            analystId,
            analysts!inner(
              id,
              firstName,
              lastName,
              email,
              company,
              title
            )
          `)
          .eq('briefingId', briefing.id)

        const analysts = briefingAnalysts?.map(ba => ba.analysts) || []

        return {
          ...briefing,
          analysts
        }
      })
    )

    console.log(`📊 Found ${briefingsWithAnalysts.length} briefings`)
    return NextResponse.json({
      success: true,
      data: briefingsWithAnalysts,
      total: briefingsWithAnalysts.length,
      hasMore: false,
      nextCursor: null
    })

  } catch (error) {
    console.error('Error in briefings GET:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      description,
      scheduledAt,
      status = 'SCHEDULED',
      agenda,
      notes,
      analystIds = []
    } = body

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Title and scheduled date are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create briefing
    const briefingData: BriefingInsert = {
      id: generateId(),
      title,
      description,
      scheduledAt,
      status,
      agenda,
      notes
    }

    const { data: newBriefing, error: briefingError } = await supabase
      .from('briefings')
      .insert(briefingData)
      .select()
      .single()

    if (briefingError) {
      console.error('Error creating briefing:', briefingError)
      return NextResponse.json(
        { error: 'Failed to create briefing' },
        { status: 500 }
      )
    }

    // Add analyst associations if provided
    if (analystIds.length > 0) {
      const briefingAnalystsData: BriefingAnalystInsert[] = analystIds.map((analystId: string) => ({
        id: generateId(),
        briefingId: newBriefing.id,
        analystId
      }))

      const { error: associationError } = await supabase
        .from('briefing_analysts')
        .insert(briefingAnalystsData)

      if (associationError) {
        console.error('Error creating briefing-analyst associations:', associationError)
        // Don't fail the whole request, just log the error
      }
    }

    // Fetch the complete briefing with analysts
    const { data: briefingAnalysts } = await supabase
      .from('briefing_analysts')
      .select(`
        analystId,
        analysts!inner(
          id,
          firstName,
          lastName,
          email,
          company,
          title
        )
      `)
      .eq('briefingId', newBriefing.id)

    const analysts = briefingAnalysts?.map(ba => ba.analysts) || []

    const completeBriefing = {
      ...newBriefing,
      analysts
    }

    console.log(`✅ Created briefing: ${newBriefing.title}`)
    
    return NextResponse.json({
      success: true,
      message: 'Briefing created successfully',
      data: completeBriefing
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating briefing:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create briefing',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
