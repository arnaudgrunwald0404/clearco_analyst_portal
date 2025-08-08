import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { OpenAIPublicationDiscovery } from '@/lib/publication-discovery/openai-discovery'

export async function GET(request: NextRequest) {
  try {
    console.log('🤖 Starting AI-powered publication discovery...')

    const { searchParams } = new URL(request.url)
    const analystId = searchParams.get('analystId')
    const limit = parseInt(searchParams.get('limit') || '5')

    const supabase = await createClient()
    
    // Get analysts to process
    let analystsQuery = supabase
      .from('analysts')
      .select('id, firstName, lastName, company, email, personalWebsite, linkedinUrl, twitterHandle')

    if (analystId) {
      analystsQuery = analystsQuery.eq('id', analystId)
    }

    const { data: analysts, error: analystsError } = await analystsQuery.limit(limit)
    
    if (analystsError) {
      throw analystsError
    }

    if (!analysts || analysts.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No analysts found to process'
      })
    }

    console.log(`📊 Processing ${analysts.length} analysts`)

    // Initialize OpenAI discovery service
    const discoveryService = new OpenAIPublicationDiscovery()

    // Discover publications using AI
    const results = await discoveryService.discoverPublicationsForAnalysts(analysts)

    // Format response data
    const discoveredPublications = results.flatMap(result => 
      result.publications.map(pub => ({
        ...pub,
        analystId: result.analyst.id,
        analystName: `${result.analyst.firstName} ${result.analyst.lastName}`,
        analystCompany: result.analyst.company,
        discoveredAt: new Date().toISOString()
      }))
    )

    // Summary statistics
    const summary = {
      totalAnalystsProcessed: results.length,
      totalPublicationsFound: discoveredPublications.length,
      successfulAnalysts: results.filter(r => !r.error).length,
      failedAnalysts: results.filter(r => r.error).length,
      averagePublicationsPerAnalyst: Math.round(
        discoveredPublications.length / Math.max(results.filter(r => !r.error).length, 1)
      ),
      publicationsByType: discoveredPublications.reduce((acc, pub) => {
        acc[pub.type] = (acc[pub.type] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      confidenceDistribution: discoveredPublications.reduce((acc, pub) => {
        acc[pub.confidenceLevel] = (acc[pub.confidenceLevel] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    }

    console.log(`✅ Discovery complete: ${discoveredPublications.length} publications found`)

    return NextResponse.json({
      success: true,
      data: discoveredPublications,
      summary,
      results: results.map(r => ({
        analyst: `${r.analyst.firstName} ${r.analyst.lastName}`,
        publicationsFound: r.publications.length,
        error: r.error || null
      })),
      processedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in AI publication discovery:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json({
      success: false,
      error: 'Failed to discover publications using AI',
      details: errorMessage,
      debug: {
        message: 'Check server logs for more details',
        suggestions: [
          'Verify OPENAI_API_KEY is configured',
          'Verify GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID are configured',
          'Check OpenAI API quota and billing',
          'Ensure network connectivity to external APIs'
        ]
      }
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { publications, analystId } = body

    if (!publications || !Array.isArray(publications) || !analystId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request body. Expected { publications: [], analystId: string }'
      }, { status: 400 })
    }

    const supabase = await createClient()

    // Save discovered publications to database
    const publicationsToSave = publications.map(pub => ({
      id: `pub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: pub.title,
      summary: pub.summary,
      url: pub.url,
      type: pub.type,
      publishedAt: pub.publishedAt,
      analystId: analystId,
      status: 'PENDING_REVIEW', // Require manual review before showing as published
      relevanceScore: pub.relevanceScore,
      keyTopics: pub.keyTopics,
      confidenceLevel: pub.confidenceLevel,
      discoveredViaAI: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('publications')
      .insert(publicationsToSave)
      .select()

    if (error) {
      throw error
    }

    console.log(`💾 Saved ${publicationsToSave.length} publications to database`)

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${publicationsToSave.length} publications`,
      data: data,
      savedCount: publicationsToSave.length
    })

  } catch (error) {
    console.error('Error saving discovered publications:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to save publications',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}