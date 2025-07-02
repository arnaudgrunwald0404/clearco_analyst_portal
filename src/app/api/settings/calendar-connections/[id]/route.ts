import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// PATCH - Update calendar connection (active status and/or title)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { isActive, title } = body
    const connectionId = params.id

    // For now, we'll use a hardcoded user ID
    // In production, this should come from the session/auth
    const userId = 'user-1'

    // Verify the connection belongs to the user
    const connection = await prisma.calendarConnection.findFirst({
      where: {
        id: connectionId,
        userId: userId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Calendar connection not found' },
        { status: 404 }
      )
    }

    // Build update data object
    const updateData: any = {
      updatedAt: new Date(),
    }

    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive
    }

    if (typeof title === 'string' && title.trim()) {
      updateData.title = title.trim()
    }

    // Update the connection
    const updatedConnection = await prisma.calendarConnection.update({
      where: {
        id: connectionId,
      },
      data: updateData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating calendar connection:', error)
    return NextResponse.json(
      { error: 'Failed to update calendar connection' },
      { status: 500 }
    )
  }
}

// DELETE - Remove calendar connection
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connectionId = params.id

    // For now, we'll use a hardcoded user ID
    // In production, this should come from the session/auth
    const userId = 'user-1'

    // Verify the connection belongs to the user
    const connection = await prisma.calendarConnection.findFirst({
      where: {
        id: connectionId,
        userId: userId,
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Calendar connection not found' },
        { status: 404 }
      )
    }

    // Delete the connection and all related meetings
    await prisma.calendarConnection.delete({
      where: {
        id: connectionId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting calendar connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete calendar connection' },
      { status: 500 }
    )
  }
}
