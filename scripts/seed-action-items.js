const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedActionItems() {
  try {
    // Get existing briefings to link action items to
    const briefings = await prisma.briefing.findMany({
      select: { id: true, title: true, status: true },
      where: { status: 'COMPLETED' },
      take: 5
    })
    
    if (briefings.length === 0) {
      console.log('No completed briefings found. Please run the briefings seeder first.')
      return
    }

    console.log('Seeding action items...')

    const actionItems = [
      {
        briefingId: briefings[0].id,
        description: 'Send detailed technical specs for API integration to Sarah Chen',
        assignedTo: 'Mark Thompson',
        assignedBy: 'AJ Rodriguez',
        dueDate: new Date('2024-12-20'),
        priority: 'HIGH',
        category: 'SEND_DOCUMENT',
        notes: 'Include authentication methods and rate limiting details'
      },
      {
        briefingId: briefings[0].id,
        description: 'Follow up with ROI case studies from existing customers',
        assignedTo: 'AJ Rodriguez',
        assignedBy: 'Sarah Chen',
        dueDate: new Date('2024-12-18'),
        priority: 'MEDIUM',
        category: 'FOLLOW_UP'
      },
      {
        briefingId: briefings[0].id,
        description: 'Schedule follow-up demo for Sarah\'s extended team',
        assignedTo: 'Jennifer Park',
        assignedBy: 'Sarah Chen',
        dueDate: new Date('2024-12-25'),
        priority: 'MEDIUM',
        category: 'SCHEDULE_MEETING'
      },
      {
        briefingId: briefings[1]?.id || briefings[0].id,
        description: 'Share Q3 market data analysis with research team',
        assignedTo: 'Lisa Wang',
        assignedBy: 'Michael Rodriguez',
        dueDate: new Date('2024-12-16'),
        priority: 'HIGH',
        category: 'SEND_DOCUMENT',
        notes: 'Include competitive analysis and market sizing data'
      },
      {
        briefingId: briefings[1]?.id || briefings[0].id,
        description: 'Review draft research methodology document',
        assignedTo: 'Sarah Chen',
        assignedBy: 'AJ Rodriguez',
        dueDate: new Date('2024-12-22'),
        priority: 'MEDIUM',
        category: 'FOLLOW_UP'
      },
      {
        briefingId: briefings[2]?.id || briefings[0].id,
        description: 'Develop comprehensive AI ethics framework document',
        assignedTo: 'David Kim',
        assignedBy: 'AJ Rodriguez',
        dueDate: new Date('2024-12-30'),
        priority: 'HIGH',
        category: 'SEND_DOCUMENT',
        notes: 'Focus on bias prevention and transparency requirements'
      },
      {
        briefingId: briefings[2]?.id || briefings[0].id,
        description: 'Create detailed technology adoption timeline for 2025',
        assignedTo: 'AJ Rodriguez',
        assignedBy: 'Michael Foster',
        dueDate: new Date('2024-12-19'),
        priority: 'MEDIUM',
        category: 'FOLLOW_UP'
      },
      {
        briefingId: briefings[0].id,
        description: 'Send updated product roadmap with Q1 2025 milestones',
        assignedTo: 'Jennifer Park',
        assignedBy: 'Sarah Chen',
        dueDate: new Date('2024-12-14'), // Overdue to test the UI
        priority: 'HIGH',
        category: 'SEND_DOCUMENT'
      },
      {
        briefingId: briefings[1]?.id || briefings[0].id,
        description: 'Coordinate joint webinar on HR analytics trends',
        assignedTo: 'Marketing Team',
        assignedBy: 'Sarah Chen',
        dueDate: new Date('2025-01-15'),
        priority: 'LOW',
        category: 'SCHEDULE_MEETING',
        notes: 'Target for Q1 2025 launch'
      },
      {
        briefingId: briefings[0].id,
        description: 'Prepare competitive analysis report for next briefing',
        assignedTo: 'Research Team',
        assignedBy: 'AJ Rodriguez',
        dueDate: new Date('2024-12-17'),
        priority: 'MEDIUM',
        category: 'FOLLOW_UP'
      }
    ]

    for (const itemData of actionItems) {
      const actionItem = await prisma.actionItem.create({
        data: itemData
      })
      console.log(`✓ Created action item: ${actionItem.description}`)
    }

    console.log('✅ Action items seeded successfully!')
    
    // Show summary
    const [totalItems, pendingItems, overdueItems] = await Promise.all([
      prisma.actionItem.count(),
      prisma.actionItem.count({ where: { isCompleted: false } }),
      prisma.actionItem.count({ 
        where: { 
          isCompleted: false,
          dueDate: { lt: new Date() }
        } 
      })
    ])

    console.log(`\n📊 Summary:`)
    console.log(`- ${totalItems} total action items`)
    console.log(`- ${pendingItems} pending items`)
    console.log(`- ${overdueItems} overdue items`)
    
  } catch (error) {
    console.error('Error seeding action items:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedActionItems()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { seedActionItems }
