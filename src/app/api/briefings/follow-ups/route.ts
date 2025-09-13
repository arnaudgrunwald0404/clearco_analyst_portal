import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

interface FollowUp {
  id: string
  briefingId: string
  briefingTitle: string
  briefingDate: string
  analystName: string
  analystId: string
  description: string
  assignedTo?: string
  comment?: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceClient()
    
    // Fetch completed briefings with AI summaries
    const { data: briefings, error } = await supabase
      .from('briefings')
      .select('*')
      .eq('status', 'COMPLETED')
      .not('ai_summary', 'is', null)
      .order('scheduledAt', { ascending: false })

    if (error) {
      console.error('Error fetching briefings:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch briefings' },
        { status: 500 }
      )
    }

    const followUps: FollowUp[] = []

    // Extract follow-ups from each completed briefing
    for (const briefing of briefings || []) {
      // Get analysts for this briefing
      const { data: briefingAnalysts } = await supabase
        .from('briefing_analysts')
        .select(`
          analystId,
          analysts!inner(
            id,
            firstName,
            lastName
          )
        `)
        .eq('briefingId', briefing.id)

      const primaryAnalyst = briefingAnalysts?.[0]?.analysts
      const analystName = primaryAnalyst 
        ? `${primaryAnalyst.firstName} ${primaryAnalyst.lastName}`
        : 'Unknown Analyst'
      const aiSummary = typeof briefing.ai_summary === 'string' 
        ? briefing.ai_summary 
        : JSON.stringify(briefing.ai_summary || '')

      // Extract follow-ups using the same logic as the drawer component
      const extractFollowUps = (ai: string) => {
        // Try new delimiter format first
        const startIndex = ai.indexOf('[FOLLOW_UP_START]')
        const endIndex = ai.indexOf('[FOLLOW_UP_END]')
        
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          const content = ai.substring(startIndex + '[FOLLOW_UP_START]'.length, endIndex).trim()
          return content
        }
        
        // Fallback to old markdown format
        const sections = ai.split(/^##\s+/gm).filter(section => section.trim())
        const targetSection = sections.find(section => 
          section.toLowerCase().startsWith('follow-up items')
        )
        
        if (targetSection) {
          const lines = targetSection.split('\n')
          const content = lines.slice(1).join('\n').trim()
          return content
        }
        
        return ''
      }

      const followUpText = extractFollowUps(aiSummary)
      
      if (followUpText && followUpText !== 'None' && followUpText.trim()) {
        // Parse follow-up items (each line is a follow-up)
        const followUpLines = followUpText
          .split('\n')
          .map(line => line.replace(/^[-*•]\s*/, '').trim())
          .filter(line => line.length > 0)

        followUpLines.forEach((line, index) => {
          // Try to extract assigned person (format: "Person Name: task description")
          const colonIndex = line.indexOf(':')
          let assignedTo = ''
          let description = line

          if (colonIndex !== -1 && colonIndex < 50) { // Reasonable position for a name
            const possibleName = line.substring(0, colonIndex).trim()
            // Simple check if it looks like a name (not too long, contains letters)
            if (possibleName.length <= 50 && /^[A-Za-z\s\.]+$/.test(possibleName)) {
              assignedTo = possibleName
              description = line.substring(colonIndex + 1).trim()
            }
          }

          followUps.push({
            id: `${briefing.id}-${index}`,
            briefingId: briefing.id,
            briefingTitle: briefing.title,
            briefingDate: briefing.scheduledAt || briefing.completedAt || briefing.createdAt,
            analystName,
            analystId: primaryAnalyst?.id || '',
            description,
            assignedTo: assignedTo || undefined,
            comment: '',
            isCompleted: false,
            createdAt: briefing.createdAt
          })
        })
      }
    }

    console.log(`📋 Found ${followUps.length} follow-ups from ${briefings?.length || 0} briefings`)

    return NextResponse.json({
      success: true,
      data: followUps
    })

  } catch (error) {
    console.error('Error in follow-ups API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, isCompleted, comment } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Follow-up ID is required' },
        { status: 400 }
      )
    }

    // For now, we'll store follow-up states in localStorage on the client side
    // In a production app, you'd want to create a separate follow_ups table
    
    return NextResponse.json({
      success: true,
      message: 'Follow-up updated successfully'
    })

  } catch (error) {
    console.error('Error updating follow-up:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
