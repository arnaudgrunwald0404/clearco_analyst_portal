import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('EmailTemplate')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { name, description, html } = await request.json()

    if (!name || !html) {
      return NextResponse.json(
        { error: 'Name and HTML content are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const updateData = {
      name,
      description: description || '',
      html,
      updatedAt: new Date().toISOString()
    }

    const { data: template, error } = await supabase
      .from('EmailTemplate')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error || !template) {
      return NextResponse.json(
        { error: 'Failed to update email template or template not found' },
        { status: error?.code === '23503' ? 404 : 500 }
      )
    }

    console.log(`📧 Updated email template: ${template.name}`)

    return NextResponse.json({
      success: true,
      data: template
    })

  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('EmailTemplate')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting email template:', error)
      return NextResponse.json(
        { error: 'Failed to delete email template' },
        { status: 500 }
      )
    }

    console.log(`🗑️ Deleted email template: ${params.id}`)

    return NextResponse.json({
      success: true,
      message: 'Email template deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    )
  }
} 