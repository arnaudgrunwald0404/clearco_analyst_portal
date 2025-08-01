import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      title,
      description,
      assignedTo,
      dueDate,
      priority,
      notes,
      status
    } = body

    const supabase = await createClient()

    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate).toISOString() : null
    if (priority !== undefined) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) {
      updateData.status = status
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date().toISOString()
      } else {
        updateData.completedAt = null
      }
    }

    const { data: actionItem, error } = await supabase
      .from('action_items')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        briefings(
          id,
          title,
          briefing_analysts(
            analysts(
              id,
              firstName,
              lastName,
              email,
              company
            )
          )
        )
      `)
      .single()

    if (error || !actionItem) {
      console.error('Error updating action item:', error)
      return NextResponse.json(
        { error: 'Failed to update action item or action item not found' },
        { status: error?.code === '23503' ? 404 : 500 }
      )
    }

    // Process the briefing data for consistency
    const briefing = actionItem.briefings || null
    const primaryAnalyst = briefing?.briefing_analysts?.[0]?.analysts || null

    const formattedActionItem = {
      ...actionItem,
      isCompleted: actionItem.status === 'COMPLETED',
      briefing: briefing ? {
        id: briefing.id,
        title: briefing.title,
        primaryAnalyst
      } : null
    }

    delete formattedActionItem.briefings // Remove the raw briefings data

    console.log(`✅ Updated action item: ${actionItem.title}`)

    return NextResponse.json({
      success: true,
      data: formattedActionItem
    })

  } catch (error) {
    console.error('Error in action item PATCH:', error)
    return NextResponse.json(
      { error: 'Failed to update action item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = await createClient()

    const { error } = await supabase
      .from('action_items')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting action item:', error)
      return NextResponse.json(
        { error: 'Failed to delete action item' },
        { status: 500 }
      )
    }

    console.log(`🗑️ Deleted action item: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Action item deleted successfully'
    })

  } catch (error) {
    console.error('Error in action item DELETE:', error)
    return NextResponse.json(
      { error: 'Failed to delete action item' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = await createClient()

    const { data: actionItem, error } = await supabase
      .from('action_items')
      .select(`
        *,
        briefings(
          id,
          title,
          briefing_analysts(
            analysts(
              id,
              firstName,
              lastName,
              email,
              company
            )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error || !actionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    // Process the briefing data for consistency
    const briefing = actionItem.briefings || null
    const primaryAnalyst = briefing?.briefing_analysts?.[0]?.analysts || null

    const formattedActionItem = {
      ...actionItem,
      isCompleted: actionItem.status === 'COMPLETED',
      briefing: briefing ? {
        id: briefing.id,
        title: briefing.title,
        primaryAnalyst
      } : null
    }

    delete formattedActionItem.briefings // Remove the raw briefings data

    return NextResponse.json({
      success: true,
      data: formattedActionItem
    })

  } catch (error) {
    console.error('Error fetching action item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action item' },
      { status: 500 }
    )
  }
}
