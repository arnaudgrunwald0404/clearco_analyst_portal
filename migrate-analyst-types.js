const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function migrateAnalystTypes() {
  try {
    console.log('Starting analyst type migration...')
    
    // First, let's see what types exist in the database
    const analysts = await prisma.$queryRaw`SELECT DISTINCT type FROM Analyst`
    console.log('Current types in database:', analysts)
    
    // Update old enum values to new ones
    const updates = [
      { old: 'ANALYST', new: 'Analyst' },
      { old: 'PRESS', new: 'Press' },
      { old: 'PRACTITIONER_INFLUENCER', new: 'Practitioner' }
    ]
    
    for (const { old, new: newValue } of updates) {
      const result = await prisma.$executeRaw`
        UPDATE Analyst 
        SET type = ${newValue} 
        WHERE type = ${old}
      `
      console.log(`Updated ${result} records from ${old} to ${newValue}`)
    }
    
    console.log('Migration completed successfully!')
    
  } catch (error) {
    console.error('Migration error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateAnalystTypes()
