import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Fetch publications from the last 2 years
    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)

    const supabase = await createClient()

    const { data: publications, error } = await supabase
      .from('publications')
      .select('*')
      .eq('analystId', id)
      .gte('publishedAt', twoYearsAgo.toISOString())
      .eq('isTracked', true)
      .order('publishedAt', { ascending: false })
      .limit(20) // Limit to most recent 20 publications

    if (error) {
      console.error('Error fetching publications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch publications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: publications || []
    })

  } catch (error) {
    console.error('Error fetching publications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch publications' },
      { status: 500 }
    )
  }
}
