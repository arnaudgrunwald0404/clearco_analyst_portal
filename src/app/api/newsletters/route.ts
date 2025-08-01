import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET() {
  try {
    console.log('📧 [Newsletters API] Fetching newsletters...')
    
    const supabase = await createClient()

    // Get newsletters from Supabase
    const { data: newsletters, error } = await supabase
      .from('Newsletter')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Error fetching newsletters:', error)
      return NextResponse.json(
        { error: 'Failed to fetch newsletters' },
        { status: 500 }
      )
    }

    console.log(`📧 [Newsletters API] Found ${newsletters?.length || 0} newsletters`)

    // For now, return basic metrics since we don't have subscription data structure
    const newslettersWithMetrics = (newsletters || []).map(newsletter => ({
      ...newsletter,
      metrics: {
        totalRecipients: 0,
        openRate: 0,
        clickRate: 0,
        openedCount: 0,
        clickedCount: 0
      }
    }))

    return NextResponse.json({
      success: true,
      data: newslettersWithMetrics
    })

  } catch (error) {
    console.error('Error in newsletters GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('📧 [Newsletters API] Creating new newsletter...')
    
    const body = await request.json()
    const { title, subject, content, htmlContent, status = 'DRAFT', scheduledAt, createdBy } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const newsletterData = {
      id: generateId(),
      title,
      subject: subject || '',
      content: content || '',
      htmlContent: htmlContent || '',
      status,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      createdBy: createdBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: newsletter, error } = await supabase
      .from('Newsletter')
      .insert(newsletterData)
      .select()
      .single()

    if (error) {
      console.error('Error creating newsletter:', error)
      return NextResponse.json(
        { error: 'Failed to create newsletter' },
        { status: 500 }
      )
    }

    console.log(`📧 [Newsletters API] Created newsletter: ${newsletter.title}`)

    return NextResponse.json({
      success: true,
      data: newsletter
    })

  } catch (error) {
    console.error('Error in newsletters POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 