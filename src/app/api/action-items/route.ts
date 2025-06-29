import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') // 'pending', 'completed', 'all'
    const priority = searchParams.get('priority')
    const assignedTo = searchParams.get('assignedTo')

    // Build where clause
    const where: any = {}
    
    if (status === 'pending') {
      where.isCompleted = false
    } else if (status === 'completed') {
      where.isCompleted = true
    }
    
    if (priority) {
      where.priority = priority
    }
    
    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    const actionItems = await prisma.actionItem.findMany({
      where,
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
      },
      orderBy: [
        { isCompleted: 'asc' },
        { priority: 'desc' },
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    })

    const processedItems = actionItems.map(item => ({
      ...item,
      briefing: {
        ...item.briefing,
        primaryAnalyst: item.briefing.analysts[0]?.analyst || null
      }
    }))

    return NextResponse.json({
      success: true,
      data: processedItems
    })

  } catch (error) {
    console.error('Error fetching action items:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch action items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      briefingId,
      description,
      assignedTo,
      assignedBy,
      dueDate,
      priority = 'MEDIUM',
      category,
      notes
    } = body

    if (!briefingId || !description) {
      return NextResponse.json(
        { success: false, error: 'Briefing ID and description are required' },
        { status: 400 }
      )
    }

    const actionItem = await prisma.actionItem.create({
      data: {
        briefingId,
        description,
        assignedTo,
        assignedBy,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority,
        category,
        notes
      },
      include: {
        briefing: {
          select: {
            id: true,
            title: true,
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
    console.error('Error creating action item:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create action item' },
      { status: 500 }
    )
  }
}
