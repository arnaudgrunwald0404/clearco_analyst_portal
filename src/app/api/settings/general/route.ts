import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET() {
  try {
    // Get the first (and only) general settings record
    let settings = await prisma.generalSettings.findFirst()
    
    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.generalSettings.create({
        data: {
          companyName: '',
          protectedDomain: '',
          logoUrl: '',
          industryName: 'HR Technology'
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching general settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch general settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { companyName, protectedDomain, logoUrl, industryName } = body
    
    // Validate required fields
    if (!companyName || !protectedDomain || !industryName) {
      return NextResponse.json(
        { error: 'Company name, protected domain, and industry name are required' },
        { status: 400 }
      )
    }
    
    // Validate domain format - very basic check
    if (!protectedDomain.includes('.') || protectedDomain.length < 3) {
      return NextResponse.json(
        { error: 'Please enter a valid domain (e.g., company.com)' },
        { status: 400 }
      )
    }
    
    // Validate URL format if provided
    if (logoUrl && logoUrl.trim()) {
      try {
        new URL(logoUrl)
      } catch {
        return NextResponse.json(
          { error: 'Please enter a valid logo URL' },
          { status: 400 }
        )
      }
    }
    
    // Check if settings already exist
    const existingSettings = await prisma.generalSettings.findFirst()
    
    const updateData = {
      companyName: companyName.trim(),
      protectedDomain: protectedDomain.trim().toLowerCase(),
      logoUrl: logoUrl?.trim() || '',
      industryName: industryName.trim()
    }
    
    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.generalSettings.update({
        where: { id: existingSettings.id },
        data: updateData
      })
    } else {
      // Create new settings
      settings = await prisma.generalSettings.create({
        data: updateData
      })
    }
    
    console.log('✅ General settings updated successfully:', settings)
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('❌ Detailed error updating general settings:')
    console.error('Error type:', typeof error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Full error object:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to update general settings',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
