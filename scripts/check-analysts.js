const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkAnalysts() {
  try {
    console.log('📊 Checking analysts in database...')
    
    const analysts = await prisma.analyst.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        status: true,
        influenceScore: true,
        relationshipHealth: true
      },
      take: 10
    })
    
    console.log(`Found ${analysts.length} analysts:`)
    
    analysts.forEach((analyst, index) => {
      console.log(`${index + 1}. ${analyst.firstName} ${analyst.lastName}`)
      console.log(`   Email: ${analyst.email}`)
      console.log(`   Company: ${analyst.company || 'N/A'}`)
      console.log(`   Status: ${analyst.status}`)
      console.log(`   Influence: ${analyst.influenceScore}/100`)
      console.log(`   Health: ${analyst.relationshipHealth}`)
      console.log('')
    })
    
    const activeCount = analysts.filter(a => a.status === 'ACTIVE').length
    console.log(`📈 Active analysts: ${activeCount}/${analysts.length}`)
    
  } catch (error) {
    console.error('❌ Error checking analysts:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkAnalysts()
