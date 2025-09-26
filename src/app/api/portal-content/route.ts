import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: content, error } = await supabase
      .from('portal_content')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching portal content:', error)
      return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: content || [] 
    })

  } catch (error) {
    console.error('Error in portal content API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    
    const { title, description, type, category, url, fileSize } = body

    if (!title || !type || !category || !url) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, type, category, url' 
      }, { status: 400 })
    }

    // Generate ID
    const id = 'content_' + Math.random().toString(36).substr(2, 9)

    const contentData = {
      id,
      title,
      description: description || '',
      type,
      category,
      url,
      fileSize: fileSize || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: content, error } = await supabase
      .from('portal_content')
      .insert([contentData])
      .select()
      .single()

    if (error) {
      console.error('Error creating portal content:', error)
      return NextResponse.json({ error: 'Failed to create content' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      data: content 
    })

  } catch (error) {
    console.error('Error in portal content creation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

