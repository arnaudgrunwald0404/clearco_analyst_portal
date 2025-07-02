import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, category, description, order, isActive } = body

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

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if another topic with the same name exists (excluding current topic)
    const { data: existingTopic } = await supabase
      .from('PredefinedTopic')
      .select('id')
      .eq('name', name)
      .neq('id', id)
      .single()

    if (existingTopic) {
      return NextResponse.json(
        { error: 'A topic with this name already exists' },
        { status: 409 }
      )
    }

    // Update topic
    const { data: updatedTopic, error } = await supabase
      .from('PredefinedTopic')
      .update({
        name: name.trim(),
        category,
        description: description?.trim() || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating topic:', error)
      return NextResponse.json(
        { error: 'Failed to update topic' },
        { status: 500 }
      )
    }

    if (!updatedTopic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedTopic)
  } catch (error) {
    console.error('Error in topic PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Check if topic exists and get its name for response
    const { data: topic } = await supabase
      .from('PredefinedTopic')
      .select('name')
      .eq('id', id)
      .single()

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Check if topic is currently being used by any analysts
    const { data: usedByAnalysts, error: checkError } = await supabase
      .from('AnalystCoveredTopic')
      .select('analystId')
      .eq('topic', topic.name)
      .limit(1)

    if (checkError) {
      console.error('Error checking topic usage:', checkError)
      return NextResponse.json(
        { error: 'Failed to check topic usage' },
        { status: 500 }
      )
    }

    if (usedByAnalysts && usedByAnalysts.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete topic that is currently assigned to analysts' },
        { status: 409 }
      )
    }

    // Delete topic
    const { error } = await supabase
      .from('PredefinedTopic')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting topic:', error)
      return NextResponse.json(
        { error: 'Failed to delete topic' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in topic DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
