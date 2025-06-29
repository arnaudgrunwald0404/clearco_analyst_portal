const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addFutureBriefing() {
  try {
    // Get an existing analyst to associate with the briefing
    const analysts = await prisma.analyst.findMany({
      take: 2
    })
    
    if (analysts.length === 0) {
      console.log('No analysts found. Please run the main seeder first.')
      return
    }

    console.log('Adding future briefing for August 2025...')

    const futureBriefing = {
      title: 'AI-Driven Workforce Analytics Deep Dive',
      description: 'Strategic session on next-generation AI capabilities in workforce analytics, focusing on predictive talent management and ethical AI implementation',
      scheduledAt: new Date('2025-08-15T18:00:00Z'), // 2:00 PM EST on August 15, 2025
      status: 'SCHEDULED',
      agenda: [
        'Next-gen AI capabilities roadmap',
        'Predictive talent management features demo',
        'Ethical AI framework discussion',
        'Market positioning for 2026',
        'Competitive analysis: emerging players',
        'Research collaboration opportunities'
      ],
      duration: 90,
      attendeeEmails: [
        analysts[0]?.email,
        'sarah.martinez@futuretech.com',
        'alex.chen@hrtech.com',
        'maria.rodriguez@hrtech.com'
      ].filter(Boolean),
      analystIds: analysts.length >= 2 ? [analysts[0]?.id, analysts[1]?.id] : [analysts[0]?.id]
    }

    const { analystIds, attendeeEmails, agenda, ...briefingFields } = futureBriefing
    
    const briefing = await prisma.briefing.create({
      data: {
        ...briefingFields,
        agenda: JSON.stringify(agenda),
        attendeeEmails: JSON.stringify(attendeeEmails),
        analysts: {
          create: analystIds.filter(Boolean).map((analystId, index) => ({
            analystId,
            role: index === 0 ? 'PRIMARY' : 'SECONDARY'
          }))
        }
      },
      include: {
        analysts: {
          include: {
            analyst: true
          }
        }
      }
    })

    console.log(`✓ Created future briefing: ${briefing.title}`)
    console.log(`  Scheduled for: ${briefing.scheduledAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })}`)
    
    // Also add some action items for this future briefing to test the dashboard
    const actionItems = [
      {
        briefingId: briefing.id,
        description: 'Prepare comprehensive AI ethics framework document',
        assignedTo: 'Product Team',
        assignedBy: 'Alex Chen',
        dueDate: new Date('2025-08-10T17:00:00Z'), // Due 5 days before the briefing
        priority: 'HIGH',
        category: 'DOCUMENT_PREPARATION',
        notes: 'Include real-world case studies and compliance guidelines'
      },
      {
        briefingId: briefing.id,
        description: 'Schedule pre-briefing demo environment setup',
        assignedTo: 'DevOps Team',
        assignedBy: 'Maria Rodriguez',
        dueDate: new Date('2025-08-12T12:00:00Z'), // Due 3 days before
        priority: 'MEDIUM',
        category: 'TECHNICAL_SETUP',
        notes: 'Ensure all new AI features are working in demo environment'
      },
      {
        briefingId: briefing.id,
        description: 'Research competitive landscape for next-gen AI features',
        assignedTo: 'Strategy Team',
        assignedBy: 'Sarah Martinez',
        dueDate: new Date('2025-08-08T17:00:00Z'), // Due 1 week before
        priority: 'MEDIUM',
        category: 'RESEARCH',
        notes: 'Focus on emerging players and their AI capabilities'
      }
    ]

    for (const actionItem of actionItems) {
      await prisma.actionItem.create({
        data: actionItem
      })
    }

    console.log(`✓ Created ${actionItems.length} action items for the future briefing`)
    console.log('✅ Future briefing and action items added successfully!')
    
  } catch (error) {
    console.error('Error adding future briefing:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  addFutureBriefing()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { addFutureBriefing }
