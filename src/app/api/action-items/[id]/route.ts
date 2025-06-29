import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      description,
      assignedTo,
      dueDate,
      priority,
      category,
      notes,
      isCompleted,
      completedBy
    } = body

    const updateData: any = {}
    
    if (description !== undefined) updateData.description = description
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null
    if (priority !== undefined) updateData.priority = priority
    if (category !== undefined) updateData.category = category
    if (notes !== undefined) updateData.notes = notes
    
    // Handle completion status
    if (isCompleted !== undefined) {
      updateData.isCompleted = isCompleted
      if (isCompleted) {
        updateData.completedAt = new Date()
        updateData.completedBy = completedBy || 'System'
      } else {
        updateData.completedAt = null
        updateData.completedBy = null
      }
    }

    const actionItem = await prisma.actionItem.update({
      where: { id },
      data: updateData,
      include: {
        briefing: {
          select: {
            id: true,
            title: true,
            scheduledAt: true,
            analysts: {
              include: {
                analyst: {
                  select: {
                    firstName: true,
                    lastName: true,
                    company: true
                  }
                }
              },
              take: 1
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...actionItem,
        briefing: {
          ...actionItem.briefing,
          primaryAnalyst: actionItem.briefing.analysts[0]?.analyst || null
        }
      }
    })

  } catch (error) {
    console.error('Error updating action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update action item' },
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

    await prisma.actionItem.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Action item deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete action item' },
      { status: 500 }
    )
  }
}
