import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'

// GET /api/content/[id] - Fetch a single content item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // For now, allow any authenticated user to fetch content by ID.
    // Permission logic will be added in the next step.
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }

    const supabase = createClient()
    const { data: content, error } = await supabase
      .from('content')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ success: false, error: 'Content not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({ success: true, data: content })
  } catch (error) {
    console.error(`Error fetching content ${params.id}:`, error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/content/[id] - Update content
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const authUser = authResult

    const supabase = createClient()

    // Check user role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || (userProfile.role !== 'ADMIN' && userProfile.role !== 'EDITOR')) {
      return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, type, url, file_path, is_exclusive, is_published, is_public, tags } = body

    // 1. Update the content record
    const { data: updatedContent, error: contentError } = await supabase
      .from('content')
      .update({
        title,
        description,
        type,
        url,
        file_path,
        is_exclusive,
        is_published,
        is_public,
        updatedAt: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single()

    if (contentError) {
      console.error(`Error updating content ${params.id}:`, contentError)
      return NextResponse.json({ success: false, error: 'Failed to update content.' }, { status: 500 })
    }

    // 2. Handle tags if provided
    if (tags && Array.isArray(tags)) {
      // Delete existing tags for this content
      await supabase.from('content_tags').delete().eq('content_id', params.id)

      // Insert new tags
      if (tags.length > 0) {
        const contentTags = tags.map((tagId: string) => ({
          content_id: params.id,
          tag_id: tagId,
        }))
        const { error: tagsError } = await supabase.from('content_tags').insert(contentTags)
        if (tagsError) {
          console.error(`Error updating tags for content ${params.id}:`, tagsError)
        }
      }
    }

    return NextResponse.json({ success: true, data: updatedContent })
  } catch (error) {
    console.error(`Error in PATCH /api/content/${params.id}:`, error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/content/[id] - Delete content
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
    try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const authUser = authResult

    const supabase = createClient()

    // Check user role
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', authUser.id)
      .single()

    if (!userProfile || (userProfile.role !== 'ADMIN' && userProfile.role !== 'EDITOR')) {
      return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 })
    }

    // We can just delete from the content table, and ON DELETE CASCADE will handle the content_tags
    const { error } = await supabase.from('content').delete().eq('id', params.id)

    if (error) {
      console.error(`Error deleting content ${params.id}:`, error)
      return NextResponse.json({ success: false, error: 'Failed to delete content.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Content deleted successfully.' })
  } catch (error) {
    console.error(`Error in DELETE /api/content/${params.id}:`, error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
