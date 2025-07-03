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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: analystId } = await params
    const body = await request.json()

    // Check if analyst exists
    const existingAnalyst = await prisma.analyst.findUnique({
      where: { id: analystId },
      select: { id: true }
    })

    if (!existingAnalyst) {
      return NextResponse.json({
        success: false,
        error: 'Analyst not found'
      }, { status: 404 })
    }

    // Extract the fields that can be updated
    const {
      status,
      influence,
      relationshipHealth,
      email,
      phone,
      linkedIn,
      twitter,
      website,
      coveredTopics,
      ...otherFields
    } = body

    // Prepare the update data
    const updateData: any = {
      updatedAt: new Date()
    }

    // Only include fields that are provided
    if (status !== undefined) updateData.status = status
    if (influence !== undefined) updateData.influence = influence
    if (relationshipHealth !== undefined) updateData.relationshipHealth = relationshipHealth
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (linkedIn !== undefined) updateData.linkedIn = linkedIn
    if (twitter !== undefined) updateData.twitter = twitter
    if (website !== undefined) updateData.website = website

    // Handle covered topics separately if provided
    let topicsTransaction = []
    if (coveredTopics !== undefined) {
      // Delete existing topics and create new ones
      topicsTransaction = [
        prisma.analystCoveredTopic.deleteMany({
          where: { analystId }
        }),
        ...coveredTopics.map((topic: string) => 
          prisma.analystCoveredTopic.create({
            data: {
              analystId,
              topic
            }
          })
        )
      ]
    }

    // Execute the update
    if (topicsTransaction.length > 0) {
      // Use transaction for topics update
      await prisma.$transaction([
        prisma.analyst.update({
          where: { id: analystId },
          data: updateData
        }),
        ...topicsTransaction
      ])
    } else {
      // Simple update without topics
      await prisma.analyst.update({
        where: { id: analystId },
        data: updateData
      })
    }

    // Fetch the updated analyst with related data
    const updatedAnalyst = await prisma.analyst.findUnique({
      where: { id: analystId },
      include: {
        coveredTopics: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Analyst updated successfully',
      analyst: updatedAnalyst
    })

  } catch (error) {
    console.error('Error updating analyst:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
