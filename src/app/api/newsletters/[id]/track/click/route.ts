import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const { searchParams } = new URL(request.url)
    const subscriptionId = searchParams.get('sub')
    const url = searchParams.get('url')
    
    if (!subscriptionId || !url) {
      return NextResponse.json({ error: 'Missing subscription ID or URL' }, { status: 400 })
    }

    // Update the subscription to mark as clicked
    await prisma.newsletterSubscription.update({
      where: { id: subscriptionId },
      data: { 
        clicked: true
      }
    })

    // Redirect to the original URL
    return NextResponse.redirect(url)
  } catch (error) {
    console.error('Error tracking newsletter click:', error)
    // Still redirect even if tracking fails
    const url = new URL(request.url).searchParams.get('url')
    return NextResponse.redirect(url || '/')
  }
} 