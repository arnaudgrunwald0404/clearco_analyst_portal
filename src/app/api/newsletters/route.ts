import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const newsletters = await prisma.newsletter.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subscriptions: {
          include: {
            analyst: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Calculate metrics for each newsletter
    const newslettersWithMetrics = newsletters.map(newsletter => {
      const totalRecipients = newsletter.subscriptions.length
      const openedCount = newsletter.subscriptions.filter(sub => sub.opened).length
      const clickedCount = newsletter.subscriptions.filter(sub => sub.clicked).length
      
      return {
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

    return NextResponse.json({
      success: true,
      data: newslettersWithMetrics
    })
  } catch (error) {
    console.error('Error fetching newsletters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title,
      subject,
      content,
      htmlContent,
      status = 'DRAFT',
      scheduledAt,
      templateId,
      recipientAnalystIds = []
    } = body

    // Validate required fields
    if (!title || !subject || !content) {
      return NextResponse.json(
        { error: 'Title, subject, and content are required' },
        { status: 400 }
      )
    }

    // If templateId is provided, fetch the template and use its HTML
    let finalHtmlContent = htmlContent
    if (templateId) {
      const template = await prisma.emailTemplate.findUnique({
        where: { id: templateId }
      })
      
      if (!template) {
        return NextResponse.json(
          { error: 'Email template not found' },
          { status: 404 }
        )
      }
      
      // Replace template variables with actual content
      finalHtmlContent = template.html
        .replace('{{title}}', title)
        .replace('{{subject}}', subject)
        .replace('{{content}}', content)
    }

    // Create the newsletter first to get the ID
    const newsletter = await prisma.newsletter.create({
      data: {
        title,
        subject,
        content,
        htmlContent: finalHtmlContent,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        createdBy: 'system', // TODO: Get from auth context
      }
    })

    // Add tracking to HTML content if newsletter is being sent
    let trackedHtmlContent = finalHtmlContent
    if (status === 'SENT' && recipientAnalystIds.length > 0) {
             // Create subscriptions first
       const subscriptions = await prisma.newsletterSubscription.createMany({
         data: recipientAnalystIds.map((analystId: string) => ({
           analystId,
           newsletterId: newsletter.id
         }))
       })

      // Fetch the created subscriptions to get their IDs
      const createdSubscriptions = await prisma.newsletterSubscription.findMany({
        where: { 
          newsletterId: newsletter.id,
          analystId: { in: recipientAnalystIds }
        }
      })

      // Add tracking pixel and wrap links for each subscription
      const trackingPromises = createdSubscriptions.map(async (subscription) => {
        const trackingPixel = `<img src="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletters/${newsletter.id}/track/open?sub=${subscription.id}" width="1" height="1" style="display:none;" />`
        
                 // Wrap links with click tracking
         const linkRegex = /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/gi
         let trackedHtml = finalHtmlContent.replace(linkRegex, (match: string, url: string, rest: string) => {
           const encodedUrl = encodeURIComponent(url)
           const trackingUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/newsletters/${newsletter.id}/track/click?sub=${subscription.id}&url=${encodedUrl}`
           return `<a href="${trackingUrl}"${rest}>`
         })
        
        // Add tracking pixel at the end
        trackedHtml += trackingPixel
        
        return trackedHtml
      })

      // For now, just use the first subscription's tracked HTML
      // In a real implementation, you'd send individual emails to each recipient
      const trackedHtmls = await Promise.all(trackingPromises)
      trackedHtmlContent = trackedHtmls[0] || finalHtmlContent
    }

    // Update the newsletter with tracked HTML content
    const updatedNewsletter = await prisma.newsletter.update({
      where: { id: newsletter.id },
      data: { htmlContent: trackedHtmlContent },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        subscriptions: {
          include: {
            analyst: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedNewsletter
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: 500 }
    )
  }
} 