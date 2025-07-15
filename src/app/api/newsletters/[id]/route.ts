import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const newsletter = await prisma.newsletter.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        subscriptions: {
          include: {
            analyst: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    })
    if (!newsletter) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }
    const totalRecipients = newsletter.subscriptions.length
    const openedCount = newsletter.subscriptions.filter(sub => sub.opened).length
    const clickedCount = newsletter.subscriptions.filter(sub => sub.clicked).length
    return NextResponse.json({
      success: true,
      data: {
        ...newsletter,
        metrics: {
          totalRecipients,
          openRate: totalRecipients > 0 ? Math.round((openedCount / totalRecipients) * 100) : 0,
          clickRate: totalRecipients > 0 ? Math.round((clickedCount / totalRecipients) * 100) : 0,
          openedCount,
          clickedCount
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch newsletter' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()
    const {
      title,
      subject,
      content,
      templateId,
      status,
      scheduledAt,
      recipientAnalystIds = []
    } = body
    // Validate required fields
    if (!title || !subject || !content) {
      return NextResponse.json({ error: 'Title, subject, and content are required' }, { status: 400 })
    }
    // Update newsletter
    const updated = await prisma.newsletter.update({
      where: { id },
      data: {
        title,
        subject,
        content,
        htmlContent: templateId ? undefined : body.htmlContent,
        status,
        scheduledAt: status === 'SCHEDULED' && scheduledAt ? new Date(scheduledAt) : null,
        // templateId is not stored directly, but htmlContent is updated if template changes
      }
    })
    // Update recipients (subscriptions)
    if (Array.isArray(recipientAnalystIds)) {
      // Remove all and re-add
      await prisma.newsletterSubscription.deleteMany({ where: { newsletterId: id } })
      await prisma.newsletterSubscription.createMany({
        data: recipientAnalystIds.map((analystId) => ({ analystId, newsletterId: id }))
      })
    }
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update newsletter' }, { status: 500 })
  }
} 