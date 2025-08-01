import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const tierFilter = searchParams.get('tier') || ''
    
    const offset = (page - 1) * limit
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    console.log('🔍 [Briefings Due API] Fetching analysts due for briefings...')

    const supabase = await createClient()

    // Get all influence tiers for reference
    const { data: influenceTiers, error: tiersError } = await supabase
      .from('influence_tiers')
      .select('*')
      .eq('isActive', true)
      .order('order', { ascending: true })

    if (tiersError) {
      console.error('Error fetching influence tiers:', tiersError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch influence tiers' },
        { status: 500 }
      )
    }

    // Build the base query for analysts
    let query = supabase
      .from('analysts')
      .select('*')
      .eq('status', 'ACTIVE')

    // Add search filter
    if (search) {
      query = query.or(`firstName.ilike.%${search}%,lastName.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`)
    }

    // Get ALL analysts - no pagination limits
    const { data: analysts, error: analystsError } = await query.order('firstName', { ascending: true })

    if (analystsError) {
      console.error('Error fetching analysts:', analystsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch analysts' },
        { status: 500 }
      )
    }

    // Filter and process analysts who need briefings
    const analystsDueForBriefings = []
    
    for (const analyst of analysts || []) {
      // Map influence to tier information from the database
      const tier = influenceTiers?.find(t => {
        if (t.name === 'Very High' && analyst.influence === 'VERY_HIGH') return true
        if (t.name === 'High' && analyst.influence === 'HIGH') return true
        if (t.name === 'Medium' && analyst.influence === 'MEDIUM') return true
        if (t.name === 'Low' && analyst.influence === 'LOW') return true
        return false
      })
      
      if (!tier) continue
      
      // Skip analysts from inactive tiers
      if (!tier.isActive) continue

      const daysBetweenBriefings = tier.briefingFrequency
      
      // Get the analyst's last briefing
      const { data: lastBriefing } = await supabase
        .from('briefings')
        .select('id, title, completedAt')
        .eq('status', 'COMPLETED')
        .order('completedAt', { ascending: false })
        .limit(1)
        .single()
      
      // Check for future briefings
      const { data: futureBriefing } = await supabase
        .from('briefings')
        .select('id, title, scheduledAt, status')
        .gt('scheduledAt', now.toISOString())
        .in('status', ['SCHEDULED', 'RESCHEDULED'])
        .order('scheduledAt', { ascending: true })
        .limit(1)
        .single()
      
      // Calculate days since last briefing
      const daysSinceLastBriefing = lastBriefing?.completedAt 
        ? Math.floor((now.getTime() - new Date(lastBriefing.completedAt).getTime()) / (1000 * 60 * 60 * 24))
        : null
      
      // Check if analyst needs a briefing based on tier frequency
      // Skip if they have a future briefing scheduled
      const needsBriefing = !futureBriefing && (!lastBriefing || (daysSinceLastBriefing && daysSinceLastBriefing >= daysBetweenBriefings))
      
      if (needsBriefing) {
        // Calculate overdue days
        const overdueDays = daysSinceLastBriefing && daysSinceLastBriefing > daysBetweenBriefings 
          ? daysSinceLastBriefing - daysBetweenBriefings 
          : 0
        
        analystsDueForBriefings.push({
          id: analyst.id,
          firstName: analyst.firstName,
          lastName: analyst.lastName,
          email: analyst.email,
          company: analyst.company,
          title: analyst.title,
          influence: analyst.influence,
          relationshipHealth: analyst.relationshipHealth || 'GOOD',
          profileImageUrl: analyst.profileImageUrl,
          tier: {
            name: tier.name,
            briefingFrequency: tier.briefingFrequency
          },
          lastBriefing: lastBriefing ? {
            id: lastBriefing.id,
            title: lastBriefing.title,
            completedAt: lastBriefing.completedAt
          } : null,
          nextBriefing: futureBriefing ? {
            id: futureBriefing.id,
            title: futureBriefing.title,
            scheduledAt: futureBriefing.scheduledAt,
            status: futureBriefing.status
          } : null,
          daysSinceLastBriefing: daysSinceLastBriefing || 0,
          overdueDays,
          needsBriefing: true
        })
      }
    }

    // Get total count of all analysts (for reference)
    const { count: totalAnalysts } = await supabase
      .from('analysts')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'ACTIVE')

    console.log(`📊 [Briefings Due API] Found ${analystsDueForBriefings.length} analysts due for briefings`)

    return NextResponse.json({
      success: true,
      data: analystsDueForBriefings,
      pagination: {
        page: 1,
        limit: 'all',
        total: analystsDueForBriefings.length,
        totalAnalysts: totalAnalysts || 0,
        totalPages: 1
      },
      filters: {
        search,
        tier: tierFilter
      }
    })

  } catch (error) {
    console.error('❌ [Briefings Due API] Error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch analysts due for briefings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
