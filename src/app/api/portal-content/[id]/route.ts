import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const body = await request.json()
    
    const { title, description, type, category, url, fileSize } = body

    if (!title || !type || !category || !url) {
      return NextResponse.json({ 
        error: 'Missing required fields: title, type, category, url' 
      }, { status: 400 })
    }

    const updateData = {
      title,
      description: description || '',
      type,
      category,
      url,
      fileSize: fileSize || null,
      updatedAt: new Date().toISOString()
    }

    const { data: content, error } = await supabase
      .from('portal_content')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating portal content:', error)
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    if (!content) {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      data: content 
    })

  } catch (error) {
    console.error('Error in portal content update:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('portal_content')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting portal content:', error)
      return NextResponse.json({ error: 'Failed to delete content' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Content deleted successfully' 
    })

  } catch (error) {
    console.error('Error in portal content deletion:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

