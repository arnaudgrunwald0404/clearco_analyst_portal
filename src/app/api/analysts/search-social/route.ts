import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

interface SearchResult {
  platform: 'linkedin' | 'twitter' | 'website'
  url?: string
  handle?: string
  confidence: number
  reason: string
}

interface SocialMediaSearchResponse {
  website?: string
  linkedin?: string
  twitter?: string
  confidence: number
  reasoning: string
}

async function searchSocialMediaWithChatGPT(
  analystName: string,
  company: string,
  title?: string
): Promise<SocialMediaSearchResponse> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const prompt = `You are an expert at finding professional social media profiles and websites for industry analysts. 

Find the website, LinkedIn, and Twitter/X profiles for:
Name: ${analystName}
Company: ${company}${title ? `\nTitle: ${title}` : ''}

Please provide:
1. Their professional website URL (personal or company profile page)
2. Their LinkedIn profile URL 
3. Their Twitter/X profile URL

Important:
- Only provide URLs that you are confident exist
- Use standard URL formats (https://linkedin.com/in/username, https://twitter.com/username, etc.)
- If you're not confident about a specific platform, don't include it
- Provide a confidence score (0-100) based on how certain you are
- Explain your reasoning

Respond in this exact JSON format:
{
  "website": "https://example.com/profile" or null,
  "linkedin": "https://linkedin.com/in/username" or null,
  "twitter": "https://twitter.com/username" or null,
  "confidence": 85,
  "reasoning": "Explanation of findings and confidence level"
}`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert researcher who finds accurate professional social media profiles and websites. Always respond with valid JSON in the exact format requested. Only include URLs you are confident exist."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for more consistent, factual responses
    })

    const result = completion.choices[0].message.content
    
    if (!result) {
      throw new Error('No response from ChatGPT')
    }

    try {
      const parsedResult = JSON.parse(result) as SocialMediaSearchResponse
      return parsedResult
    } catch (parseError) {
      console.error('Failed to parse ChatGPT response:', result)
      throw new Error('Invalid response format from ChatGPT')
    }
  } catch (error) {
    console.error('ChatGPT search error:', error)
    throw error
  }
}

async function searchSocialMediaProfile(
  analystName: string,
  company: string,
  platform: 'linkedin' | 'twitter' | 'website',
  title?: string
): Promise<SearchResult> {
  try {
    // Use ChatGPT to find all social media profiles at once
    const chatGPTResult = await searchSocialMediaWithChatGPT(analystName, company, title)
    
    let url: string | undefined
    let handle: string | undefined
    
    switch (platform) {
      case 'website':
        url = chatGPTResult.website || undefined
        break
      case 'linkedin':
        url = chatGPTResult.linkedin || undefined
        if (url) {
          // Extract handle from LinkedIn URL
          const match = url.match(/linkedin\.com\/in\/([^/?]+)/)
          handle = match ? match[1] : undefined
        }
        break
      case 'twitter':
        url = chatGPTResult.twitter || undefined
        if (url) {
          // Extract handle from Twitter URL
          const match = url.match(/(?:twitter\.com|x\.com)\/([^/?]+)/)
          handle = match ? `@${match[1]}` : undefined
        }
        break
    }

    if (!url) {
      return {
        platform,
        confidence: 0,
        reason: `No reliable ${platform} profile found for ${analystName} at ${company} via ChatGPT search`
      }
    }

    return {
      platform,
      url,
      handle,
      confidence: chatGPTResult.confidence,
      reason: chatGPTResult.reasoning
    }
  } catch (error) {
    console.error(`Error searching ${platform} profile:`, error)
    return {
      platform,
      confidence: 0,
      reason: `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { analystId, analystName, company, platform, title } = await request.json()

    if (!analystId || !analystName || !platform) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: analystId, analystName, platform'
      }, { status: 400 })
    }

    if (!['linkedin', 'twitter', 'website'].includes(platform)) {
      return NextResponse.json({
        success: false,
        error: 'Platform must be "linkedin", "twitter", or "website"'
      }, { status: 400 })
    }

    // Search for the social media profile or website
    const searchResult = await searchSocialMediaProfile(analystName, company || '', platform, title)

    // Note: Database update would be implemented here in a real application
    // For now, we return the search result and let the UI handle the update
    // This avoids the Next.js cookies API warning and keeps the API stateless

    return NextResponse.json({
      success: true,
      result: searchResult
    })
  } catch (error) {
    console.error('Social media search error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// New endpoint to search all platforms at once
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const analystName = searchParams.get('analystName')
    const company = searchParams.get('company')
    const title = searchParams.get('title')

    if (!analystName || !company) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: analystName, company'
      }, { status: 400 })
    }

    // Use ChatGPT to find all social media profiles at once
    const chatGPTResult = await searchSocialMediaWithChatGPT(analystName, company, title || undefined)

    return NextResponse.json({
      success: true,
      result: chatGPTResult
    })
  } catch (error) {
    console.error('Social media search error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
