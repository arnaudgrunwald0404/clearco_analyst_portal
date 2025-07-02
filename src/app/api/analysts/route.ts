import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Check for required environment variables
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      company,
      title,
      phone,
      linkedIn,
      twitter,
      website,
      bio,
      type,
      eligibleNewsletters,
      coveredTopics,
      influence,
      status
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'First name, last name, and email are required' },
        { status: 400 }
      )
    }

    // Check if analyst with email already exists
    const { data: existingAnalyst } = await supabase
      .from('Analyst')
      .select('id')
      .eq('email', email)
      .single()

    if (existingAnalyst) {
      return NextResponse.json(
        { error: 'An analyst with this email already exists' },
        { status: 409 }
      )
    }

    // Create the analyst
    const { data: analyst, error: analystError } = await supabase
      .from('Analyst')
      .insert({
        firstName,
        lastName,
        email,
        company: company || null,
        title: title || null,
        phone: phone || null,
        linkedIn: linkedIn || null,
        twitter: twitter || null,
        website: website || null,
        bio: bio || null,
        type: type || 'Analyst',
        eligibleNewsletters: eligibleNewsletters || null,
        influence: influence || 'MEDIUM',
        status: status || 'ACTIVE'
      })
      .select()
      .single()

    if (analystError) {
      throw analystError
    }

    // Create covered topics if provided
    if (coveredTopics && coveredTopics.length > 0) {
      const topicInserts = coveredTopics.map((topic: string) => ({
        analystId: analyst.id,
        topic
      }))

      const { error: topicsError } = await supabase
        .from('AnalystCoveredTopic')
        .insert(topicInserts)

      if (topicsError) {
        console.error('Error creating covered topics:', topicsError)
      }
    }

    return NextResponse.json({
      success: true,
      data: analyst
    })

  } catch (error) {
    console.error('Error creating analyst:', error)
    return NextResponse.json(
      { error: 'Failed to create analyst' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const includeArchived = searchParams.get('includeArchived') === 'true'
    
    // Build the query with Supabase
    let query = supabase
      .from('Analyst')
      .select(`
        *,
        coveredTopics:AnalystCoveredTopic(topic)
      `)
      .order('lastName', { ascending: true })
    
    if (!includeArchived) {
      query = query.neq('status', 'ARCHIVED')
    }
    
    const { data: analysts, error } = await query

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!analysts) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Transform the data to match the expected format
    const transformedAnalysts = analysts.map(analyst => ({
      ...analyst,
      coveredTopics: analyst.coveredTopics || []
    }))

    return NextResponse.json({
      success: true,
      data: transformedAnalysts
    })

  } catch (error) {
    console.error('Error fetching analysts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analysts from database' },
      { status: 500 }
    )
  }
}
