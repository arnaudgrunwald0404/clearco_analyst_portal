import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analystId } = await params

    // Check if analyst exists and is not already archived
    const existingAnalyst = await prisma.analyst.findUnique({
      where: { id: analystId },
      select: { id: true, firstName: true, lastName: true, status: true }
    })

    if (!existingAnalyst) {
      return NextResponse.json({
        success: false,
        error: 'Analyst not found'
      }, { status: 404 })
    }

    if (existingAnalyst.status === 'ARCHIVED') {
      return NextResponse.json({
        success: false,
        error: 'Analyst is already archived'
      }, { status: 400 })
    }

    // Soft delete by updating status to ARCHIVED
    const updatedAnalyst = await prisma.analyst.update({
      where: { id: analystId },
      data: {
        status: 'ARCHIVED',
        updatedAt: new Date()
      },
      select: { id: true, firstName: true, lastName: true, status: true }
    })

    // Log the deletion activity
    console.log(`Analyst ${analystId} (${existingAnalyst.firstName} ${existingAnalyst.lastName}) archived at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: 'Analyst archived successfully',
      analyst: {
        id: updatedAnalyst.id,
        name: `${updatedAnalyst.firstName} ${updatedAnalyst.lastName}`,
        status: updatedAnalyst.status
      }
    })

  } catch (error) {
    console.error('Error archiving analyst:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analystId } = await params

    const analyst = await prisma.analyst.findUnique({
      where: { id: analystId },
      include: {
        coveredTopics: true,
        interactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        briefings: {
          orderBy: { scheduledAt: 'desc' },
          take: 5
        },
        socialPosts: {
          orderBy: { postedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!analyst) {
      return NextResponse.json({
        success: false,
        error: 'Analyst not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      analyst
    })

  } catch (error) {
    console.error('Error fetching analyst:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
