import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

// Create a Supabase client with the service role key for API routes
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

function formatLastContact(date: Date | null): string {
  if (!date) return 'Never'
  
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
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
    // Get top analysts sorted by influence score
    const { data: analysts, error } = await supabase
      .from('Analyst')
      .select(`
        id,
        firstName,
        lastName,
        company,
        influenceScore,
        relationshipHealth,
        lastContactDate,
        interactions!inner (
          date
        ),
        calendarMeetings!inner (
          endTime
        )
      `)
      .eq('status', 'ACTIVE')
      .order('date', { foreignTable: 'interactions', ascending: false })
      .order('endTime', { foreignTable: 'calendarMeetings', ascending: false })
      .order('influenceScore', { ascending: false })
      .limit(5)

    if (error) throw error

    if (!analysts) {
      return NextResponse.json([])
    }

    const topAnalysts = analysts.map(analyst => {
      // Find the most recent contact date from various sources
      const contactDates = [
        analyst.lastContactDate,
        analyst.interactions?.[0]?.date,
        analyst.calendarMeetings?.[0]?.endTime
      ].filter(Boolean) as string[]

      const lastContact = contactDates.length > 0 
        ? new Date(Math.max(...contactDates.map(d => new Date(d).getTime())))
        : null

      return {
        id: analyst.id,
        name: `${analyst.firstName} ${analyst.lastName}`,
        company: analyst.company || 'Unknown',
        influence: analyst.influenceScore,
        lastContact: formatLastContact(lastContact),
        health: analyst.relationshipHealth
      }
    })

    return NextResponse.json(topAnalysts)
  } catch (error) {
    console.error('Error fetching top analysts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch top analysts' },
      { status: 500 }
    )
  }
}
