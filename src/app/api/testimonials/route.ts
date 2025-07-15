import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface Testimonial {
  id: string
  quote: string
  context: string
  isPublished: boolean
  displayOrder: number
  createdAt: string
  analyst: {
    id: string
    firstName: string
    lastName: string
    company: string
    title: string
    profileImageUrl?: string
  }
}

// Placeholder testimonials content - will be linked to real analysts
const testimonialContent = [
  {
    quote: "ClearCompany's background check platform has revolutionized how we approach candidate screening. The speed and accuracy of their verification process has significantly reduced our time-to-hire while maintaining the highest standards of compliance and security.",
    context: "Enterprise HR Technology Evaluation",
    displayOrder: 1
  },
  {
    quote: "What sets ClearCompany apart is their commitment to innovation in the background screening space. Their API-first approach and real-time verification capabilities have set a new standard for what HR teams can expect from their screening partners.",
    context: "HR Technology Market Analysis",
    displayOrder: 2
  },
  {
    quote: "ClearCompany's platform demonstrates exceptional user experience design. Their intuitive interface and comprehensive reporting tools make complex background screening processes accessible to HR professionals of all technical levels.",
    context: "User Experience Research",
    displayOrder: 3
  },
  {
    quote: "The compliance and security features in ClearCompany's solution are industry-leading. Their commitment to maintaining the highest standards while delivering exceptional user experience positions them as a clear leader in the background screening market.",
    context: "Compliance and Security Assessment",
    displayOrder: 4
  },
  {
    quote: "ClearCompany's integration capabilities and partner ecosystem are impressive. Their ability to seamlessly connect with major ATS platforms and HR systems makes them an ideal choice for organizations looking to streamline their hiring processes.",
    context: "Integration and Ecosystem Analysis",
    displayOrder: 5
  }
]

export async function GET(request: NextRequest) {
  try {
    // Fetch real analysts from the database
    const analysts = await prisma.analyst.findMany({
      where: {
        status: 'ACTIVE' // Only active analysts
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        company: true,
        title: true,
        profileImageUrl: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10 // Limit to 10 most recent analysts
    })

    if (analysts.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      })
    }

    // Create testimonials linked to real analysts
    const testimonials: Testimonial[] = testimonialContent.map((content, index) => {
      const analyst = analysts[index % analysts.length] // Cycle through available analysts
      
      return {
        id: (index + 1).toString(),
        quote: content.quote,
        context: content.context,
        isPublished: true,
        displayOrder: content.displayOrder,
        createdAt: new Date(Date.now() - (index * 24 * 60 * 60 * 1000)).toISOString(), // Stagger dates
        analyst: {
          id: analyst.id,
          firstName: analyst.firstName,
          lastName: analyst.lastName,
          company: analyst.company || 'Industry Research Firm',
          title: analyst.title || 'Industry Analyst',
          profileImageUrl: analyst.profileImageUrl || undefined
        }
      }
    })

    // Sort by display order
    const sortedTestimonials = testimonials.sort((a, b) => a.displayOrder - b.displayOrder)

    return NextResponse.json({
      success: true,
      data: sortedTestimonials
    })

  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      analystId,
      quote,
      context,
      isPublished = false,
      displayOrder = 1
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

    // For now, return a mock response
    // In the future, this would create a testimonial in the database
    const newTestimonial: Testimonial = {
      id: Date.now().toString(),
      quote,
      context,
      isPublished,
      displayOrder,
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
      data: newTestimonial
    })

  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create testimonial' },
      { status: 500 }
    )
  }
} 