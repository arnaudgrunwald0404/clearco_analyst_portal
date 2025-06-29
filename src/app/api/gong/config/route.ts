import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/crypto'

export async function GET() {
  try {
    const config = await prisma.gongConfig.findFirst()
    
    if (!config) {
      return NextResponse.json({
        success: true,
        data: {
          isConfigured: false,
          isActive: false,
          lastSyncAt: null
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        isConfigured: true,
        isActive: config.isActive,
        subdomain: config.subdomain,
        lastSyncAt: config.lastSyncAt
      }
    })

  } catch (error) {
    console.error('Error fetching Gong config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch Gong configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { apiKey, subdomain, isActive } = body

    if (!apiKey || !subdomain) {
      return NextResponse.json(
        { success: false, error: 'API key and subdomain are required' },
        { status: 400 }
      )
    }

    // Encrypt the API key before storing
    const encryptedApiKey = encrypt(apiKey)

    // Check if config already exists
    const existingConfig = await prisma.gongConfig.findFirst()

    if (existingConfig) {
      // Update existing config
      const updatedConfig = await prisma.gongConfig.update({
        where: { id: existingConfig.id },
        data: {
          apiKey: encryptedApiKey,
          subdomain,
          isActive: isActive ?? false
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          isConfigured: true,
          isActive: updatedConfig.isActive,
          subdomain: updatedConfig.subdomain
        }
      })
    } else {
      // Create new config
      const newConfig = await prisma.gongConfig.create({
        data: {
          apiKey: encryptedApiKey,
          subdomain,
          isActive: isActive ?? false
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          isConfigured: true,
          isActive: newConfig.isActive,
          subdomain: newConfig.subdomain
        }
      })
    }

  } catch (error) {
    console.error('Error saving Gong config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to save Gong configuration' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { isActive } = body

    const config = await prisma.gongConfig.findFirst()
    
    if (!config) {
      return NextResponse.json(
        { success: false, error: 'Gong configuration not found' },
        { status: 404 }
      )
    }

    const updatedConfig = await prisma.gongConfig.update({
      where: { id: config.id },
      data: { isActive }
    })

    return NextResponse.json({
      success: true,
      data: {
        isConfigured: true,
        isActive: updatedConfig.isActive,
        subdomain: updatedConfig.subdomain
      }
    })

  } catch (error) {
    console.error('Error updating Gong config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update Gong configuration' },
      { status: 500 }
    )
  }
}
