import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()

    // Validate each analyst
    const validAnalysts: Array<{
      firstName: string
      lastName: string
      email: string
      company?: string
      title?: string
      phone?: string
      linkedIn?: string
      twitter?: string
      website?: string
      bio?: string
      type?: 'Analyst' | 'Press' | 'Investor' | 'Practitioner' | 'Influencer'
      eligibleNewsletters?: string[]
      influence?: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'
      status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED'
      coveredTopics?: string[]
    }> = []
    const errors = []
    const existingEmails = new Set()

    // Check for existing emails in the database
    const { data: existingAnalysts, error: existingError } = await supabase
      .from('analysts')
      .select('email')
      .in('email', analysts.map(a => a.email).filter(Boolean))

    if (existingError) {
      console.error('Error checking existing analysts:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing analysts' },
        { status: 500 }
      )
    }

    existingAnalysts?.forEach(a => existingEmails.add(a.email))

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

    // Create analysts
    const createdAnalysts = []
    
    for (const analystData of validAnalysts) {
      const { data: analyst, error: createError } = await supabase
        .from('analysts')
        .insert({
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
          type: analystData.type || 'Analyst',
          eligibleNewsletters: analystData.eligibleNewsletters ? 
            JSON.stringify(analystData.eligibleNewsletters) : null,
          influence: analystData.influence || 'MEDIUM',
          status: analystData.status || 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
        .select()
        .single()
      
      if (createError) {
        console.error('Error creating analyst:', createError)
        errors.push(`Failed to create analyst ${analystData.email}: ${createError.message}`)
        continue
      }
      
      createdAnalysts.push(analyst)
      
      // Create covered topics if provided
      if (analystData.coveredTopics && analystData.coveredTopics.length > 0) {
        const topicInserts = analystData.coveredTopics.map((topic: string) => ({
          analystId: analyst.id,
          topic: topic
        }))
        
        const { error: topicError } = await supabase
          .from('analyst_topics')
          .insert(topicInserts)
        
        if (topicError) {
          console.error('Error creating topics:', topicError)
        }
      }
    }

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

    const supabase = await createClient()

    if (action === 'archive') {
      // Soft delete by setting status to ARCHIVED
      const { count, error } = await supabase
        .from('analysts')
        .update({
          status: 'ARCHIVED',
          updatedAt: new Date().toISOString()
        })
        .in('id', analystIds)
        .neq('status', 'ARCHIVED')

      if (error) {
        console.error('Error archiving analysts:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to archive analysts'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${count} analysts archived successfully`,
        archivedCount: count
      })
    } else if (action === 'restore') {
      // Restore archived analysts
      const { count, error } = await supabase
        .from('analysts')
        .update({
          status: 'ACTIVE',
          updatedAt: new Date().toISOString()
        })
        .in('id', analystIds)
        .eq('status', 'ARCHIVED')

      if (error) {
        console.error('Error restoring analysts:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to restore analysts'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: `${count} analysts restored successfully`,
        restoredCount: count
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
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { analystIds, action, influence } = await request.json()

    if (!analystIds || !Array.isArray(analystIds) || analystIds.length === 0) {
      return NextResponse.json(
        { error: 'No analyst IDs provided' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'No action specified' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    switch (action) {
      case 'archive':
        // Archive the analysts
        const { error: archiveError } = await supabase
          .from('analysts')
          .update({
            status: 'ARCHIVED',
            updatedAt: new Date().toISOString()
          })
          .in('id', analystIds)
        
        if (archiveError) {
          console.error('Error archiving analysts:', archiveError)
          return NextResponse.json(
            { error: 'Failed to archive analysts' },
            { status: 500 }
          )
        }
        break

      case 'changeInfluence':
        if (!influence || !['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'].includes(influence)) {
          return NextResponse.json(
            { error: 'Invalid influence level' },
            { status: 400 }
          )
        }

        // Update influence for the analysts
        const { error: influenceError } = await supabase
          .from('analysts')
          .update({
            influence: influence as 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH',
            updatedAt: new Date().toISOString()
          })
          .in('id', analystIds)
        
        if (influenceError) {
          console.error('Error updating influence:', influenceError)
          return NextResponse.json(
            { error: 'Failed to update influence' },
            { status: 500 }
          )
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'archive' ? 'archived' : 'updated influence for'} ${analystIds.length} analyst(s)`
    })

  } catch (error) {
    console.error('Error in bulk analyst actions:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
