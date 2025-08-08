import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: { id: string }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const supabase = await createClient()

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
