import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase env vars missing for availability-slots route')
      return NextResponse.json({ success: false, error: 'Server not configured' }, { status: 500 })
    }

    // Use service-role client so this works without a Supabase auth session while impersonating
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data, error } = await supabase
      .from('availability_slots')
      .select('*')
      .eq('is_booked', false)
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Supabase error fetching availability_slots:', error)
      return NextResponse.json({ success: false, error: 'Failed to fetch availability slots' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error fetching availability slots:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
