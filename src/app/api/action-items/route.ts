import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type ActionItem = Database['public']['Tables']['action_items']['Row']
type ActionItemInsert = Database['public']['Tables']['action_items']['Insert']

// Simple CUID-like ID generator
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'pending', 'completed', 'all'
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')

    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('action_items')
      .select(`
        *,
        briefings:briefingId (
          id,
          title,
          scheduledAt,
          briefing_analysts (
            analysts:analystId (
              firstName,
              lastName,
              company
            )
          )
        )
      `)

    // Apply filters
    if (status === 'pending') {
      query = query.in('status', ['PENDING', 'IN_PROGRESS'])
    } else if (status === 'completed') {
      query = query.eq('status', 'COMPLETED')
    }
    
    if (priority) {
      query = query.eq('priority', priority.toUpperCase())
    }
    
    if (assignedTo) {
      query = query.eq('assignedTo', assignedTo)
    }

    // Order by: incomplete first, then by priority (high first), then by due date, then by created date
    query = query.order('status', { ascending: true }) // PENDING, IN_PROGRESS, COMPLETED, CANCELLED
    query = query.order('priority', { ascending: false }) // URGENT, HIGH, MEDIUM, LOW
    query = query.order('dueDate', { ascending: true })
    query = query.order('createdAt', { ascending: false })

    const { data: actionItems, error } = await query

    if (error) {
      console.error('Error fetching action items:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch action items' },
        { status: 500 }
      )
    }

    // Process the data to match the expected format
    const processedItems = actionItems?.map(item => ({
      ...item,
      // Map old Prisma fields to new structure
      isCompleted: item.status === 'COMPLETED',
      briefing: item.briefings ? {
        ...item.briefings,
        primaryAnalyst: item.briefings.briefing_analysts?.[0]?.analysts || null
      } : null
    })) || []

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
      title,
      description,
      priority = 'MEDIUM',
      dueDate,
      assignedTo,
      analystId,
      briefingId,
      tags
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const newActionItem = {
      id: generateId(),
      title,
      description: description || null,
      status: 'PENDING' as const,
      priority: priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT',
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      assignedTo: assignedTo || null,
      analystId: analystId || null,
      briefingId: briefingId || null,
      tags: tags || null
    }

    const { data: actionItem, error } = await supabase
      .from('action_items')
      .insert(newActionItem)
      .select()
      .single()

    if (error) {
      console.error('Error creating action item:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create action item' },
        { status: 500 }
      )
    }

    console.log('✅ Action item created successfully:', actionItem.id)

    return NextResponse.json({
      success: true,
      data: actionItem
    })

  } catch (error) {
    console.error('Error creating action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create action item' },
      { status: 500 }
    )
  }
}
