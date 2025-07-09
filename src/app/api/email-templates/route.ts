import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const templates = await prisma.emailTemplate.findMany({
      orderBy: { updatedAt: 'desc' }
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching email templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, html } = await request.json()

    if (!name || !html) {
      return NextResponse.json(
        { error: 'Name and HTML content are required' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.create({
      data: {
        name,
        description,
        html,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error creating email template:', error)
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    )
  }
} 