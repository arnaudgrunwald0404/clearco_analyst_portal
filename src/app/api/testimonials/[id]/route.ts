import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      analystId,
      quote,
      context,
      isPublished,
      displayOrder
    } = body

    // Validate required fields
    if (!analystId || !quote || !context) {
      return NextResponse.json(
        { error: 'Analyst ID, quote, and context are required' },
        { status: 400 }
      )
    }

    // Verify the analyst exists
    const analyst = await prisma.analyst.findUnique({
      where: { id: analystId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        title: true,
        profileImageUrl: true
      }
    })

    if (!analyst) {
      return NextResponse.json(
        { error: 'Analyst not found' },
        { status: 404 }
      )
    }

    // For now, return a mock response since we don't have a testimonials table yet
    // In the future, this would update the testimonial in the database
    const updatedTestimonial = {
      id,
      quote,
      context,
      isPublished: isPublished || false,
      displayOrder: displayOrder || 1,
      createdAt: new Date().toISOString(),
      analyst: {
        id: analyst.id,
        firstName: analyst.firstName,
        lastName: analyst.lastName,
        company: analyst.company || 'Industry Research Firm',
        title: analyst.title || 'Industry Analyst',
        profileImageUrl: analyst.profileImageUrl || undefined
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedTestimonial
    })

  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update testimonial' },
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

    // For now, return a mock response since we don't have a testimonials table yet
    // In the future, this would delete the testimonial from the database
    // await prisma.testimonial.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Testimonial deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete testimonial' },
      { status: 500 }
    )
  }
} 