import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Check for required environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const award = await prisma.award.findUnique({
      where: { id }
    })
    if (!award) {
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      awardName,
      publicationDate,
      processStartDate,
      contactInfo,
      priority,
      topics
    } = body
    if (!awardName || !publicationDate || !processStartDate || !contactInfo) {
      return NextResponse.json(
        { error: 'Award name, publication date, process start date, and contact information are required' },
        { status: 400 }
      )
    }
    const award = await prisma.award.update({
      where: { id },
      data: {
        awardName,
        publicationDate: new Date(publicationDate),
        processStartDate: new Date(processStartDate),
        contactInfo,
        priority: priority || 'MEDIUM',
        topics: topics || ''
      }
    })
    return NextResponse.json({
      success: true,
      data: award
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Award not found' },
        { status: 404 }
      )
    }
    console.error('Error updating award:', error)
    return NextResponse.json(
      { error: 'Failed to update award' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await prisma.award.delete({
      where: { id }
    })
    return NextResponse.json({
      success: true,
      message: 'Award deleted successfully'
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { error: 'Award not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting award:', error)
    return NextResponse.json(
      { error: 'Failed to delete award' },
      { status: 500 }
    )
  }
}
