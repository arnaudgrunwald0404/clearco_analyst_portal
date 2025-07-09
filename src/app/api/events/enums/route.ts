import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // These would ideally be pulled from Prisma schema or database introspection
    // For now, we'll define them here but they can be dynamically fetched
    const enums = {
      eventTypes: [
        { value: 'CONFERENCE', label: 'Conference' },
        { value: 'EXHIBITION', label: 'Exhibition' },
        { value: 'WEBINAR', label: 'Webinar' }
      ],
      eventStatuses: [
        { value: 'EVALUATING', label: 'Evaluating' },
        { value: 'COMMITTED', label: 'Committed' },
        { value: 'CONTRACTED', label: 'Contracted' },
        { value: 'NOT_GOING', label: 'Not Going' }
      ],
      audienceGroups: [
        { value: 'Partners', label: 'Partners' },
        { value: 'Prospects', label: 'Prospects' },
        { value: 'Analysts', label: 'Analysts' },
        { value: 'Clients', label: 'Clients' }
      ],
      participationTypes: [
        { value: 'Attending Only', label: 'Attending Only' },
        { value: 'Exhibiting', label: 'Exhibiting' },
        { value: 'Sponsoring', label: 'Sponsoring' }
      ]
    }

    return NextResponse.json({
      success: true,
      data: enums
    })

  } catch (error) {
    console.error('Error fetching enums:', error)
    return NextResponse.json(
      { error: 'Failed to fetch enum values' },
      { status: 500 }
    )
  }
}
