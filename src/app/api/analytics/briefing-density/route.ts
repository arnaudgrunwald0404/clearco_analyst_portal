import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 [Analytics] Fetching briefing density data...')
    
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const supabase = await createClient()

    const { data: briefings, error } = await supabase
      .from('briefings')
      .select('scheduledAt')
      .gte('scheduledAt', oneYearAgo.toISOString())
      .not('scheduledAt', 'is', null)
      .order('scheduledAt', { ascending: true })

    if (error) {
      console.error('Error fetching briefings for density:', error)
      return NextResponse.json(
        { error: 'Failed to fetch briefing density data' },
        { status: 500 }
      )
    }

    console.log(`📊 [Analytics] Found ${briefings?.length || 0} briefings for density analysis`)

    // Group briefings by date
    const contributions = (briefings || []).reduce((acc: Record<string, number>, briefing) => {
      if (briefing.scheduledAt) {
        const date = briefing.scheduledAt.split('T')[0] // Get YYYY-MM-DD format
        if (!acc[date]) {
          acc[date] = 0
        }
        acc[date]++
      }
      return acc
    }, {})

    // Convert to array format for frontend consumption
    const data = Object.entries(contributions).map(([date, count]) => ({
      date,
      count,
    }))

    console.log(`📊 [Analytics] Processed ${data.length} unique dates with briefings`)

    return NextResponse.json({
      success: true,
      data,
      period: {
        start: oneYearAgo.toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      totalBriefings: briefings?.length || 0,
      uniqueDates: data.length
    })

  } catch (error) {
    console.error('Error in briefing density analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch briefing density data' },
      { status: 500 }
    )
  }
} 