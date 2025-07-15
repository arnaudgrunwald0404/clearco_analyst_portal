import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    // Mark as SENT and set sentAt
    const updated = await prisma.newsletter.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    })
    // TODO: Trigger actual email sending logic here
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send newsletter' }, { status: 500 })
  }
} 