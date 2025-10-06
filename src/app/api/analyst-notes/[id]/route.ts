import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supaAny: any = await createClient()
    const { data: { user } } = await supaAny.auth.getUser()
    if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Resolve analyst id by email
    const { data: analyst } = await supaAny
      .from('analysts')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!analyst?.id) return NextResponse.json({ success: false, error: 'Analyst not found' }, { status: 404 })

    const { error } = await supaAny
      .from('analyst_notes')
      .delete()
      .eq('id', id)
      .eq('analyst_id', analyst.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('DELETE /api/analyst-notes/:id failed', e)
    return NextResponse.json({ success: false, error: 'Failed to delete note' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json().catch(() => ({}))
    const { title, content, noteDate, attachmentUrl } = body || {}

    const supaAny: any = await createClient()
    const { data: { user } } = await supaAny.auth.getUser()
    if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    // Resolve analyst id by email
    const { data: analyst } = await supaAny
      .from('analysts')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!analyst?.id) return NextResponse.json({ success: false, error: 'Analyst not found' }, { status: 404 })

    const updates: any = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) updates.content = content
    if (noteDate !== undefined) updates.note_date = noteDate
    if (attachmentUrl !== undefined) updates.attachment_url = attachmentUrl

    const { error } = await supaAny
      .from('analyst_notes')
      .update(updates)
      .eq('id', id)
      .eq('analyst_id', analyst.id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('PUT /api/analyst-notes/:id failed', e)
    return NextResponse.json({ success: false, error: 'Failed to update note' }, { status: 500 })
  }
}