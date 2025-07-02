import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: topics, error } = await supabase
      .from('PredefinedTopic')
      .select('*')
      .order('order')

    if (error) {
      console.error('Error fetching topics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch topics' },
        { status: 500 }
      )
    }

    return NextResponse.json(topics)
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

    // Check if topic name already exists
    const { data: existingTopic } = await supabase
      .from('PredefinedTopic')
      .select('id')
      .eq('name', name)
      .single()

    if (existingTopic) {
      return NextResponse.json(
        { error: 'A topic with this name already exists' },
        { status: 409 }
      )
    }

    // Create new topic
    const { data: newTopic, error } = await supabase
      .from('PredefinedTopic')
      .insert({
        name: name.trim(),
        category,
        description: description?.trim() || null,
        order: order || 0,
        isActive: isActive !== undefined ? isActive : true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating topic:', error)
      return NextResponse.json(
        { error: 'Failed to create topic' },
        { status: 500 }
      )
    }

    return NextResponse.json(newTopic, { status: 201 })
  } catch (error) {
    console.error('Error in topics POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
