import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, category, description, order } = body

    if (!name || !category) {
      return NextResponse.json(
        { error: 'Name and category are required' },
        { status: 400 }
      )
    }

    if (!['CORE', 'ADDITIONAL'].includes(category)) {
      return NextResponse.json(
        { error: 'Category must be CORE or ADDITIONAL' },
        { status: 400 }
      )
    }


    // Check if another topic with the same name exists (excluding current topic)
    const existingTopic = await prisma.predefinedTopic.findFirst({
      where: {
        name: name.trim(),
        NOT: {
          id: id
        }
      }
    })

    if (existingTopic) {
      return NextResponse.json(
        { error: 'A topic with this name already exists' },
        { status: 409 }
      )
    }

    // Update topic
    try {
      const updatedTopic = await prisma.predefinedTopic.update({
        where: { id },
        data: {
          name: name.trim(),
          category,
          description: description?.trim() || null,
          order: order || 0
        }
      })

      return NextResponse.json(updatedTopic)
    } catch (prismaError: any) {
      if (prismaError.code === 'P2025') {
        return NextResponse.json(
          { error: 'Topic not found' },
          { status: 404 }
        )
      }
      throw prismaError
    }
  } catch (error) {
    console.error('Error in topic PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if topic exists and get its name for response
    const topic = await prisma.predefinedTopic.findUnique({
      where: { id },
      select: { name: true }
    })

    if (!topic) {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }

    // Check if topic is currently being used by any analysts
    const usedByAnalysts = await prisma.analystCoveredTopic.findFirst({
      where: { topic: topic.name },
      select: { analystId: true }
    })

    if (usedByAnalysts) {
      return NextResponse.json(
        { error: 'Cannot delete topic that is currently assigned to analysts' },
        { status: 409 }
      )
    }

    // Delete topic
    await prisma.predefinedTopic.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Topic not found' },
        { status: 404 }
      )
    }
    
    console.error('Error in topic DELETE API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
