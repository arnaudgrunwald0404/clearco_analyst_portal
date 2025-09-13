import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { parseDate } from '@/lib/date-utils'

function generateId(): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 8)
  return `cl${timestamp}${randomPart}`
}

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
    const supabaseService = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    ) // Use service client to bypass RLS

    // Validate each award
    const validAwards: any[] = []
    const errors: string[] = []
    const existingNames = new Set<string>()

    // Check for existing award names in the database using the actual column 'name'
    const namesToCheck = awards.map((a: any) => a.awardName || a.name).filter((n: string) => !!n)
    if (namesToCheck.length > 0) {
      const { data: existingAwards, error: existingError } = await supabaseService
        .from('awards')
        .select('awardName') // Database column is 'awardName' based on debug results
        .in('awardName', namesToCheck) // Database column is 'awardName' based on debug results

      if (existingError) {
        console.error('Error checking existing awards:', existingError)
        return NextResponse.json(
          { error: 'Failed to check existing awards' },
          { status: 500 }
        )
      }
      existingAwards?.forEach((a: any) => existingNames.add(a.awardName)) // Database column is 'awardName'
    }

    for (let i = 0; i < awards.length; i++) {
      const award = awards[i]
      
      // Validate required fields (align with AddAwardModal and awards table schema)
      if (!award.awardName || !award.publicationDate || !award.processStartDate || !award.contactInfo) {
        errors.push(`Row ${i + 1}: Award name, publication date, process start date, and contact info are required`)
        continue
      }

      // Validate date formats
      const pubDate = parseDate(award.publicationDate)
      const startDate = parseDate(award.processStartDate)
      
      if (!pubDate) {
        errors.push(`Row ${i + 1}: Invalid publication date format. Supported formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY`)
        continue
      }
      
      if (!startDate) {
        errors.push(`Row ${i + 1}: Invalid process start date format. Supported formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY`)
        continue
      }

      // Ensure processStartDate is before publicationDate
      if (startDate >= pubDate) {
        errors.push(`Row ${i + 1}: Process start date must be before publication date`)
        continue
      }

      // Validate priority enum if provided
      if (award.priority) {
        const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
        if (!validPriorities.includes(String(award.priority).toUpperCase())) {
          errors.push(`Row ${i + 1}: Invalid priority '${award.priority}'. Valid options: ${validPriorities.join(', ')}`)
          continue
        }
      }

      // Check for duplicate awardName in current batch
      if (validAwards.some(va => va.awardName === award.awardName)) {
        errors.push(`Row ${i + 1}: Duplicate award name in upload: ${award.awardName}`)
        continue
      }

      // Check for existing awardName in database
      if (existingNames.has(award.awardName)) {
        errors.push(`Row ${i + 1}: Award name already exists: ${award.awardName}`)
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

    // Prepare data for batch creation (align with actual database schema from debug results)
    const awardsToCreate = validAwards.map(awardData => {
      const now = new Date().toISOString()
      return {
        id: generateId(),
        awardName: awardData.awardName, // Database uses 'awardName'
        contactInfo: awardData.contactInfo, // Database uses 'contactInfo'
        processStartDate: parseDate(awardData.processStartDate)!.toISOString(), // Database uses 'processStartDate'
        publicationDate: parseDate(awardData.publicationDate)!.toISOString(), // Database uses 'publicationDate'
        topics: awardData.topics ? (Array.isArray(awardData.topics) ? awardData.topics.join(', ') : String(awardData.topics)) : 'General', // Required field
        priority: (awardData.priority || 'MEDIUM').toUpperCase(),
        createdAt: now, // Required field
        updatedAt: now // Required field
        // Note: Removed optional fields (link, owner, cost, notes) as they don't exist in the table schema
      }
    })

    // Create awards one by one to capture per-row errors
    const createdAwards: any[] = []
    const createErrors: string[] = []
    
    for (const awardData of awardsToCreate) {
      try {
        const { data: award, error: createError } = await supabaseService
          .from('awards')
          .insert(awardData)
          .select()
          .single()
        
        if (createError) {
          console.error(`Failed to create award "${awardData.awardName}":`, createError)
          createErrors.push(`Failed to create award "${awardData.awardName}": ${createError.message}`)
        } else if (award) {
          createdAwards.push(award)
        }
      } catch (individualError: any) {
        console.error(`Failed to create award "${awardData.awardName}":`, individualError)
        createErrors.push(`Failed to create award "${awardData.awardName}": ${individualError.message || individualError}`)
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
