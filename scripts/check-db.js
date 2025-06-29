const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkDB() {
  try {
    const analysts = await prisma.analyst.findMany()
    console.log(`Found ${analysts.length} analysts:`)
    analysts.forEach(analyst => {
      console.log(`- ${analyst.firstName} ${analyst.lastName} (${analyst.email})`)
    })
    
    const users = await prisma.user.findMany()
    console.log(`\nFound ${users.length} users:`)
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email})`)
    })
    
  } catch (error) {
    console.error('Error checking database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDB()
