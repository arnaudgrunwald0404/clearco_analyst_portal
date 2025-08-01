#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function findAnalystsDueForScheduling() {
  try {
    console.log('🔍 [Scheduling Agent] Finding analysts due for briefings...')
    
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    
    // Get all active analysts with their influence tiers
    const analysts = await prisma.analyst.findMany({
      where: {
        status: 'ACTIVE',
        influenceTierId: { not: null }
      },
      include: {
        influenceTier: true,
        briefings: {
          where: {
            startTime: { gte: thirtyDaysAgo }
          },
          orderBy: { startTime: 'desc' },
          take: 1
        },
        schedulingConversations: {
          where: {
            status: {
              in: ['INITIATED', 'WAITING_RESPONSE', 'NEGOTIATING']
            }
          }
        }
      }
    })

    const analystsDueForScheduling = []

    for (const analyst of analysts) {
      const tier = analyst.influenceTier
      if (!tier) continue

      const daysBetweenBriefings = tier.briefingFrequency
      const lastBriefing = analyst.briefings[0]
      const hasActiveConversation = analyst.schedulingConversations.length > 0

      // Skip if they have an active scheduling conversation
      if (hasActiveConversation) {
        console.log(`⏭️  Skipping ${analyst.firstName} ${analyst.lastName} - active conversation`)
        continue
      }

      let needsScheduling = false
      let reason = ''

      if (!lastBriefing) {
        // No recent briefings, check if they're overdue
        needsScheduling = true
        reason = 'No recent briefings'
      } else {
        const daysSinceLastBriefing = Math.floor(
          (now.getTime() - lastBriefing.startTime.getTime()) / (1000 * 60 * 60 * 24)
        )
        
        if (daysSinceLastBriefing >= daysBetweenBriefings) {
          needsScheduling = true
          reason = `${daysSinceLastBriefing} days since last briefing (tier requires ${daysBetweenBriefings} days)`
        }
      }

      if (needsScheduling) {
        analystsDueForScheduling.push({
          analyst,
          reason,
          daysSinceLastBriefing: lastBriefing 
            ? Math.floor((now.getTime() - lastBriefing.startTime.getTime()) / (1000 * 60 * 60 * 24))
            : null
        })
      }
    }

    console.log(`📊 [Scheduling Agent] Found ${analystsDueForScheduling.length} analysts due for scheduling`)

    // Generate suggested times for next week
    const suggestedTimes = generateSuggestedTimes()

    // Create scheduling conversations for each analyst
    for (const { analyst, reason } of analystsDueForScheduling) {
      try {
        console.log(`📧 [Scheduling Agent] Creating conversation for ${analyst.firstName} ${analyst.lastName}`)
        
        const conversation = await prisma.schedulingConversation.create({
          data: {
            analystId: analyst.id,
            subject: `ClearCompany Briefing - ${analyst.firstName} ${analyst.lastName}`,
            suggestedTimes: JSON.stringify(suggestedTimes),
            status: 'INITIATED'
          }
        })

        // Trigger n8n webhook to send initial email
        if (process.env.N8N_SCHEDULING_WEBHOOK_URL) {
          await fetch(process.env.N8N_SCHEDULING_WEBHOOK_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'INITIATE_SCHEDULING',
              conversationId: conversation.id,
              analyst: {
                firstName: analyst.firstName,
                lastName: analyst.lastName,
                email: analyst.email,
                company: analyst.company,
                influence: analyst.influence
              },
              subject: conversation.subject,
              suggestedTimes,
              reason
            })
          })
        }

        console.log(`✅ [Scheduling Agent] Created conversation for ${analyst.firstName} ${analyst.lastName}`)

      } catch (error) {
        console.error(`❌ [Scheduling Agent] Error creating conversation for ${analyst.firstName} ${analyst.lastName}:`, error)
      }
    }

    console.log('✅ [Scheduling Agent] Completed scheduling analysis')

  } catch (error) {
    console.error('❌ [Scheduling Agent] Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

function generateSuggestedTimes() {
  const times = []
  const now = new Date()
  
  // Generate times for next week (Monday-Friday)
  for (let i = 1; i <= 5; i++) {
    const date = new Date(now)
    date.setDate(date.getDate() + i)
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue
    
    // Add morning and afternoon slots
    const morningTime = new Date(date)
    morningTime.setHours(10, 0, 0, 0) // 10:00 AM
    
    const afternoonTime = new Date(date)
    afternoonTime.setHours(14, 0, 0, 0) // 2:00 PM
    
    times.push(
      morningTime.toLocaleString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York'
      }) + ' ET',
      afternoonTime.toLocaleString('en-US', { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/New_York'
      }) + ' ET'
    )
  }
  
  return times.slice(0, 6) // Return up to 6 time slots
}

// Run the script
findAnalystsDueForScheduling()
