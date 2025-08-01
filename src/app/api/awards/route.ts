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

    const { data: awards, error } = await supabase
      .from('"Award"')
      .select('*')
      .order('submissionDate', { ascending: false })

    if (error) {
      console.error('Error fetching awards:', error)
      return NextResponse.json(
        { error: 'Failed to fetch awards' },
        { status: 500 }
      )
    }

    console.log(`🏆 [Awards API] Found ${awards?.length || 0} awards`)

    return NextResponse.json({
      success: true,
      data: awards || []
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
      name,
      link: link || null,
      organization,
      productTopics: productTopics ? JSON.stringify(Array.isArray(productTopics) ? productTopics : [productTopics]) : null,
      priority: priority || 'MEDIUM',
      submissionDate: new Date(submissionDate).toISOString(),
      publicationDate: new Date(publicationDate).toISOString(),
      owner: owner || null,
      status: status || 'EVALUATING',
      cost: cost || null,
      notes: notes || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data: award, error } = await supabase
      .from('"Award"')
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

    console.log(`🏆 [Awards API] Award created: ${award.name}`)

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
