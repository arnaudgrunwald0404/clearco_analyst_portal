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
    
    // Validate domain format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.([a-zA-Z]{2,}|[a-zA-Z]{2,3}\.[a-zA-Z]{2,3})$/
    if (!domainRegex.test(protectedDomain)) {
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
    
    let settings
    if (existingSettings) {
      // Update existing settings
      settings = await prisma.generalSettings.update({
        where: { id: existingSettings.id },
        data: {
          companyName: companyName.trim(),
          protectedDomain: protectedDomain.trim().toLowerCase(),
          logoUrl: logoUrl?.trim() || '',
          industryName: industryName.trim()
        }
      })
    } else {
      // Create new settings
      settings = await prisma.generalSettings.create({
        data: {
          companyName: companyName.trim(),
          protectedDomain: protectedDomain.trim().toLowerCase(),
          logoUrl: logoUrl?.trim() || '',
          industryName: industryName.trim()
        }
      })
    }
    
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating general settings:', error)
    return NextResponse.json(
      { error: 'Failed to update general settings' },
      { status: 500 }
    )
  }
}
