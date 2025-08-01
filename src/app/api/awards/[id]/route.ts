import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: award, error } = await supabase
      .from('"Award"')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !award) {
      return NextResponse.json(
        { error: 'Award not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: award
    })

  } catch (error) {
    console.error('Error fetching award:', error)
    return NextResponse.json(
      { error: 'Failed to fetch award' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
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

    const updateData = {
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
      updatedAt: new Date().toISOString()
    }

    const { data: award, error } = await supabase
      .from('"Award"')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error || !award) {
      console.error('Error updating award:', error)
      return NextResponse.json(
        { error: 'Failed to update award or award not found' },
        { status: error?.code === '23503' ? 404 : 500 }
      )
    }

    console.log(`🏆 Updated award: ${award.name}`)

    return NextResponse.json({
      success: true,
      data: award
    })

  } catch (error) {
    console.error('Error updating award:', error)
    return NextResponse.json(
      { error: 'Failed to update award' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { error } = await supabase
      .from('"Award"')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting award:', error)
      return NextResponse.json(
        { error: 'Failed to delete award' },
        { status: 500 }
      )
    }

    console.log(`🗑️ Deleted award: ${id}`)

    return NextResponse.json({
      success: true,
      message: 'Award deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting award:', error)
    return NextResponse.json(
      { error: 'Failed to delete award' },
      { status: 500 }
    )
  }
}
