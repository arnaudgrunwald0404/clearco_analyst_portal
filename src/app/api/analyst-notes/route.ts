import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supaAny: any = await createClient()
    const { data: { user } } = await supaAny.auth.getUser()
    if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const vendorDomain = url.searchParams.get('vendorDomain')

    // Resolve analyst by email
    const { data: analyst } = await supaAny
      .from('analysts')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!analyst?.id) return NextResponse.json({ success: true, data: [] })

    let query = supaAny
      .from('analyst_notes')
      .select('id, title, content, note_date, attachment_url, created_at')
      .eq('analyst_id', analyst.id)
      .order('note_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (vendorDomain) {
      const { data: vendor } = await supaAny
        .from('vendor_domains')
        .select('id')
        .eq('protected_domain', vendorDomain)
        .maybeSingle()
      if (vendor?.id) {
        query = query.eq('vendor_domain_id', vendor.id)
      } else {
        // No matching vendor domain; return empty
        return NextResponse.json({ success: true, data: [] })
      }
    }

    const { data, error } = await query
    if (error) throw error

    const mapped = (data || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      noteDate: r.note_date,
      attachmentUrl: r.attachment_url,
      createdAt: r.created_at,
    }))

    return NextResponse.json({ success: true, data: mapped })
  } catch (e: any) {
    console.error('GET /api/analyst-notes failed', e)
    return NextResponse.json({ success: false, error: 'Failed to fetch notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supaAny: any = await createClient()
    const { data: { user } } = await supaAny.auth.getUser()
    if (!user?.email) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { title, content, noteDate, attachmentUrl, vendorDomain } = body || {}

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 })
    }

    // Resolve analyst id
    const { data: analyst } = await supaAny
      .from('analysts')
      .select('id')
      .eq('email', user.email)
      .maybeSingle()

    if (!analyst?.id) return NextResponse.json({ success: false, error: 'Analyst profile not found' }, { status: 404 })

    // Resolve vendor_domain_id if provided
    let vendor_domain_id: string | null = null
    if (vendorDomain) {
      const { data: vendor } = await supaAny
        .from('vendor_domains')
        .select('id')
        .eq('protected_domain', vendorDomain)
        .maybeSingle()
      vendor_domain_id = vendor?.id || null
    }

    const { data, error } = await supaAny
      .from('analyst_notes')
      .insert({
        analyst_id: analyst.id,
        vendor_domain_id,
        title: title || null,
        content,
        note_date: noteDate || new Date().toISOString().split('T')[0],
        attachment_url: attachmentUrl || null,
      })
      .select('id')
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, id: data.id })
  } catch (e: any) {
    console.error('POST /api/analyst-notes failed', e)
    return NextResponse.json({ success: false, error: 'Failed to create note' }, { status: 500 })
  }
}