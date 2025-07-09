import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.id }
    })

    if (!template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error fetching email template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, description, html } = await request.json()

    if (!name || !html) {
      return NextResponse.json(
        { error: 'Name and HTML content are required' },
        { status: 400 }
      )
    }

    const template = await prisma.emailTemplate.update({
      where: { id: params.id },
      data: {
        name,
        description,
        html,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    console.error('Error updating email template:', error)
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.emailTemplate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting email template:', error)
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    )
  }
} 