const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function enhanceAnalystData() {
  try {
    console.log('🚀 Enhancing analyst data with more realistic values...')
    
    // Update Sarah Chen with higher influence score
    await prisma.analyst.update({
      where: { email: 'sarah.chen@gartner.com' },
      data: {
        influenceScore: 85,
        relationshipHealth: 'EXCELLENT',
        lastContactDate: new Date('2024-06-20')
      }
    })
    console.log('✅ Updated Sarah Chen')
    
    // Update Michael Rodriguez 
    await prisma.analyst.update({
      where: { email: 'mrodriguez@forrester.com' },
      data: {
        influenceScore: 78,
        relationshipHealth: 'GOOD',
        lastContactDate: new Date('2024-06-18')
      }
    })
    console.log('✅ Updated Michael Rodriguez')
    
    // Update Jennifer Kim
    await prisma.analyst.update({
      where: { email: 'jennifer.kim@idc.com' },
      data: {
        influenceScore: 72,
        relationshipHealth: 'GOOD',
        lastContactDate: new Date('2024-06-15')
      }
    })
    console.log('✅ Updated Jennifer Kim')
    
    // Add some sample interactions
    const analysts = await prisma.analyst.findMany()
    
    for (const analyst of analysts) {
      // Add a few interactions for each analyst
      await prisma.interaction.create({
        data: {
          analystId: analyst.id,
          type: 'EMAIL',
          subject: 'Q2 Product Update Discussion',
          description: 'Discussed upcoming product features and roadmap',
          date: new Date('2024-06-20')
        }
      })
      
      await prisma.interaction.create({
        data: {
          analystId: analyst.id,
          type: 'CALL',
          subject: 'Quarterly Business Review',
          description: 'Reviewed Q2 performance and discussed market trends',
          date: new Date('2024-06-15')
        }
      })
    }
    
    console.log('✅ Added sample interactions')
    console.log('🎉 Analyst data enhancement complete!')
    
  } catch (error) {
    console.error('❌ Error enhancing analyst data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

enhanceAnalystData()
