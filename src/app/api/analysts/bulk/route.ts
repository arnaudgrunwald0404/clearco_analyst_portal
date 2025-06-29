import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { analysts } = body

    if (!Array.isArray(analysts) || analysts.length === 0) {
      return NextResponse.json(
        { error: 'Analysts array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each analyst
    const validAnalysts = []
    const errors = []
    const existingEmails = new Set()

    // Check for existing emails in the database
    const existingAnalysts = await prisma.analyst.findMany({
      where: {
        email: {
          in: analysts.map(a => a.email).filter(Boolean)
        }
      },
      select: { email: true }
    })

    existingAnalysts.forEach(a => existingEmails.add(a.email))

    for (let i = 0; i < analysts.length; i++) {
      const analyst = analysts[i]
      
      // Validate required fields
      if (!analyst.firstName || !analyst.lastName || !analyst.email) {
        errors.push(`Row ${i + 1}: First name, last name, and email are required`)
        continue
      }

      // Check for duplicate email in current batch
      if (validAnalysts.some(va => va.email === analyst.email)) {
        errors.push(`Row ${i + 1}: Duplicate email in upload: ${analyst.email}`)
        continue
      }

      // Check for existing email in database
      if (existingEmails.has(analyst.email)) {
        errors.push(`Row ${i + 1}: Email already exists: ${analyst.email}`)
        continue
      }

      validAnalysts.push(analyst)
    }

    if (errors.length > 0 && validAnalysts.length === 0) {
      return NextResponse.json(
        { error: 'No valid analysts to import', details: errors },
        { status: 400 }
      )
    }

    // Create analysts using transaction
    const createdAnalysts = await prisma.$transaction(async (tx) => {
      const results = []
      
      for (const analystData of validAnalysts) {
        const analyst = await tx.analyst.create({
          data: {
            firstName: analystData.firstName,
            lastName: analystData.lastName,
            email: analystData.email,
            company: analystData.company || null,
            title: analystData.title || null,
            phone: analystData.phone || null,
            linkedIn: analystData.linkedIn || null,
            twitter: analystData.twitter || null,
            website: analystData.website || null,
            bio: analystData.bio || null,
            type: analystData.type || 'ANALYST',
            eligibleNewsletters: analystData.eligibleNewsletters ? 
              JSON.stringify(analystData.eligibleNewsletters) : null,
            influence: analystData.influence || 'MEDIUM',
            status: analystData.status || 'ACTIVE',
            coveredTopics: {
              create: analystData.coveredTopics?.map((topic: string) => ({
                topic
              })) || []
            }
          },
          include: {
            coveredTopics: true
          }
        })
        
        results.push(analyst)
      }
      
      return results
    })

    return NextResponse.json({
      success: true,
      data: {
        created: createdAnalysts,
        count: createdAnalysts.length,
        errors: errors.length > 0 ? errors : undefined
      }
    })

  } catch (error) {
    console.error('Error creating analysts in bulk:', error)
    return NextResponse.json(
      { error: 'Failed to create analysts' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { analystIds, action } = body

    if (!analystIds || !Array.isArray(analystIds)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid analyst IDs'
      }, { status: 400 })
    }

    if (action === 'archive') {
      // Soft delete by setting status to ARCHIVED
      const updatedAnalysts = await prisma.analyst.updateMany({
        where: {
          id: {
            in: analystIds
          },
          status: {
            not: 'ARCHIVED'
          }
        },
        data: {
          status: 'ARCHIVED',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: `${updatedAnalysts.count} analysts archived successfully`,
        archivedCount: updatedAnalysts.count
      })
    } else if (action === 'restore') {
      // Restore archived analysts
      const restoredAnalysts = await prisma.analyst.updateMany({
        where: {
          id: {
            in: analystIds
          },
          status: 'ARCHIVED'
        },
        data: {
          status: 'ACTIVE',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: `${restoredAnalysts.count} analysts restored successfully`,
        restoredCount: restoredAnalysts.count
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Invalid action. Use "archive" or "restore"'
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Error in bulk operation:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process bulk operation'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
