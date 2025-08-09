import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult
    }
    const authUser = authResult

    const supabase = createClient()

    // 1. Get the analyst's ID from their authenticated email
    const { data: analyst, error: analystError } = await supabase
      .from('analysts')
      .select('id')
      .eq('email', authUser.email)
      .single()

    if (analystError || !analyst) {
      return NextResponse.json({ success: false, error: 'Analyst profile not found.' }, { status: 404 })
    }

    const { slot_id } = await request.json()

    if (!slot_id) {
      return NextResponse.json({ success: false, error: 'Slot ID is required.' }, { status: 400 })
    }

    // 2. Check if the slot is still available
    const { data: slot, error: slotError } = await supabase
      .from('availability_slots')
      .select('is_booked')
      .eq('id', slot_id)
      .single()

    if (slotError || !slot) {
      return NextResponse.json({ success: false, error: 'Availability slot not found.' }, { status: 404 })
    }

    if (slot.is_booked) {
      return NextResponse.json({ success: false, error: 'This time slot is no longer available.' }, { status: 409 }) // 409 Conflict
    }

    // 3. Trigger n8n workflow
    const n8nWebhookUrl = process.env.N8N_SCHEDULING_WEBHOOK_URL
    if (!n8nWebhookUrl) {
      console.error('N8N_SCHEDULING_WEBHOOK_URL is not set.')
      // Fallback: Handle directly in the API if n8n is not configured
      // This is not ideal, but provides a fallback path.
      // For now, we'll just return an error.
      return NextResponse.json({ success: false, error: 'Scheduling service is not configured.' }, { status: 503 })
    }

    const webhookResponse = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot_id,
        analyst_id: analyst.id,
      }),
    })

    if (!webhookResponse.ok) {
      console.error('n8n webhook failed:', await webhookResponse.text())
      return NextResponse.json({ success: false, error: 'Failed to submit briefing request.' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Your briefing request has been submitted.' })

  } catch (error) {
    console.error('Error in POST /api/briefings/request:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
