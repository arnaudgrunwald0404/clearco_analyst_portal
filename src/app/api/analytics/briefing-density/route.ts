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
      .select('id, scheduledAt')
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

    // Group briefings by date and collect briefingIds per date
    const contributions = (briefings || []).reduce((acc: Record<string, { count: number, briefingIds: string[] }>, briefing: any) => {
      if (briefing.scheduledAt) {
        const date = briefing.scheduledAt.split('T')[0]
        if (!acc[date]) {
          acc[date] = { count: 0, briefingIds: [] }
        }
        acc[date].count += 1
        if (briefing.id) acc[date].briefingIds.push(briefing.id)
      }
      return acc
    }, {})

    // Fetch all briefing_analysts for the collected briefingIds
    const allBriefingIds = Array.from(new Set((briefings || []).map((b: any) => b.id))).filter(Boolean)
    let analystInfluenceByBriefingId: Record<string, string[]> = {}
    if (allBriefingIds.length > 0) {
      const { data: briefingAnalysts } = await supabase
        .from('briefing_analysts')
        .select('briefingId, analystId')
        .in('briefingId', allBriefingIds)

      const analystIds = Array.from(new Set((briefingAnalysts || []).map(ba => ba.analystId))).filter(Boolean) as string[]
      let analystsById: Record<string, string> = {}
      if (analystIds.length > 0) {
        const { data: analysts } = await supabase
          .from('analysts')
          .select('id, influence')
          .in('id', analystIds)

        analystsById = (analysts || []).reduce((acc: Record<string, string>, a: any) => {
          acc[a.id] = a.influence
          return acc
        }, {})
      }

      analystInfluenceByBriefingId = (briefingAnalysts || []).reduce((acc: Record<string, string[]>, ba: any) => {
        const inf = analystsById[ba.analystId]
        if (!acc[ba.briefingId]) acc[ba.briefingId] = []
        if (inf) acc[ba.briefingId].push(inf)
        return acc
      }, {})
    }

    // Influence ranking
    const influenceRank: Record<string, number> = {
      'LOW': 1,
      'MEDIUM': 2,
      'HIGH': 3,
      'VERY_HIGH': 4
    }

    // Convert to array format for frontend consumption with maxInfluence per date
    const data = Object.entries(contributions).map(([date, { count, briefingIds }]) => {
      let maxInfluence: string | null = null
      let maxRank = 0
      for (const bId of briefingIds) {
        const influences = analystInfluenceByBriefingId[bId] || []
        for (const inf of influences) {
          const rank = influenceRank[inf] || 0
          if (rank > maxRank) {
            maxRank = rank
            maxInfluence = inf
          }
        }
      }
      return { date, count, maxInfluence }
    })

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