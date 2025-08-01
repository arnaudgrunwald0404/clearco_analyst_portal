import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { parseDate } from '@/lib/date-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { awards } = body

    if (!Array.isArray(awards) || awards.length === 0) {
      return NextResponse.json(
        { error: 'Awards array is required and must not be empty' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Validate each award
    const validAwards = []
    const errors = []
    const existingNames = new Set()

    // Check for existing award names in the database
    const { data: existingAwards, error: existingError } = await supabase
      .from('awards')
      .select('name')
      .in('name', awards.map(a => a.name).filter(Boolean))

    if (existingError) {
      console.error('Error checking existing awards:', existingError)
      return NextResponse.json(
        { error: 'Failed to check existing awards' },
        { status: 500 }
      )
    }

    existingAwards?.forEach(a => existingNames.add(a.name))

    for (let i = 0; i < awards.length; i++) {
      const award = awards[i]
      
      // Validate required fields
      if (!award.name || !award.publicationDate || !award.submissionDate || !award.organization) {
        errors.push(`Row ${i + 1}: Award name, publication date, submission date, and organization are required`)
        continue
      }

      // Validate date formats using robust date parsing
      const pubDate = parseDate(award.publicationDate)
      const subDate = parseDate(award.submissionDate)
      
      if (!pubDate) {
        errors.push(`Row ${i + 1}: Invalid publication date format. Supported formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY`)
        continue
      }
      
      if (!subDate) {
        errors.push(`Row ${i + 1}: Invalid submission date format. Supported formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY`)
        continue
      }

      // Validate status enum if provided
      if (award.status) {
        const validStatuses = ['EVALUATING', 'SUBMITTED', 'UNDER_REVIEW', 'WINNER', 'FINALIST', 'NOT_SELECTED', 'WITHDRAWN']
        if (!validStatuses.includes(award.status.toUpperCase())) {
          errors.push(`Row ${i + 1}: Invalid status '${award.status}'. Valid options: ${validStatuses.join(', ')}`)
          continue
        }
      }

      // Validate priority enum if provided
      if (award.priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        if (!validPriorities.includes(award.priority.toUpperCase())) {
          errors.push(`Row ${i + 1}: Invalid priority '${award.priority}'. Valid options: ${validPriorities.join(', ')}`)
          continue
        }
      }

      // Validate that submission date is before publication date
      if (subDate >= pubDate) {
        errors.push(`Row ${i + 1}: Submission date must be before publication date`)
        continue
      }

      // Check for duplicate award name in current batch
      if (validAwards.some(va => va.name === award.name)) {
        errors.push(`Row ${i + 1}: Duplicate award name in upload: ${award.name}`)
        continue
      }

      // Check for existing award name in database
      if (existingNames.has(award.name)) {
        errors.push(`Row ${i + 1}: Award name already exists: ${award.name}`)
        continue
      }

      validAwards.push(award)
    }

    if (errors.length > 0 && validAwards.length === 0) {
      return NextResponse.json(
        { error: 'No valid awards to import', details: errors },
        { status: 400 }
      )
    }

    // Prepare data for batch creation
    const awardsToCreate = validAwards.map(awardData => {
      // Process product topics
      let processedTopics = null
      if (awardData.productTopics) {
        if (Array.isArray(awardData.productTopics)) {
          processedTopics = awardData.productTopics
        } else if (typeof awardData.productTopics === 'string') {
          processedTopics = awardData.productTopics.split(',').map(t => t.trim()).filter(t => t)
        } else {
          processedTopics = [awardData.productTopics]
        }
      }
      
      return {
        name: awardData.name,
        link: awardData.link || null,
        organization: awardData.organization,
        productTopics: processedTopics ? JSON.stringify(processedTopics) : null,
        priority: (awardData.priority || 'MEDIUM').toUpperCase(),
        submissionDate: parseDate(awardData.submissionDate)!.toISOString(),
        publicationDate: parseDate(awardData.publicationDate)!.toISOString(),
        owner: awardData.owner || null,
        status: (awardData.status || 'EVALUATING').toUpperCase(),
        cost: awardData.cost || null,
        notes: awardData.notes || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    })

    // Create awards
    let createdAwards = []
    const createErrors = []
    
    for (const awardData of awardsToCreate) {
      try {
        const { data: award, error: createError } = await supabase
          .from('awards')
          .insert(awardData)
          .select()
          .single()
        
        if (createError) {
          console.error(`Failed to create award "${awardData.name}":`, createError)
          createErrors.push(`Failed to create award "${awardData.name}": ${createError.message}`)
        } else {
          createdAwards.push(award)
        }
      } catch (individualError) {
        console.error(`Failed to create award "${awardData.name}":`, individualError)
        createErrors.push(`Failed to create award "${awardData.name}": ${individualError.message}`)
      }
    }

    // Combine validation errors with creation errors
    const allErrors = [...errors, ...createErrors]
    
    return NextResponse.json({
      success: true,
      data: {
        created: createdAwards,
        count: createdAwards.length,
        errors: allErrors.length > 0 ? allErrors : undefined
      }
    })

  } catch (error) {
    console.error('Error creating awards in bulk:', error)
    return NextResponse.json(
      { error: 'Failed to create awards' },
      { status: 500 }
    )
  }
}
