import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) return authResult
    const { url, sheetTitle, headerSignature, mapping } = await request.json()
    if (!url || !sheetTitle || !headerSignature || !mapping) {
      return NextResponse.json({ success: false, error: 'url, sheetTitle, headerSignature, mapping are required' }, { status: 400 })
    }

    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const id = `cl${Date.now().toString(36)}${Math.random().toString(36).slice(2,8)}`

    const { error } = await supabase
      .from('event_source_mappings')
      .upsert({
        id,
        source_url: url,
        sheet_title: sheetTitle,
        header_signature: headerSignature,
        mapping,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Save mapping error:', error)
    return NextResponse.json({ success: false, error: error?.message || 'Failed to save mapping' }, { status: 500 })
  }
}

