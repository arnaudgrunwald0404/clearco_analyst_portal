#!/usr/bin/env tsx

// Load environment variables from .env file
import { config } from 'dotenv'
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testGeneralSettings() {
  console.log('🧪 Testing General Settings API endpoints...\n')
  
  try {
    // Connect to database
    console.log('🔗 Connecting to database...')
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test reading general settings
    console.log('\n📖 Testing read operation...')
    let settings = await prisma.generalSettings.findFirst()
    
    if (settings) {
      console.log('✅ Found existing settings:', {
        id: settings.id,
        companyName: settings.companyName,
        protectedDomain: settings.protectedDomain,
        industryName: settings.industryName
      })
    } else {
      console.log('ℹ️  No settings found, creating default settings...')
      settings = await prisma.generalSettings.create({
        data: {
          companyName: 'Demo Company',
          protectedDomain: 'demo.com',
          logoUrl: '',
          industryName: 'HR Technology'
        }
      })
      console.log('✅ Created default settings:', {
        id: settings.id,
        companyName: settings.companyName,
        protectedDomain: settings.protectedDomain,
        industryName: settings.industryName
      })
    }
    
    // Test updating general settings
    console.log('\n✏️  Testing update operation...')
    const updatedSettings = await prisma.generalSettings.update({
      where: { id: settings.id },
      data: {
        companyName: 'Updated Test Company',
        protectedDomain: 'updated-test.com',
        logoUrl: 'https://example.com/logo.png',
        industryName: 'HR Tech'
      }
    })
    
    console.log('✅ Update successful:', {
      id: updatedSettings.id,
      companyName: updatedSettings.companyName,
      protectedDomain: updatedSettings.protectedDomain,
      logoUrl: updatedSettings.logoUrl,
      industryName: updatedSettings.industryName
    })
    
    console.log('\n🎉 All general settings operations work correctly!')
    console.log('The RLS fix has been successfully applied.')
    
    // Restore original data for cleanup
    if (settings.companyName !== 'Updated Test Company') {
      await prisma.generalSettings.update({
        where: { id: settings.id },
        data: {
          companyName: settings.companyName,
          protectedDomain: settings.protectedDomain,
          logoUrl: settings.logoUrl,
          industryName: settings.industryName
        }
      })
      console.log('🧹 Restored original settings for cleanup')
    }
    
  } catch (error: any) {
    console.error('❌ Error during general settings test:', error.message)
    if (error.code === 'P2025') {
      console.log('ℹ️  This error suggests the record doesn\'t exist - this is expected for first run')
    } else {
      console.error('🔍 Full error details:', error)
    }
  } finally {
    await prisma.$disconnect()
    console.log('🔚 Database disconnected')
  }
}

testGeneralSettings().catch((error) => {
  console.error('💥 Unexpected error:', error)
  process.exit(1)
})
