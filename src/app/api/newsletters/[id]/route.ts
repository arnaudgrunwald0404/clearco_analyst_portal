import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = await createClient()

    const { data: newsletter, error } = await supabase
      .from('Newsletter')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }

    // For now, return basic metrics since we don't have subscription data structure
    return NextResponse.json({
      success: true,
      data: {
        ...newsletter,
        metrics: {
          totalRecipients: 0,
          openRate: 0,
          clickRate: 0,
          openedCount: 0,
          clickedCount: 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching newsletter:', error)
    return NextResponse.json({ error: 'Failed to fetch newsletter' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      title,
      subject,
      content,
      htmlContent,
      status,
      scheduledAt
    } = body

    const supabase = await createClient()

    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    if (title !== undefined) updateData.title = title
    if (subject !== undefined) updateData.subject = subject
    if (content !== undefined) updateData.content = content
    if (htmlContent !== undefined) updateData.htmlContent = htmlContent
    if (status !== undefined) updateData.status = status
    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt).toISOString() : null
    }

    const { data: newsletter, error } = await supabase
      .from('Newsletter')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !newsletter) {
      return NextResponse.json({ error: 'Newsletter not found or failed to update' }, { status: 404 })
    }

    console.log(`📧 Newsletter updated: ${newsletter.title}`)

    return NextResponse.json({
      success: true,
      data: newsletter
    })
  } catch (error) {
    console.error('Error updating newsletter:', error)
    return NextResponse.json({ error: 'Failed to update newsletter' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const supabase = await createClient()

    const { error } = await supabase
      .from('Newsletter')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting newsletter:', error)
      return NextResponse.json({ error: 'Failed to delete newsletter' }, { status: 500 })
    }

    console.log(`📧 Newsletter deleted: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Newsletter deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting newsletter:', error)
    return NextResponse.json({ error: 'Failed to delete newsletter' }, { status: 500 })
  }
} 