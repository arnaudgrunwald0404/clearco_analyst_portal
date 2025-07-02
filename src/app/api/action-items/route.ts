import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Create a Supabase client with the service role key for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'pending', 'completed', 'all'
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')

    let query = supabase
      .from('ActionItem')
      .select(`
        *,
        briefing:Briefing (
          id,
          title,
          scheduledAt,
          analysts:BriefingAnalyst (
            analyst:Analyst (
              firstName,
              lastName,
              company
            )
          )
        )
      `)
      .order('isCompleted', { ascending: true })
      .order('priority', { ascending: false })
      .order('dueDate', { ascending: true })
      .order('createdAt', { ascending: false })

    // Apply filters
    if (status === 'pending') {
      query = query.eq('isCompleted', false)
    } else if (status === 'completed') {
      query = query.eq('isCompleted', true)
    }
    
    if (priority) {
      query = query.eq('priority', priority)
    }
    
    if (assignedTo) {
      query = query.eq('assignedTo', assignedTo)
    }

    const { data: actionItems, error } = await query

    if (error) throw error

    if (!actionItems) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    const processedItems = actionItems.map(item => ({
      ...item,
      briefing: {
        ...item.briefing,
        primaryAnalyst: item.briefing?.analysts?.[0]?.analyst || null
      }
    }))

    return NextResponse.json({
      success: true,
      data: processedItems
    })

  } catch (error) {
    console.error('Error fetching action items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch action items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      briefingId,
      description,
      assignedTo,
      assignedBy,
      dueDate,
      priority = 'MEDIUM',
      category,
      notes
    } = body

    if (!briefingId || !description) {
      return NextResponse.json(
        { success: false, error: 'Briefing ID and description are required' },
        { status: 400 }
      )
    }

    // Create the action item
    const { data: actionItem, error: createError } = await supabase
      .from('ActionItem')
      .insert({
        briefingId,
        description,
        assignedTo,
        assignedBy,
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        priority,
        category,
        notes
      })
      .select(`
        *,
        briefing:Briefing (
          id,
          title,
          analysts:BriefingAnalyst (
            analyst:Analyst (
              firstName,
              lastName,
              company
            )
          )
        )
      `)
      .single()

    if (createError) throw createError

    if (!actionItem) {
      throw new Error('Failed to create action item')
    }

    return NextResponse.json({
      success: true,
      data: {
        ...actionItem,
        briefing: {
          ...actionItem.briefing,
          primaryAnalyst: actionItem.briefing?.analysts?.[0]?.analyst || null
        }
      }
    })

  } catch (error) {
    console.error('Error creating action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create action item' },
      { status: 500 }
    )
  }
}
