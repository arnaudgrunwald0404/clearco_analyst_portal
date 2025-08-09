import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'

// POST /api/content - Create new content
export async function POST(request: NextRequest) {
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

    // Basic validation
    if (!title || !type) {
      return NextResponse.json({ success: false, error: 'Title and type are required.' }, { status: 400 })
    }

    // 1. Create the content record
    const { data: newContent, error: contentError } = await supabase
      .from('content')
      .insert({
        title,
        description,
        type,
        url,
        file_path,
        is_exclusive,
        is_published,
        is_public,
      })
      .select()
      .single()

    if (contentError) {
      console.error('Error creating content:', contentError)
      return NextResponse.json({ success: false, error: 'Failed to create content.' }, { status: 500 })
    }

    // 2. Handle tags if provided
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // In a real app, you might want to find or create tags
      // For now, we assume tags are provided as an array of UUIDs
      const contentTags = tags.map((tagId: string) => ({
        content_id: newContent.id,
        tag_id: tagId,
      }))

      const { error: tagsError } = await supabase.from('content_tags').insert(contentTags)

      if (tagsError) {
        // If tagging fails, we should ideally roll back the content creation
        // For simplicity here, we'll just log the error but still return the created content
        console.error('Error associating tags with content:', tagsError)
      }
    }

    return NextResponse.json({ success: true, data: newContent }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/content:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/content - List content with permissions
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const authUser = authResult

    const supabase = createClient()

    // 1. Get the analyst's profile to determine their tags
    const { data: analyst } = await supabase
      .from('analysts')
      .select('id, company')
      .eq('email', authUser.email)
      .single()

    if (!analyst) {
      // If the user is not an analyst (e.g., admin), decide what to return.
      // For now, we'll return an empty list for non-analysts in the portal view.
      // An admin-specific content view would be a separate endpoint or have a query param.
      return NextResponse.json({ success: true, data: [] })
    }

    // 2. Construct the list of tag names for this analyst
    const userTagNames = [analyst.id] // Tag by analyst ID
    if (analyst.company) {
      userTagNames.push(analyst.company) // Tag by company
    }
    // In a multi-tenant system, you might also have an industry tag.

    // 3. Find the IDs of these tags
    const { data: tags } = await supabase
      .from('tags')
      .select('id')
      .in('name', userTagNames)

    const userTagIds = tags ? tags.map(t => t.id) : []

    // 4. Fetch content
    // We need to get all public content OR content tagged for this user.
    // This is best done with an RPC function in Supabase for performance,
    // but we can simulate it with multiple queries.

    // Query 1: Get all public content
    const { data: publicContent, error: publicError } = await supabase
      .from('content')
      .select('*')
      .eq('is_public', true)
      .eq('is_published', true)

    if (publicError) throw publicError

    // Query 2: Get all content tagged for this user
    let taggedContent: any[] = []
    if (userTagIds.length > 0) {
      const { data: tagged, error: taggedError } = await supabase
        .from('content')
        .select('*, content_tags!inner(tag_id)')
        .eq('is_published', true)
        .in('content_tags.tag_id', userTagIds)

      if (taggedError) throw taggedError
      taggedContent = tagged || []
    }

    // 5. Merge and de-duplicate results
    const allContent = [...publicContent, ...taggedContent]
    const uniqueContent = Array.from(new Map(allContent.map(item => [item.id, item])).values())

    // Sort by creation date
    uniqueContent.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ success: true, data: uniqueContent })

  } catch (error) {
    console.error('Error in GET /api/content:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
