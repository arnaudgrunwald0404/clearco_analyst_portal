import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth-utils'

// PATCH/DELETE for individual event source
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { id } = await params
    const body = await request.json().catch(() => ({})) as { 
      url?: string; 
      is_active?: boolean; 
      selected_tabs?: string[]; 
    }

    const updates: any = { updated_at: new Date().toISOString() }

    if (body.url !== undefined) {
      const url = String(body.url).trim()
      if (!url) return NextResponse.json({ success: false, error: 'URL cannot be empty' }, { status: 400 })
      try { new URL(url) } catch {
        return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 })
      }
      updates.url = url
    }
    if (body.is_active !== undefined) updates.is_active = !!body.is_active
    if (body.selected_tabs !== undefined) {
      updates.selected_tabs = Array.isArray(body.selected_tabs) ? JSON.stringify(body.selected_tabs.filter(Boolean)) : null
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('event_sync_sources')
      .update(updates)
      .eq('id', id)
      .select('id,url,is_active,selected_tabs,created_at,updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update event source', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { id } = await params
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('event_sync_sources')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete event source', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

