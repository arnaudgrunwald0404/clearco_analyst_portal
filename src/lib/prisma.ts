import { PrismaClient } from '@prisma/client'

console.log('DATABASE_URL_DIRECT:', process.env.DATABASE_URL_DIRECT);
console.log('DATABASE_URL:', process.env.DATABASE_URL);

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_DIRECT || process.env.DATABASE_URL,
    },
  },
})

export { prisma }
