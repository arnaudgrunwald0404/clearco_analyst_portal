#!/usr/bin/env tsx

/**
 * Demo script to test the profile picture search functionality
 * 
 * This script demonstrates how the profile picture search API works
 * and shows the mock results that would be returned for analyst profiles.
 * 
 * Usage: npm run test:profile-pictures
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ProfilePictureResult {
  url: string
  source: string
  title?: string
  confidence: number
  width?: number
  height?: number
}

// Mock the profile picture search functionality
async function searchProfilePictures(analystName: string, company?: string, title?: string): Promise<ProfilePictureResult[]> {
  console.log(`🔍 Searching for profile pictures for: ${analystName}`)
  if (company) console.log(`   Company: ${company}`)
  if (title) console.log(`   Title: ${title}`)
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Generate mock results similar to the API
  const results: ProfilePictureResult[] = [
    {
      url: `https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=${encodeURIComponent(analystName.split(' ').map(n => n[0]).join(''))}`,
      source: 'Generated Avatar',
      title: `${analystName} - Professional Avatar`,
      confidence: 85,
      width: 200,
      height: 200
    },
    {
      url: `https://ui-avatars.com/api/?name=${encodeURIComponent(analystName)}&size=200&background=0ea5e9&color=fff&format=png`,
      source: 'UI Avatars',
      title: `${analystName} - Letter Avatar`,
      confidence: 90,
      width: 200,
      height: 200
    },
    {
      url: `https://robohash.org/${encodeURIComponent(analystName)}?size=200x200&set=set1`,
      source: 'RoboHash',
      title: `${analystName} - Robot Avatar`,
      confidence: 75,
      width: 200,
      height: 200
    }
  ]
  
  // Sort by confidence
  return results.sort((a, b) => b.confidence - a.confidence)
}

async function updateAnalystProfilePicture(analystId: string, profileImageUrl: string) {
  console.log(`💾 Updating analyst ${analystId} with profile picture: ${profileImageUrl}`)
  
  try {
    const updatedAnalyst = await prisma.analyst.update({
      where: { id: analystId },
      data: { profileImageUrl }
    })
    
    console.log(`✅ Successfully updated profile picture for ${updatedAnalyst.firstName} ${updatedAnalyst.lastName}`)
    return updatedAnalyst
  } catch (error) {
    console.error('❌ Error updating analyst profile picture:', error)
    throw error
  }
}

async function demonstrateProfilePictureSearch() {
  console.log('🚀 Starting Profile Picture Search Demo\n')
  
  try {
    // Get a sample analyst from the database
    const analyst = await prisma.analyst.findFirst({
      where: {
        status: 'ACTIVE'
      }
    })
    
    if (!analyst) {
      console.log('❌ No active analysts found in database')
      return
    }
    
    console.log(`📋 Selected analyst: ${analyst.firstName} ${analyst.lastName}`)
    console.log(`   Current profile image: ${analyst.profileImageUrl || 'None'}`)
    console.log(`   Company: ${analyst.company || 'Not specified'}`)
    console.log(`   Title: ${analyst.title || 'Not specified'}\n`)
    
    // Search for profile pictures
    const results = await searchProfilePictures(
      `${analyst.firstName} ${analyst.lastName}`,
      analyst.company || undefined,
      analyst.title || undefined
    )
    
    console.log(`\n🎯 Found ${results.length} profile picture options:\n`)
    
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.source} (${result.confidence}% confidence)`)
      console.log(`   URL: ${result.url}`)
      console.log(`   Title: ${result.title || 'No title'}`)
      console.log(`   Dimensions: ${result.width || 'Unknown'} x ${result.height || 'Unknown'}`)
      console.log('')
    })
    
    // Simulate selecting the first result (highest confidence)
    if (results.length > 0) {
      const selectedPicture = results[0]
      console.log(`🎯 Auto-selecting highest confidence option: ${selectedPicture.source}`)
      
      await updateAnalystProfilePicture(analyst.id, selectedPicture.url)
      
      console.log('\n✨ Demo completed successfully!')
      console.log('\n📝 To implement in production:')
      console.log('1. Replace mock search with real image search API (Google Custom Search, Bing, etc.)')
      console.log('2. Add image validation and safety checks')
      console.log('3. Implement image caching/storage system')
      console.log('4. Add user permissions and approval workflow')
      console.log('5. Consider GDPR compliance for automated profile pictures')
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the demo
demonstrateProfilePictureSearch().catch(console.error)
