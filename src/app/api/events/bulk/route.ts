import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventIds, action, participationStatus } = body || {}

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json({ success: false, error: 'eventIds is required' }, { status: 400 })
    }

    const supabase = await createClient()

    if (action === 'changeTag') {
      // participationStatus can be 'SPONSORING' | 'ATTENDING' | 'CONSIDERING' | null (when 'N/A')
      const { error } = await supabase
        .from('Event')
        .update({ participationStatus: participationStatus ?? null, updatedAt: new Date().toISOString() })
        .in('id', eventIds)
      if (error) throw error
      return NextResponse.json({ success: true, message: `Updated tag for ${eventIds.length} event(s)` })
    }

    if (action === 'delete') {
      const { error } = await supabase
        .from('Event')
        .delete()
        .in('id', eventIds)
      if (error) throw error
      return NextResponse.json({ success: true, message: `Deleted ${eventIds.length} event(s)` })
    }

    return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Error in events bulk operation:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process events bulk action' },
      { status: 500 }
    )
  }
}
