import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
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
          include: {
            analysts: {
              include: {
                analyst: {
                  select: {
                    firstName: true,
                    lastName: true,
                    company: true
                  }
                }
              }
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
          primaryAnalyst: actionItem.briefing?.analysts?.[0]?.analyst || null
        }
      }
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Action item not found' },
        { status: 404 }
      )
    }
    console.error('Error updating action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update action item' },
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
    await prisma.actionItem.delete({
      where: { id }
    })
    return NextResponse.json({
      success: true,
      message: 'Action item deleted successfully'
    })
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as any).code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Action item not found' },
        { status: 404 }
      )
    }
    console.error('Error deleting action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete action item' },
      { status: 500 }
    )
  }
}
