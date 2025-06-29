import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { columns, fieldMappings } = body

    if (!Array.isArray(columns) || !fieldMappings) {
      return NextResponse.json(
        { error: 'Columns and field mappings are required' },
        { status: 400 }
      )
    }

    // Simple LLM prompt for column mapping
    const prompt = `
You are a data mapping expert. Given a list of column names from a CSV/Excel file containing analyst information, map them to the appropriate fields.

Available target fields:
- firstName: First name of the analyst
- lastName: Last name of the analyst  
- email: Email address
- company: Company/organization name
- title: Job title/position
- phone: Phone number
- linkedIn: LinkedIn profile URL
- twitter: Twitter handle/URL
- website: Personal/company website
- bio: Biography/description
- expertise: Areas of expertise (comma-separated)
- influence: Influence level (LOW, MEDIUM, HIGH, VERY_HIGH)
- status: Status (ACTIVE, INACTIVE, ARCHIVED)

Column names to map: ${columns.join(', ')}

Provide a JSON response with:
1. "mapping": An object mapping column names to target fields
2. "unmappedColumns": Array of columns that couldn't be mapped
3. "confidence": Overall confidence score (0-1)

Be intelligent about partial matches and common variations. For example:
- "First Name", "fname", "given_name" should map to "firstName"
- "Last Name", "surname", "family_name" should map to "lastName"
- "Email Address", "e-mail", "contact_email" should map to "email"

Return only valid JSON.`

    try {
      // In a real implementation, you would call an LLM API here
      // For now, we'll use a simple fuzzy matching algorithm
      const mapping: Record<string, string> = {}
      const unmappedColumns: string[] = []

      for (const column of columns) {
        const normalizedColumn = column.toLowerCase().trim()
        let mapped = false

        // Try exact and fuzzy matching
        for (const [field, variants] of Object.entries(fieldMappings)) {
          // Check exact matches first
          if (variants.includes(normalizedColumn)) {
            mapping[column] = field
            mapped = true
            break
          }

          // Check if column contains any variant
          if (variants.some(variant => normalizedColumn.includes(variant))) {
            mapping[column] = field
            mapped = true
            break
          }

          // Check if any variant contains the column (reverse check)
          if (variants.some(variant => variant.includes(normalizedColumn))) {
            mapping[column] = field
            mapped = true
            break
          }
        }

        // Additional smart mappings
        if (!mapped) {
          if (normalizedColumn.includes('name') && normalizedColumn.includes('first')) {
            mapping[column] = 'firstName'
            mapped = true
          } else if (normalizedColumn.includes('name') && normalizedColumn.includes('last')) {
            mapping[column] = 'lastName'
            mapped = true
          } else if (normalizedColumn.includes('mail')) {
            mapping[column] = 'email'
            mapped = true
          } else if (normalizedColumn.includes('phone') || normalizedColumn.includes('tel')) {
            mapping[column] = 'phone'
            mapped = true
          } else if (normalizedColumn.includes('linkedin')) {
            mapping[column] = 'linkedIn'
            mapped = true
          } else if (normalizedColumn.includes('twitter')) {
            mapping[column] = 'twitter'
            mapped = true
          } else if (normalizedColumn.includes('web') || normalizedColumn.includes('url')) {
            mapping[column] = 'website'
            mapped = true
          } else if (normalizedColumn.includes('bio') || normalizedColumn.includes('description')) {
            mapping[column] = 'bio'
            mapped = true
          } else if (normalizedColumn.includes('skill') || normalizedColumn.includes('expert')) {
            mapping[column] = 'expertise'
            mapped = true
          } else if (normalizedColumn.includes('influence') || normalizedColumn.includes('tier')) {
            mapping[column] = 'influence'
            mapped = true
          } else if (normalizedColumn.includes('status') || normalizedColumn.includes('active')) {
            mapping[column] = 'status'
            mapped = true
          } else if (normalizedColumn.includes('type') || normalizedColumn.includes('category') || normalizedColumn.includes('classification')) {
            mapping[column] = 'type'
            mapped = true
          }
        }

        if (!mapped) {
          unmappedColumns.push(column)
        }
      }

      const confidence = Object.keys(mapping).length / columns.length

      return NextResponse.json({
        success: true,
        mapping,
        unmappedColumns,
        confidence
      })

    } catch (llmError) {
      console.error('LLM mapping failed, using fallback:', llmError)
      
      // Fallback to simple string matching
      const mapping: Record<string, string> = {}
      const unmappedColumns: string[] = []

      for (const column of columns) {
        const normalizedColumn = column.toLowerCase().trim()
        let mapped = false

        for (const [field, variants] of Object.entries(fieldMappings)) {
          if (variants.some(variant => normalizedColumn.includes(variant))) {
            mapping[column] = field
            mapped = true
            break
          }
        }

        if (!mapped) {
          unmappedColumns.push(column)
        }
      }

      return NextResponse.json({
        success: true,
        mapping,
        unmappedColumns,
        confidence: 0.7 // Lower confidence for fallback
      })
    }

  } catch (error) {
    console.error('Error in column mapping:', error)
    return NextResponse.json(
      { error: 'Failed to map columns' },
      { status: 500 }
    )
  }
}
