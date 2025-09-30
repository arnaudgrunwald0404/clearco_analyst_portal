import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireVendorScope } from '@/lib/vendor-context'

// Ensure this API runs in the Node.js runtime where server env vars are available
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface FollowUp {
  id: string
  briefingId: string
  briefingTitle: string
  briefingDate: string
  analystName: string
  analystId: string
  description: string
  assignedTo?: string
  assignedUser?: {
    id: string
    name: string
    email: string
    role: string
  }
  comment?: string
  isCompleted: boolean
  completedAt?: string
  createdAt: string
}

export async function GET(request: NextRequest) {
  try {
    const ctxOrResp = await requireVendorScope(request)
    if (ctxOrResp instanceof NextResponse) return ctxOrResp

    // Soft guard for missing service env vars in local dev: degrade gracefully
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.warn('⚠️ [Follow-ups API] Missing Supabase service env vars. Returning empty result.')
      return NextResponse.json({ success: true, data: [] })
    }

    const supabase = createServiceClient()
    
    // Fetch admin users for assignee matching
    console.log('👥 [Follow-ups API] Fetching admin users for assignee matching...')
    const { data: adminUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, name, email, role')
    
    if (usersError) {
      console.error('❌ [Follow-ups API] Error fetching admin users:', usersError)
      // Continue without user matching - don't fail the entire request
    }
    
    console.log(`👥 [Follow-ups API] Found ${adminUsers?.length || 0} admin users`)
    
    // Create a helper function to match assignee names with users
    const matchAssigneeToUser = (assigneeName: string) => {
      if (!adminUsers || !assigneeName) return null
      
      // Normalize the assignee name for matching
      const normalizedAssignee = assigneeName.toLowerCase().trim()
      
      // Try exact name match first
      let matchedUser = adminUsers.find(user => 
        user.name?.toLowerCase().trim() === normalizedAssignee
      )
      
      // If no exact match, try partial matches
      if (!matchedUser) {
        matchedUser = adminUsers.find(user => {
          const userName = user.name?.toLowerCase().trim() || ''
          // Check if assignee name is contained in user name or vice versa
          return userName.includes(normalizedAssignee) || normalizedAssignee.includes(userName)
        })
      }
      
      // Try matching with first name only
      if (!matchedUser) {
        const assigneeFirstName = normalizedAssignee.split(/\s+/)[0]
        matchedUser = adminUsers.find(user => {
          const userFirstName = user.name?.toLowerCase().trim().split(/\s+/)[0] || ''
          return userFirstName === assigneeFirstName && assigneeFirstName.length > 2
        })
      }
      
      return matchedUser ? {
        id: matchedUser.id,
        name: matchedUser.name || '',
        email: matchedUser.email || '',
        role: matchedUser.role || 'USER'
      } : null
    }
    
    // Fetch completed briefings with AI summaries
    const { data: briefings, error } = await supabase
      .from('briefings')
      .select('*')
      .eq('vendor_domain_id', ctxOrResp.id)
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
          analysts:analysts!inner(
            id,
            firstName,
            lastName
          )
        `)
        .eq('briefingId', briefing.id)

      const primaryAnalyst = (briefingAnalysts?.[0] as any)?.analysts as { id: string; firstName: string; lastName: string } | undefined
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

          // Match assignee with admin user
          const matchedUser = assignedTo ? matchAssigneeToUser(assignedTo) : null
          
          followUps.push({
            id: `${briefing.id}-${index}`,
            briefingId: briefing.id,
            briefingTitle: briefing.title,
            briefingDate: briefing.scheduledAt || briefing.completedAt || briefing.createdAt,
            analystName,
            analystId: primaryAnalyst?.id || '',
            description,
            assignedTo: assignedTo || undefined,
            assignedUser: matchedUser || undefined,
            comment: '',
            isCompleted: false,
            createdAt: briefing.createdAt
          })
        })
      }
    }

    const matchedCount = followUps.filter(f => f.assignedUser).length
    const assignedCount = followUps.filter(f => f.assignedTo).length
    
    console.log(`📋 Found ${followUps.length} follow-ups from ${briefings?.length || 0} briefings`)
    console.log(`👤 Matched ${matchedCount}/${assignedCount} assignees with admin users`)

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
