import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get the first (and only) analyst portal settings record
    let settings = await prisma.analystPortalSettings.findFirst()
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.analystPortalSettings.create({
        data: {
          welcomeQuote: '',
          quoteAuthor: '',
          authorImageUrl: ''
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching analyst portal settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analyst portal settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { welcomeQuote, quoteAuthor, authorImageUrl } = body
    
    // Validate required fields
    if (!welcomeQuote || !quoteAuthor) {
      return NextResponse.json(
        { error: 'Welcome quote and author are required' },
        { status: 400 }
      )
    }
    
    // Validate URL format if provided
    if (authorImageUrl && authorImageUrl.trim()) {
      try {
        new URL(authorImageUrl)
      } catch {
        return NextResponse.json(
          { error: 'Please enter a valid author image URL' },
          { status: 400 }
        )
      }
    }
    
    // Check if settings already exist
    const existingSettings = await prisma.analystPortalSettings.findFirst()
    
    const updateData = {
      welcomeQuote: welcomeQuote.trim(),
      quoteAuthor: quoteAuthor.trim(),
      authorImageUrl: authorImageUrl?.trim() || ''
    }
    
    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.analystPortalSettings.update({
        where: { id: existingSettings.id },
        data: updateData
      })
    } else {
      // Create new settings
      settings = await prisma.analystPortalSettings.create({
        data: updateData
      })
    }
    
    console.log('✅ Analyst portal settings updated successfully:', settings)
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('❌ Detailed error updating analyst portal settings:')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update analyst portal settings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
