import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth-utils'

// GET: list event source URLs
export async function GET() {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabase
      .from('event_sync_sources')
      .select('id,url,is_active,selected_tabs,created_at,updated_at')
      .order('created_at', { ascending: true })

    if (error) throw error

    return NextResponse.json({ success: true, data: data || [] })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to load event sources', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// POST: add a new event source URL
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const body = await request.json().catch(() => ({})) as { 
      url?: string; 
      is_active?: boolean; 
      selected_tabs?: string[]; 
    }
    const url = (body.url || '').trim()
    const is_active = body.is_active ?? true
    const selected_tabs = Array.isArray(body.selected_tabs) ? body.selected_tabs.filter(Boolean) : null

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 })
    }

    // basic URL validation
    try { new URL(url) } catch {
      return NextResponse.json({ success: false, error: 'Invalid URL' }, { status: 400 })
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const now = new Date().toISOString()
    const id = `cl${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`

    const { data, error } = await supabase
      .from('event_sync_sources')
      .insert({ 
        id, 
        url, 
        is_active, 
        selected_tabs: selected_tabs ? JSON.stringify(selected_tabs) : null, 
        created_at: now, 
        updated_at: now 
      })
      .select('id,url,is_active,selected_tabs,created_at,updated_at')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to add event source', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

