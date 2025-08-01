import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: topics, error } = await supabase
      .from('topics')
      .select('*')
      .eq('isActive', true)
      .order('order', { ascending: true })

    if (error) {
      console.error('Error fetching topics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      )
    }

    return NextResponse.json(topics || [])
  } catch (error) {
    console.error('Error in topics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check if topic name already exists
    const { data: existingTopic } = await supabase
      .from('topics')
      .select('id')
      .eq('name', name.trim())
      .single()

    if (existingTopic) {
      return NextResponse.json(
        { error: 'A topic with this name already exists' },
        { status: 409 }
      )
    }

    // Create the new topic
    const newTopic = {
      id: generateId(),
      name: name.trim(),
      category,
      description: description?.trim() || null,
      order: order || 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: createdTopic, error: createError } = await supabase
      .from('topics')
      .insert(newTopic)
      .select()
      .single()

    if (createError) {
      console.error('Error creating topic:', createError)
      return NextResponse.json(
        { error: 'Failed to create topic' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Topic created successfully',
      data: createdTopic
    })
  } catch (error) {
    console.error('Error creating topic:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
