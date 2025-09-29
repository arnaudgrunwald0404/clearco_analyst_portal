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
      .from('newsletters')
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
    const { title, description, subject, content, htmlContent, status = 'DRAFT', scheduledAt, createdBy, recipientAnalystIds } = body

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    const newsletterData: any = {
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
    
    // Add description if provided (only if column exists)
    if (description) {
      newsletterData.description = description
    }

    const { data: newsletter, error } = await supabase
      .from('newsletters')
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

    // Create subscriptions if recipients provided
    if (recipientAnalystIds && Array.isArray(recipientAnalystIds) && recipientAnalystIds.length > 0) {
      console.log(`📧 Creating ${recipientAnalystIds.length} subscriptions for newsletter ${newsletter.id}`)
      
      const subscriptions = recipientAnalystIds.map((analystId: string) => ({
        newsletter_id: newsletter.id,
        analyst_id: analystId
      }))

      const { error: subscriptionError } = await supabase
        .from('newsletter_subscriptions')
        .insert(subscriptions)

      if (subscriptionError) {
        console.error('Error creating subscriptions:', subscriptionError)
        // Don't fail the newsletter creation, just log the error
        console.warn('Newsletter created but subscriptions failed')
      } else {
        console.log(`📧 Created ${recipientAnalystIds.length} subscriptions`)
      }
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