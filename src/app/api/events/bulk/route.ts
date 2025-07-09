import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDate } from '@/lib/date-utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { events } = body

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: 'Events array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Validate each event
    const validEvents = []
    const errors = []
    const existingNames = new Set()

    // Check for existing event names in the database
    const existingEvents = await prisma.event.findMany({
      where: {
        eventName: {
          in: events.map(e => e.eventName).filter(Boolean)
        }
      },
      select: { eventName: true }
    })

    existingEvents.forEach(e => existingNames.add(e.eventName))

    for (let i = 0; i < events.length; i++) {
      const event = events[i]
      
      // Validate required fields
      if (!event.eventName || !event.startDate) {
        errors.push(`Row ${i + 1}: Event name and start date are required`)
        continue
      }

      // Validate date format using robust date parsing
      const startDate = parseDate(event.startDate)
      
      if (!startDate) {
        errors.push(`Row ${i + 1}: Invalid start date format. Supported formats: YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY, MM-DD-YYYY, DD.MM.YYYY`)
        continue
      }

      // Validate and normalize type enum (case-insensitive)
      if (event.type) {
        const typeString = event.type.toString().trim()
        
        // Map common variations to our enum values (case-insensitive)
        const typeMapping: Record<string, string> = {
          // Conference variations
          'conference': 'CONFERENCE',
          'conf': 'CONFERENCE',
          'convention': 'CONFERENCE',
          'summit': 'CONFERENCE',
          'symposium': 'CONFERENCE',
          'meeting': 'CONFERENCE',
          'workshop': 'CONFERENCE',
          'seminar': 'CONFERENCE',
          'networking': 'CONFERENCE',
          'training': 'CONFERENCE',
          'networking or training event': 'CONFERENCE',
          'training event': 'CONFERENCE',
          'networking event': 'CONFERENCE',
          
          // Exhibition variations  
          'exhibition': 'EXHIBITION',
          'exhibit': 'EXHIBITION',
          'expo': 'EXHIBITION',
          'show': 'EXHIBITION',
          'fair': 'EXHIBITION',
          'trade show': 'EXHIBITION',
          'tradeshow': 'EXHIBITION',
          
          // Webinar variations
          'webinar': 'WEBINAR',
          'online event': 'WEBINAR',
          'virtual event': 'WEBINAR',
          'online seminar': 'WEBINAR',
          'virtual seminar': 'WEBINAR'
        }
        
        let mappedType = null
        
        // Handle comma-separated types - pick the first valid one
        if (typeString.includes(',')) {
          const types = typeString.split(',').map(t => t.trim().toLowerCase())
          for (const type of types) {
            if (typeMapping[type]) {
              mappedType = typeMapping[type]
              break
            }
          }
        } else {
          // Single type
          const normalizedType = typeString.toLowerCase()
          mappedType = typeMapping[normalizedType]
        }
        
        if (!mappedType) {
          errors.push(`Row ${i + 1}: Invalid event type '${event.type}'. Supported types: Conference, Exhibition, Webinar, Networking, Training`)
          continue
        }
        
        // Update the event type to the normalized enum value
        event.type = mappedType
      }

      // Validate and normalize status enum (case-insensitive)
      if (event.status) {
        const statusString = event.status.toString().trim()
        
        // Map common status variations to our enum values
        const statusMapping: Record<string, string> = {
          'evaluating': 'EVALUATING',
          'evaluation': 'EVALUATING',
          'under evaluation': 'EVALUATING',
          'considering': 'EVALUATING',
          'pending': 'EVALUATING',
          'reviewing': 'EVALUATING',
          'declined': 'NOT_GOING',
          'rejected': 'NOT_GOING',
          'cancelled': 'NOT_GOING',
          'not going': 'NOT_GOING',
          'not attending': 'NOT_GOING',
          
          'committed': 'COMMITTED',
          'confirmed': 'COMMITTED',
          'approved': 'COMMITTED',
          'accepted': 'COMMITTED',
          'going': 'COMMITTED',
          
          'contracted': 'CONTRACTED',
          'signed': 'CONTRACTED',
          'finalized': 'CONTRACTED',
          'booked': 'CONTRACTED'
        }
        
        let mappedStatus = null
        
        // Handle multiple statuses separated by / or , - pick the first valid one
        if (statusString.includes('/') || statusString.includes(',')) {
          const statuses = statusString.split(/[/,]/).map(s => s.trim().toLowerCase())
          for (const status of statuses) {
            if (statusMapping[status]) {
              mappedStatus = statusMapping[status]
              break
            }
          }
        } else {
          // Single status
          const normalizedStatus = statusString.toLowerCase()
          mappedStatus = statusMapping[normalizedStatus]
        }
        
        if (!mappedStatus) {
          errors.push(`Row ${i + 1}: Invalid status '${event.status}'. Supported statuses: Evaluating, Committed, Contracted, Declined`)
          continue
        }
        
        // Update the event status to the normalized enum value
        event.status = mappedStatus
      }

      // Validate audience groups
      if (event.audienceGroups) {
        const validAudienceGroups = ['Partners', 'Prospects', 'Analysts', 'Clients']
        let audienceArray
        
        if (Array.isArray(event.audienceGroups)) {
          audienceArray = event.audienceGroups
        } else if (typeof event.audienceGroups === 'string') {
          // Handle comma-separated string
          audienceArray = event.audienceGroups.split(',').map(ag => ag.trim()).filter(ag => ag)
        } else {
          audienceArray = [event.audienceGroups]
        }
        
        const invalidAudiences = audienceArray.filter(ag => !validAudienceGroups.includes(ag))
        if (invalidAudiences.length > 0) {
          errors.push(`Row ${i + 1}: Invalid audience groups: ${invalidAudiences.join(', ')}. Valid options: ${validAudienceGroups.join(', ')}`)
          continue
        }
      }

      // Validate participation types
      if (event.participationTypes) {
        const validParticipationTypes = ['Attending Only', 'Exhibiting', 'Sponsoring', 'Speaking']
        let participationArray
        
        if (Array.isArray(event.participationTypes)) {
          participationArray = event.participationTypes
        } else if (typeof event.participationTypes === 'string') {
          // Handle comma-separated string
          participationArray = event.participationTypes.split(',').map(pt => pt.trim()).filter(pt => pt)
        } else {
          participationArray = [event.participationTypes]
        }
        
        const invalidParticipation = participationArray.filter(pt => !validParticipationTypes.includes(pt))
        if (invalidParticipation.length > 0) {
          errors.push(`Row ${i + 1}: Invalid participation types: ${invalidParticipation.join(', ')}. Valid options: ${validParticipationTypes.join(', ')}`)
          continue
        }
      }

      // Check for duplicate event name in current batch
      if (validEvents.some(ve => ve.eventName === event.eventName)) {
        errors.push(`Row ${i + 1}: Duplicate event name in upload: ${event.eventName}`)
        continue
      }

      // Check for existing event name in database
      if (existingNames.has(event.eventName)) {
        errors.push(`Row ${i + 1}: Event name already exists: ${event.eventName}`)
        continue
      }

      validEvents.push(event)
    }

    if (errors.length > 0 && validEvents.length === 0) {
      return NextResponse.json(
        { error: 'No valid events to import', details: errors },
        { status: 400 }
      )
    }

    // Prepare data for batch creation
    const eventsToCreate = validEvents.map(eventData => {
      // Process audience groups
      let processedAudienceGroups = null
      if (eventData.audienceGroups) {
        if (Array.isArray(eventData.audienceGroups)) {
          processedAudienceGroups = JSON.stringify(eventData.audienceGroups)
        } else if (typeof eventData.audienceGroups === 'string') {
          const audienceArray = eventData.audienceGroups.split(',').map(ag => ag.trim()).filter(ag => ag)
          processedAudienceGroups = JSON.stringify(audienceArray)
        } else {
          processedAudienceGroups = JSON.stringify([eventData.audienceGroups])
        }
      }
      
      // Process participation types
      let processedParticipationTypes = null
      if (eventData.participationTypes) {
        if (Array.isArray(eventData.participationTypes)) {
          processedParticipationTypes = JSON.stringify(eventData.participationTypes)
        } else if (typeof eventData.participationTypes === 'string') {
          const participationArray = eventData.participationTypes.split(',').map(pt => pt.trim()).filter(pt => pt)
          processedParticipationTypes = JSON.stringify(participationArray)
        } else {
          processedParticipationTypes = JSON.stringify([eventData.participationTypes])
        }
      }
      
      return {
        eventName: eventData.eventName,
        link: eventData.link || null,
        type: eventData.type || 'CONFERENCE',
        audienceGroups: processedAudienceGroups,
        startDate: parseDate(eventData.startDate)!,
        participationTypes: processedParticipationTypes,
        owner: eventData.owner || null,
        location: eventData.location || null,
        status: eventData.status || 'EVALUATING',
        notes: eventData.notes || null
      }
    })

    // Create events using createMany for better performance
    let createdEvents = []
    let createErrors = []
    
    try {
      // Use createMany for better performance with large datasets
      if (eventsToCreate.length > 0) {
        const result = await prisma.event.createMany({
          data: eventsToCreate,
          skipDuplicates: true
        })
        
        // Fetch the created events to return them
        const eventNames = eventsToCreate.map(e => e.eventName)
        createdEvents = await prisma.event.findMany({
          where: {
            eventName: { in: eventNames },
            createdAt: {
              gte: new Date(Date.now() - 60000) // Events created in the last minute
            }
          },
          orderBy: { createdAt: 'desc' }
        })
        
        console.log(`Successfully created ${result.count} events out of ${eventsToCreate.length} provided`)
      }
    } catch (bulkError) {
      console.error('Bulk creation failed, falling back to individual creation:', bulkError)
      
      // Fallback: Create events one by one
      for (const eventData of eventsToCreate) {
        try {
          const event = await prisma.event.create({
            data: eventData
          })
          createdEvents.push(event)
        } catch (individualError) {
          console.error(`Failed to create event "${eventData.eventName}":`, individualError)
          createErrors.push(`Failed to create event "${eventData.eventName}": ${individualError.message}`)
        }
      }
    }

    // Combine validation errors with creation errors
    const allErrors = [...errors, ...createErrors]
    
    return NextResponse.json({
      success: true,
      data: {
        created: createdEvents,
        count: createdEvents.length,
        errors: allErrors.length > 0 ? allErrors : undefined
      }
    })

  } catch (error) {
    console.error('Error creating events in bulk:', error)
    return NextResponse.json(
      { error: 'Failed to create events' },
      { status: 500 }
    )
  }
}
