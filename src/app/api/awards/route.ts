import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

export async function GET() {
  try {
    console.log('🏆 [Awards API] Fetching awards...')
    
    const supabase = await createClient()

    const { data: rows, error } = await supabase
      .from('awards')
      .select('*')
      .order('processStartDate', { ascending: false })

    if (error) {
      console.error('Error fetching awards:', error)
      return NextResponse.json(
        { error: 'Failed to fetch awards' },
        { status: 500 }
      )
    }

    const awards = (rows || []).map((r: any) => ({
      id: r.id,
      name: r.awardName ?? r.name ?? null,
      link: r.link ?? null,
      organization: r.contactInfo ?? r.organization ?? null,
      productTopics: Array.isArray(r.topics) ? r.topics : (typeof r.topics === 'string' ? r.topics.split(',').map((t: string) => t.trim()).filter(Boolean) : r.productTopics ?? []),
      priority: r.priority ?? 'MEDIUM',
      submissionDate: r.processStartDate ?? r.submissionDate ?? null,
      publicationDate: r.publicationDate ?? null,
      owner: r.owner ?? null,
      status: r.status ?? 'EVALUATING',
      cost: r.cost ?? null,
      notes: r.notes ?? null,
      createdAt: r.createdAt ?? null,
      updatedAt: r.updatedAt ?? null,
    }))

    console.log(`🏆 [Awards API] Found ${awards.length} awards`)

    return NextResponse.json({
      success: true,
      data: awards
    })

  } catch (error) {
    console.error('Error in awards GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      name,
      link,
      organization,
      productTopics,
      priority,
      submissionDate,
      publicationDate,
      owner,
      status,
      cost,
      notes
    } = body

    // Validate required fields
    if (!name || !publicationDate || !submissionDate || !organization) {
      return NextResponse.json(
        { error: 'Award name, publication date, submission date, and organization are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Create the award
    const awardData = {
      id: generateId(),
      awardName: name,
      contactInfo: organization,
      topics: productTopics ? (Array.isArray(productTopics) ? productTopics.join(', ') : productTopics) : null,
      priority: priority || 'MEDIUM',
      processStartDate: new Date(submissionDate).toISOString(),
      publicationDate: new Date(publicationDate).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: award, error } = await supabase
      .from('awards')
      .insert(awardData)
      .select()
      .single()

    if (error) {
      console.error('Error creating award:', error)
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create award' 
        },
        { status: 500 }
      )
    }

    console.log(`🏆 [Awards API] Award created: ${award.awardName || award.name || award.id}`)

    return NextResponse.json({
      success: true,
      data: award
    })

  } catch (error) {
    console.error('Error in awards POST:', error)
    return NextResponse.json(
      { error: 'Failed to create award' },
      { status: 500 }
    )
  }
}
