#!/usr/bin/env tsx

/**
 * Demo script to test the profile picture search functionality
 * 
 * This script demonstrates how the profile picture search API works
 * and shows the real results that would be returned for analyst profiles.
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

// Test the actual API endpoint
async function testProfilePictureSearchAPI(analystName: string, company?: string, title?: string): Promise<ProfilePictureResult[]> {
  console.log(`🔍 Testing API search for: ${analystName}`)
  if (company) console.log(`   Company: ${company}`)
  if (title) console.log(`   Title: ${title}`)
  
  try {
    const response = await fetch('http://localhost:3001/api/analysts/search-profile-pictures', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analystName,
        company,
        title
      })
    })
    
    if (response.ok) {
      const result = await response.json()
      if (result.success && result.results) {
        return result.results
      } else {
        console.error('API returned error:', result.error)
        return []
      }
    } else {
      console.error('API request failed:', response.status, response.statusText)
      return []
    }
  } catch (error) {
    console.error('Error calling API:', error)
    return []
  }
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
  console.log('🚀 Starting Real Profile Picture Search Demo\n')
  
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
    
    // Test the actual API search
    const results = await testProfilePictureSearchAPI(
      `${analyst.firstName} ${analyst.lastName}`,
      analyst.company || undefined,
      analyst.title || undefined
    )
    
    if (results.length === 0) {
      console.log('❌ No results returned from API')
      return
    }
    
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
      console.log('\n📝 API Features:')
      console.log('✅ Real web search for actual photos')
      console.log('✅ LinkedIn profile simulation')
      console.log('✅ Unsplash professional photos')
      console.log('✅ Pexels stock photos')
      console.log('✅ Professional avatar fallbacks')
      console.log('\n🔧 To enable full functionality, add these environment variables:')
      console.log('- SERPAPI_KEY: For web image search')
      console.log('- UNSPLASH_ACCESS_KEY: For Unsplash photos')
      console.log('- PEXELS_API_KEY: For Pexels photos')
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the demo
demonstrateProfilePictureSearch()
