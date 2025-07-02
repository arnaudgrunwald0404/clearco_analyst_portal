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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      description,
      assignedTo,
      dueDate,
      priority,
      category,
      notes,
      isCompleted,
      completedBy
    } = body

    const updateData: any = {}
    
    if (description !== undefined) updateData.description = description
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate).toISOString() : null
    if (priority !== undefined) updateData.priority = priority
    if (category !== undefined) updateData.category = category
    if (notes !== undefined) updateData.notes = notes
    
    // Handle completion status
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted
      if (isCompleted) {
        updateData.completedAt = new Date().toISOString()
        updateData.completedBy = completedBy || 'System'
      } else {
        updateData.completedAt = null
        updateData.completedBy = null
      }
    }

    const { data: actionItem, error } = await supabase
      .from('ActionItem')
      .update(updateData)
      .eq('id', id)
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
      .single()

    if (error) throw error

    if (!actionItem) {
      return NextResponse.json(
        { success: false, error: 'Action item not found' },
        { status: 404 }
      )
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
    console.error('Error updating action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update action item' },
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

    const { error } = await supabase
      .from('ActionItem')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Action item deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete action item' },
      { status: 500 }
    )
  }
}
