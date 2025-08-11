import { NextResponse } from 'next/server'

interface SearchRequest {
  analystName: string
  company?: string
  title?: string
  industryName?: string
}

interface ProfilePictureResult {
  url: string
  source: string
  title?: string
  confidence: number
  width?: number
  height?: number
  original_url?: string
  thumbnail?: string
}

// SerpApi Google Images search for analyst headshots
async function searchAnalystHeadshotsWithSerpApi(
  analystName: string, 
  industryName: string = 'Technology',
  company?: string
): Promise<ProfilePictureResult[]> {
  const results: ProfilePictureResult[] = []
  
  try {
    const serpApiKey = process.env.SERP_API_KEY
    if (!serpApiKey) {
      console.warn('SERP_API_KEY not found in environment variables')
      return results
    }

    // Primary search query; prefer including company when available for higher precision
    const primaryQuery = company
      ? `Headshot of ${analystName} at ${company}`
      : `Headshot of ${industryName} analyst ${analystName}`
    
    // Additional fallback queries for better results
    const searchQueries = [
      primaryQuery,
      `${analystName} ${industryName} analyst headshot`,
      `${analystName} ${company || industryName} professional headshot`,
      `${analystName} analyst profile picture`,
      ...(company ? [
        `${analystName} ${company} headshot`,
        `${analystName} at ${company} professional headshot`
      ] : [])
    ]

    console.log(`🔍 SerpApi Search Queries:`, searchQueries)

    // Search with multiple queries to get best results
    for (const query of searchQueries.slice(0, 2)) { // Limit to 2 queries to avoid rate limits
      try {
        const searchParams = new URLSearchParams({
          engine: 'google_images',
          q: query,
          api_key: serpApiKey,
          google_domain: 'google.com',
          hl: 'en',
          gl: 'us',
          device: 'desktop'
        })

        const searchUrl = `https://serpapi.com/search?${searchParams.toString()}`
        console.log(`🌐 SerpApi URL: ${searchUrl.replace(serpApiKey, 'API_KEY_HIDDEN')}`)

        const response = await fetch(searchUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'AnalystPortal/1.0'
          }
        })
        
        if (!response.ok) {
          console.error(`SerpApi HTTP error: ${response.status} - ${response.statusText}`)
          continue
        }

        const data = await response.json()
        console.log(`📊 SerpApi response status:`, data.search_information?.image_results_state || 'Unknown')
        
        if (data.images_results && Array.isArray(data.images_results) && data.images_results.length > 0) {
          console.log(`✅ Found ${data.images_results.length} images for query: "${query}"`)
          
          for (const image of data.images_results.slice(0, 6)) { // Take top 6 from each query
            // Ensure we have required fields
            if (image.original && image.thumbnail) {
              // Calculate confidence based on relevance factors
              let confidence = 70 // Base confidence
              
              // Boost confidence if analyst name appears in title
              if (image.title && image.title.toLowerCase().includes(analystName.toLowerCase())) {
                confidence += 15
              }
              
              // Boost confidence if industry appears in title or source
              if (image.title?.toLowerCase().includes(industryName.toLowerCase()) || 
                  image.source?.toLowerCase().includes(industryName.toLowerCase())) {
                confidence += 10
              }
              // Boost confidence if company appears in title or source
              if (company && (
                image.title?.toLowerCase().includes(company.toLowerCase()) ||
                image.source?.toLowerCase().includes(company.toLowerCase())
              )) {
                confidence += 12
              }
              
              // Boost confidence for professional sources
              if (image.source && (
                image.source.toLowerCase().includes('linkedin') ||
                image.source.toLowerCase().includes('professional') ||
                image.source.toLowerCase().includes('executive') ||
                image.source.toLowerCase().includes('business')
              )) {
                confidence += 15
              }
              
              // Cap confidence at 95%
              confidence = Math.min(confidence, 95)

              results.push({
                url: image.original,
                thumbnail: image.thumbnail,
                source: image.source || 'Google Images',
                title: image.title || `${analystName} - ${industryName} Analyst`,
                confidence: confidence,
                width: image.original_width || 400,
                height: image.original_height || 400,
                original_url: image.link || undefined
              })
            }
          }
        } else {
          console.log(`❌ No images found for query: "${query}"`)
          if (data.error) {
            console.error(`SerpApi Error:`, data.error)
          } else {
            console.log(`🔍 Response structure:`, Object.keys(data))
            console.log(`🔍 Search info:`, data.search_information)
          }
        }
        
        // Add delay between requests to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.error(`SerpApi search error for query "${query}":`, error)
      }
    }
  } catch (error) {
    console.error('SerpApi Google Images search error:', error)
  }
  
  return results
}

// Generate professional avatars as fallback when no real photos are found
async function generateProfessionalAvatars(analystName: string, industryName: string): Promise<ProfilePictureResult[]> {
  const initials = analystName.split(' ').map(n => n[0]).join('').toUpperCase()
  
  return [
    {
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(analystName)}&size=400&background=2563eb&color=fff&font-size=0.4&format=png&bold=true`,
      thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(analystName)}&size=150&background=2563eb&color=fff&font-size=0.4&format=png&bold=true`,
      source: 'Professional Avatar',
      title: `${analystName} - ${industryName} Analyst Avatar`,
      confidence: 60,
      width: 400,
      height: 400
    },
    {
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(analystName)}&size=400&background=059669&color=fff&font-size=0.4&format=png&bold=true`,
      thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(analystName)}&size=150&background=059669&color=fff&font-size=0.4&format=png&bold=true`,
      source: 'Executive Avatar',
      title: `${analystName} - ${industryName} Executive Avatar`,
      confidence: 55,
      width: 400,
      height: 400
    }
  ]
}

export async function POST(request: Request) {
  try {
    const { analystName, company, title, industryName }: SearchRequest = await request.json()
    
    if (!analystName) {
      return NextResponse.json(
        { success: false, error: 'Analyst name is required' },
        { status: 400 }
      )
    }

    // Use provided industry name or default to 'Technology'
    const industry = industryName || 'Technology'
    
    console.log(`🔍 Searching SerpApi for analyst headshots: ${analystName} in ${industry} industry`)

    // Primary search using SerpApi Google Images
    let results = await searchAnalystHeadshotsWithSerpApi(analystName, industry, company)
    
    // Remove duplicates based on URL
    const uniqueResults = results.filter((result, index, self) => 
      index === self.findIndex(r => r.url === result.url)
    )
    
    // If no real images found, fall back to professional avatars
    if (uniqueResults.length === 0) {
      console.log('No headshots found via SerpApi, using professional avatars as fallback')
      const avatarResults = await generateProfessionalAvatars(analystName, industry)
      uniqueResults.push(...avatarResults)
    }

    // Sort by confidence and limit to 9 results (3 rows of 3)
    const sortedResults = uniqueResults
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 9)

    console.log(`✅ Returning ${sortedResults.length} profile picture options`)
    const primaryDescriptor = company
      ? `Headshot of ${analystName} at ${company}`
      : `Headshot of ${industry} analyst ${analystName}`
    console.log(`🎯 Primary search query: "${primaryDescriptor}"`)

    return NextResponse.json({
      success: true,
      results: sortedResults,
      searchQuery: primaryDescriptor,
      industryName: industry,
      totalFound: uniqueResults.length
    })

  } catch (error) {
    console.error('Error searching for profile pictures:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to search for profile pictures' },
      { status: 500 }
    )
  }
}
