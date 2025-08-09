import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

interface RouteParams {
  params: { id: string }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    // Prefer service role for deletes to avoid RLS issues
    const adminSupabase = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null
    const supabase = adminSupabase || await createClient()

    const { error } = await supabase
      .from('Publication')
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
