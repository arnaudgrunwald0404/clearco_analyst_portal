import { prisma } from '@/lib/prisma-stub'
import { schedulingAI, SchedulingContext, EmailResponse } from './ai-service'

export class SchedulingAgentManager {
  async initiateScheduling(analystId: string, subject: string, suggestedTimes: string[]) {
    try {
      // Get analyst details
      const analyst = await prisma.analyst.findUnique({
        where: { id: analystId }
      })

      if (!analyst) {
        throw new Error('Analyst not found')
      }

      // Create conversation
      const conversation = await prisma.schedulingConversation.create({
        data: {
          analystId,
          subject,
          suggestedTimes: JSON.stringify(suggestedTimes),
          status: 'INITIATED'
        }
      })

      // Generate initial email
      const context: SchedulingContext = {
        analyst: {
          firstName: analyst.firstName,
          lastName: analyst.lastName,
          company: analyst.company || '',
          email: analyst.email,
          influence: analyst.influence
        },
        conversationHistory: [],
        suggestedTimes,
        subject
      }

      const emailContent = await schedulingAI.generateInitialEmail(context)

      // Send email via n8n webhook
      await this.triggerEmailWebhook(conversation.id, context, emailContent, 'INITIAL')

      return conversation

    } catch (error) {
      console.error('Error initiating scheduling:', error)
      throw error
    }
  }

  async processIncomingEmail(conversationId: string, emailContent: string) {
    try {
      // Get conversation and history
      const conversation = await prisma.schedulingConversation.findUnique({
        where: { id: conversationId },
        include: {
          analyst: true,
          emails: {
            orderBy: { sentAt: 'asc' }
          }
        }
      })

      if (!conversation) {
        throw new Error('Conversation not found')
      }

      // Record incoming email
      await prisma.schedulingEmail.create({
        data: {
          conversationId,
          direction: 'INBOUND',
          subject: 'Response',
          content: emailContent,
          sentAt: new Date()
        }
      })

      // Analyze response
      const context: SchedulingContext = {
        analyst: {
          firstName: conversation.analyst.firstName,
          lastName: conversation.analyst.lastName,
          company: conversation.analyst.company || '',
          email: conversation.analyst.email,
          influence: conversation.analyst.influence
        },
        conversationHistory: conversation.emails.map(e => ({
          direction: e.direction,
          content: e.content,
          sentAt: e.sentAt
        })),
        suggestedTimes: conversation.suggestedTimes ? JSON.parse(conversation.suggestedTimes) : [],
        subject: conversation.subject
      }

      const analysis = await schedulingAI.analyzeResponse(emailContent, context)

      // Update conversation status
      if (analysis.agreedTime) {
        await prisma.schedulingConversation.update({
          where: { id: conversationId },
          data: {
            status: 'CONFIRMED',
            agreedTime: analysis.agreedTime
          }
        })

        // Generate confirmation email
        const confirmationContent = await schedulingAI.generateConfirmationEmail(
          analysis.agreedTime,
          context
        )

        await this.triggerEmailWebhook(conversationId, context, confirmationContent, 'CONFIRMATION')

        // Create calendar event
        await this.createCalendarEvent(conversationId, analysis.agreedTime, context)

      } else if (analysis.shouldSend) {
        // Send follow-up email
        await this.triggerEmailWebhook(conversationId, context, analysis.content, 'FOLLOW_UP')

        await prisma.schedulingConversation.update({
          where: { id: conversationId },
          data: { status: 'NEGOTIATING' }
        })

      } else if (analysis.needsFollowUp) {
        // Schedule follow-up
        const followUpContent = await schedulingAI.generateFollowUpEmail(context)
        
        // Schedule follow-up email (you'd use a cron job or queue for this)
        await this.scheduleFollowUp(conversationId, followUpContent, analysis.followUpDelay || 48)
      }

      return analysis

    } catch (error) {
      console.error('Error processing incoming email:', error)
      throw error
    }
  }

  async createCalendarEvent(conversationId: string, agreedTime: Date, context: SchedulingContext) {
    try {
      // This would integrate with Google Calendar API
      // For now, we'll just update the conversation
      
      const endTime = new Date(agreedTime.getTime() + 60 * 60 * 1000) // 1 hour later
      
      // Create briefing record
      await prisma.briefing.create({
        data: {
          title: context.subject,
          description: `Scheduled via AI agent with ${context.analyst.firstName} ${context.analyst.lastName}`,
          startTime: agreedTime,
          endTime,
          status: 'SCHEDULED',
          location: 'Zoom',
          briefingAnalysts: {
            create: {
              analystId: conversationId // This should be the actual analyst ID
            }
          }
        }
      })

      // Update conversation
      await prisma.schedulingConversation.update({
        where: { id: conversationId },
        data: {
          status: 'SCHEDULED',
          zoomLink: 'https://zoom.us/j/meeting-id' // This would be generated
        }
      })

    } catch (error) {
      console.error('Error creating calendar event:', error)
      throw error
    }
  }

  private async triggerEmailWebhook(
    conversationId: string,
    context: SchedulingContext,
    emailContent: string,
    type: 'INITIAL' | 'FOLLOW_UP' | 'CONFIRMATION'
  ) {
    try {
      const webhookUrl = process.env.N8N_SCHEDULING_WEBHOOK_URL
      if (!webhookUrl) {
        console.warn('N8N webhook URL not configured')
        return
      }

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'SEND_EMAIL',
          conversationId,
          analyst: context.analyst,
          emailContent,
          emailType: type,
          subject: context.subject
        })
      })

    } catch (error) {
      console.error('Error triggering email webhook:', error)
    }
  }

  private async scheduleFollowUp(conversationId: string, content: string, delayHours: number) {
    // This would integrate with a job queue like Bull or use a cron job
    // For now, we'll just log it
    console.log(`Scheduling follow-up for conversation ${conversationId} in ${delayHours} hours`)
  }

  async getAnalystsDueForScheduling() {
    try {
      const now = new Date()
      const analysts = await prisma.analyst.findMany({
        where: {
          status: 'ACTIVE',
          // Add logic to find analysts who need briefings based on their tier
        },
        include: {
          influenceTier: true,
          briefings: {
            where: {
              startTime: {
                gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
              }
            },
            orderBy: { startTime: 'desc' },
            take: 1
          }
        }
      })

      return analysts.filter(analyst => {
        // Add logic to determine if analyst needs scheduling
        // Based on their tier frequency and last briefing
        return true // Placeholder
      })

    } catch (error) {
      console.error('Error getting analysts due for scheduling:', error)
      throw error
    }
  }
}

export const schedulingManager = new SchedulingAgentManager()
