import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, category, description, order } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    if (!['CORE', 'ADDITIONAL'].includes(category)) {
      return NextResponse.json(
        { error: 'Category must be CORE or ADDITIONAL' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if another topic with the same name exists (excluding current topic)
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('name', name.trim())
      .neq('id', id)
      .single()

    if (existingTopic) {
      return NextResponse.json(
        { error: 'A topic with this name already exists' },
        { status: 409 }
      )
    }

    // Update the topic
    const updateData = {
      name: name.trim(),
      category,
      description: description?.trim() || '',
      order: order || 0,
      updatedAt: new Date().toISOString()
    }

    const { data: updatedTopic, error } = await supabase
      .from('topics')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !updatedTopic) {
      console.error('Error updating topic:', error)
      return NextResponse.json(
        { error: 'Failed to update topic or topic not found' },
        { status: error?.code === '23503' ? 404 : 500 }
      )
    }

    console.log(`📝 Updated topic: ${updatedTopic.name}`)

    return NextResponse.json({
      success: true,
      data: updatedTopic
    })

  } catch (error) {
    console.error('Error updating topic:', error)
    return NextResponse.json(
      { error: 'Failed to update topic' },
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

    // First check if topic exists
    const { data: topic } = await supabase
      .from('topics')
      .select('name')
      .eq('id', id)
      .single()

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Delete the topic
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting topic:', error)
      return NextResponse.json(
        { error: 'Failed to delete topic' },
        { status: 500 }
      )
    }

    console.log(`🗑️ Deleted topic: ${topic.name}`)

    return NextResponse.json({
      success: true,
      message: 'Topic deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting topic:', error)
    return NextResponse.json(
      { error: 'Failed to delete topic' },
      { status: 500 }
    )
  }
}
