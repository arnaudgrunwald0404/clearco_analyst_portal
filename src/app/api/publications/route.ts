import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const analystId = searchParams.get('analystId')
    const type = searchParams.get('type')
    const isTracked = searchParams.get('isTracked')

    const supabase = createClient()

    // Build query
    let query = supabase
      .from('Publication')
      .select('*')

    // Apply filters
    if (analystId) {
      query = query.eq('analystId', analystId)
    }
    
    if (type) {
      // Map common type names to actual enum values
      const typeMapping: { [key: string]: string } = {
        'report': 'RESEARCH_REPORT',
        'research_report': 'RESEARCH_REPORT',
        'article': 'ARTICLE',
        'whitepaper': 'WHITEPAPER',
        'blog_post': 'BLOG_POST',
        'webinar': 'WEBINAR',
        'podcast': 'PODCAST',
        'other': 'OTHER'
      }
      const enumValue = typeMapping[type.toLowerCase()] || type.toUpperCase()
      query = query.eq('type', enumValue)
    }
    
    if (isTracked !== null) {
      query = query.eq('isTracked', isTracked === 'true')
    }

    // Order by published date (newest first)
    query = query.order('publishedAt', { ascending: false })

    const { data: publications, error } = await query

    if (error) {
      console.error('Error fetching publications:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch publications' },
        { status: 500 }
      )
    }

    // Process the data to match the expected format
    const processedPublications = publications?.map(publication => ({
      ...publication,
      analyst: null // We'll add analyst data later when we fix the join
    })) || []

    return NextResponse.json({
      success: true,
      data: processedPublications
    })

  } catch (error) {
    console.error('Error fetching publications:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch publications' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      analystId,
      title,
      url,
      summary,
      type,
      publishedAt,
      isTracked = true
    } = body

    // Validate required fields
    if (!analystId || !title || !type || !publishedAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: analystId, title, type, publishedAt' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Map common type names to actual enum values
    const typeMapping: { [key: string]: string } = {
      'report': 'RESEARCH_REPORT',
      'research_report': 'RESEARCH_REPORT',
      'article': 'ARTICLE',
      'whitepaper': 'WHITEPAPER',
      'blog_post': 'BLOG_POST',
      'webinar': 'WEBINAR',
      'podcast': 'PODCAST',
      'other': 'OTHER'
    }
    const enumValue = typeMapping[type.toLowerCase()] || type.toUpperCase()

    const newPublication = {
      analystId,
      title,
      url: url || null,
      summary: summary || null,
      type: enumValue,
      publishedAt: new Date(publishedAt).toISOString(),
      isTracked,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: publication, error } = await supabase
      .from('Publication')
      .insert(newPublication)
      .select('*')
      .single()

    if (error) {
      console.error('Error creating publication:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to create publication' },
        { status: 500 }
      )
    }

    // Process the response
    const processedPublication = {
      ...publication,
      analyst: null // We'll add analyst data later when we fix the join
    }

    console.log('✅ Publication created successfully:', publication.id)

    return NextResponse.json({
      success: true,
      data: processedPublication
    })

  } catch (error) {
    console.error('Error creating publication:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create publication' },
      { status: 500 }
    )
  }
} 