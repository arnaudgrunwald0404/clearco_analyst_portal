import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function formatLastContact(date: Date | string | null): string {
  if (!date) return 'Never'
  
  const contactDate = new Date(date)
  const now = new Date()
  const diffInMs = now.getTime() - contactDate.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return '1 day ago'
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 14) return '1 week ago'
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 60) return '1 month ago'
  return `${Math.floor(diffInDays / 30)} months ago`
}

export async function GET() {
  try {
    console.log('📊 [Dashboard] Fetching top analysts...')
    
    const supabase = await createClient()

    // Get top analysts ordered by influence
    const { data: analysts, error } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, company, influence, relationshipHealth, lastContactDate, updatedAt')
      .eq('status', 'ACTIVE')
      .order('influence', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching top analysts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch top analysts' },
        { status: 500 }
      )
    }

    console.log(`📊 [Dashboard] Found ${analysts?.length || 0} top analysts`)

    // Get recent calendar meetings for these analysts
    const analystIds = (analysts || []).map(a => a.id)
    
    let recentMeetings: any[] = []
    if (analystIds.length > 0) {
      const { data: meetings } = await supabase
        .from('calendar_meetings')
        .select('analystId, endTime')
        .in('analystId', analystIds)
        .order('endTime', { ascending: false })
      
      recentMeetings = meetings || []
    }

    const topAnalysts = (analysts || []).map(analyst => {
      // Find the most recent contact date from available sources
      const recentMeeting = recentMeetings
        .filter(m => m.analystId === analyst.id)
        .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())[0]

      const contactDates = [
        analyst.lastContactDate,
        recentMeeting?.endTime,
        analyst.updatedAt
      ].filter(Boolean)

      const lastContact = contactDates.length > 0 
        ? new Date(Math.max(...contactDates.map(d => new Date(d).getTime())))
        : null

      return {
        id: analyst.id,
        name: `${analyst.firstName} ${analyst.lastName}`,
        company: analyst.company || 'Unknown',
        influence: analyst.influence || 'MEDIUM',
        lastContact: formatLastContact(lastContact),
        health: analyst.relationshipHealth || 'NEUTRAL'
      }
    })

    console.log(`📊 [Dashboard] Processed ${topAnalysts.length} top analysts`)

    return NextResponse.json({
      success: true,
      data: topAnalysts
    })
    
  } catch (error) {
    console.error('Error in top analysts dashboard:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top analysts' },
      { status: 500 }
    )
  }
}
