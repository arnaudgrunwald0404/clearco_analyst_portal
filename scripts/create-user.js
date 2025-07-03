const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

async function createUser() {
  try {
    // Check if user-1 already exists
    const existingUser = await prisma.user.findUnique({
      where: { id: 'user-1' }
    })

    if (existingUser) {
      console.log('✅ User user-1 already exists')
      return
    }

    // Hash a default password
    const hashedPassword = await bcrypt.hash('password123', 10)

    // Create the user
    const user = await prisma.user.create({
      data: {
        id: 'user-1',
        email: 'admin@clearcompany.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'ADMIN'
      }
    })

    console.log('✅ Created user:', user)
  } catch (error) {
    console.error('❌ Error creating user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
