import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    const topics = await prisma.predefinedTopic.findMany({
      orderBy: {
        order: 'asc'
      }
    })

    return NextResponse.json(topics)
  } catch (error) {
    console.error('Error in topics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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

    // Check if topic name already exists
    const existingTopic = await prisma.predefinedTopic.findUnique({
      where: { name: name.trim() }
    })

    if (existingTopic) {
      return NextResponse.json(
        { error: 'A topic with this name already exists' },
        { status: 409 }
      )
    }

    // Create new topic
    const newTopic = await prisma.predefinedTopic.create({
      data: {
        name: name.trim(),
        category,
        description: description?.trim() || null,
        order: order || 0
      }
    })

    return NextResponse.json(newTopic, { status: 201 })
  } catch (error) {
    console.error('Error in topics POST API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
