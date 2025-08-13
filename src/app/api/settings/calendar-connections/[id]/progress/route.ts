import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const sinceParam = request.nextUrl.searchParams.get('sinceId')
  const sinceId = sinceParam ? parseInt(sinceParam, 10) : null

  const query = supabase
    .from('calendar_sync_progress')
    .select('id, type, month, message, found_analyst_meetings, total_events_processed, relevant_meetings_count, created_at')
    .eq('connection_id', id)
    .order('id', { ascending: true })
    .limit(200)

  const { data, error } = sinceId
    ? await query.gt('id', sinceId)
    : await query

  if (error) {
    return NextResponse.json({ success: false, error: 'Failed to load progress' }, { status: 500 })
  }

  return NextResponse.json({ success: true, data: data || [] })
}

