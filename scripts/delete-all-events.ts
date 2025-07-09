#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteAllEvents() {
  try {
    console.log('🔄 Starting deletion of all events...')

    // First, get a count of existing events
    const eventCount = await prisma.event.count()
    console.log(`📊 Found ${eventCount} events in the database`)

    if (eventCount === 0) {
      console.log('✅ No events to delete')
      return
    }

    // Ask for confirmation (in a real scenario)
    console.log('⚠️  WARNING: This will delete ALL events from the database!')
    console.log('⚠️  This action cannot be undone!')

    // Delete all events
    console.log('🗑️  Deleting all events...')
    const deleteResult = await prisma.event.deleteMany({})

    console.log(`✅ Successfully deleted ${deleteResult.count} events`)
    console.log('🧹 Database cleanup completed')

    // Verify deletion
    const remainingEvents = await prisma.event.count()
    console.log(`📊 Remaining events in database: ${remainingEvents}`)

    if (remainingEvents === 0) {
      console.log('✅ All events have been successfully deleted')
    } else {
      console.log('⚠️  Some events may still remain in the database')
    }

  } catch (error) {
    console.error('❌ Error deleting events:', error)
  } finally {
    await prisma.$disconnect()
    console.log('🔚 Database connection closed')
  }
}

deleteAllEvents()
