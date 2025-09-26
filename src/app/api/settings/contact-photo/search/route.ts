import { NextResponse } from 'next/server'

interface SearchRequest {
  name: string
  title?: string
  company?: string
  industryName?: string
}

interface PictureResult {
  url: string
  source: string
  title?: string
  confidence: number
  width?: number
  height?: number
  original_url?: string
  thumbnail?: string
}

// Use the same SerpApi-powered search logic as analysts but tailored labels
async function searchContactHeadshotsWithSerpApi(name: string, title?: string, company?: string, industryName: string = 'Technology'): Promise<PictureResult[]> {
  const results: PictureResult[] = []
  try {
    const serpApiKey = process.env.SERP_API_KEY
    if (!serpApiKey) {
      console.warn('SERP_API_KEY not found in environment variables')
      return results
    }

    const primaryQuery = company
      ? `Headshot of ${name} ${title ? title : ''} at ${company}`.trim()
      : `Professional headshot of ${name} ${title ? title : ''} ${industryName}`.trim()

    const searchQueries = [
      primaryQuery,
      `${name} ${company || industryName} professional headshot`,
    ]

    for (const query of searchQueries) {
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
        const url = `https://serpapi.com/search?${searchParams.toString()}`
        const resp = await fetch(url, { headers: { 'User-Agent': 'AnalystPortal/1.0' } })
        if (!resp.ok) continue
        const data = await resp.json()
        if (Array.isArray(data.images_results)) {
          for (const image of data.images_results.slice(0, 6)) {
            if (image.original && image.thumbnail) {
              let confidence = 70
              if (image.title && image.title.toLowerCase().includes(name.toLowerCase())) confidence += 15
              if (title && image.title?.toLowerCase().includes(title.toLowerCase())) confidence += 8
              if (company && (image.title?.toLowerCase().includes(company.toLowerCase()) || image.source?.toLowerCase().includes(company.toLowerCase()))) confidence += 12
              if (image.source && (image.source.toLowerCase().includes('linkedin') || image.source.toLowerCase().includes('about') || image.source.toLowerCase().includes('press'))) confidence += 10
              confidence = Math.min(confidence, 95)
              results.push({
                url: image.original,
                thumbnail: image.thumbnail,
                source: image.source || 'Google Images',
                title: image.title || `${name}`,
                confidence,
                width: image.original_width || 400,
                height: image.original_height || 400,
                original_url: image.link || undefined,
              })
            }
          }
        }
        await new Promise(r => setTimeout(r, 100))
      } catch (e) {
        console.error('Error during SerpApi contact search:', e)
      }
    }
  } catch (e) {
    console.error('Contact headshot search error:', e)
  }
  return results
}

async function fallbackAvatars(name: string): Promise<PictureResult[]> {
  return [
    {
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=400&background=2563eb&color=fff&font-size=0.4&format=png&bold=true`,
      thumbnail: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=150&background=2563eb&color=fff&font-size=0.4&format=png&bold=true`,
      source: 'Avatar',
      title: `${name} Avatar`,
      confidence: 55,
      width: 400,
      height: 400,
    },
  ]
}

export async function POST(request: Request) {
  try {
    const { name, title, company, industryName }: SearchRequest = await request.json()
    if (!name) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }
    const industry = industryName || 'Technology'
    let results = await searchContactHeadshotsWithSerpApi(name, title, company, industry)
    const unique = results.filter((r, i, a) => i === a.findIndex(x => x.url === r.url))
    if (unique.length === 0) unique.push(...(await fallbackAvatars(name)))
    const sorted = unique.sort((a, b) => b.confidence - a.confidence).slice(0, 9)
    return NextResponse.json({ success: true, results: sorted, totalFound: unique.length })
  } catch (e) {
    console.error('Contact photo search error:', e)
    return NextResponse.json({ success: false, error: 'Failed to search' }, { status: 500 })
  }
}
