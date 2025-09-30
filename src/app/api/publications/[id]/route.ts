import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { requireVendorScope } from '@/lib/vendor-context'

interface RouteParams {
  params: { id: string }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp
    // Prefer service role for deletes to avoid RLS issues
    const adminSupabase = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null
    const supabase = adminSupabase || await createClient()

    // Guard: allow deletion only if the publication belongs to an analyst within this vendor
    const { data: pub, error: pubErr } = await supabase
      .from('publications')
      .select('analystId')
      .eq('id', id)
      .single()

    if (pubErr || !pub?.analystId) {
      return NextResponse.json({ success: false, error: 'Publication not found' }, { status: 404 })
    }

    const { data: analystRow } = await supabase
      .from('analysts')
      .select('id')
      .eq('id', pub.analystId)
      .eq('vendor_domain_id', ctxOrResp.id)
      .single()

    if (!analystRow) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('publications')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting publication:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to delete publication' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting publication:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete publication' },
      { status: 500 }
    )
  }
}
