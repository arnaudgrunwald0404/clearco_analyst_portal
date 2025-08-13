import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { syncAnalystSocialHandlesOnUpdate, removeAnalystSocialHandlesOnDelete } from '@/lib/social-sync'
import { requireAuth } from '@/lib/auth-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: analystId } = await params
    const { searchParams } = new URL(request.url)
    const hardDelete = searchParams.get('hardDelete') === 'true'
    
    // Prefer service-role client for write ops to avoid RLS blocking profile edits
    const adminSupabase = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null
    const supabase = adminSupabase || await createClient()

    // Check if analyst exists
    const { data: existingAnalyst, error: fetchError } = await supabase
      .from('analysts')
      .select('id, firstName, lastName, status')
      .eq('id', analystId)
      .single()

    if (fetchError || !existingAnalyst) {
      return NextResponse.json({
        success: false,
        error: 'Analyst not found'
      }, { status: 404 })
    }

    if (hardDelete) {
      // Hard delete - only allowed for archived analysts
      if (existingAnalyst.status !== 'ARCHIVED') {
        return NextResponse.json({
          success: false,
          error: 'Only archived analysts can be permanently deleted'
        }, { status: 400 })
      }

      // Use service role client for hard delete operations
      if (!adminSupabase) {
        return NextResponse.json({
          success: false,
          error: 'Service role access required for hard delete'
        }, { status: 500 })
      }

      // Delete related data first
      const { error: publicationsError } = await adminSupabase
        .from('publications')
        .delete()
        .eq('analystId', analystId)

      if (publicationsError) {
        console.error('Error deleting publications:', publicationsError)
      }

      const { error: newsletterSubsError } = await adminSupabase
        .from('newsletter_subscriptions')
        .delete()
        .eq('analystId', analystId)

      if (newsletterSubsError) {
        console.error('Error deleting newsletter subscriptions:', newsletterSubsError)
      }

      const { error: coveredTopicsError } = await adminSupabase
        .from('covered_topics')
        .delete()
        .eq('analystId', analystId)

      if (coveredTopicsError) {
        console.error('Error deleting covered topics:', coveredTopicsError)
      }

      // Finally, delete the analyst
      const { error: deleteError } = await adminSupabase
        .from('analysts')
        .delete()
        .eq('id', analystId)

      if (deleteError) {
        console.error('Error hard deleting analyst:', deleteError)
        return NextResponse.json({
          success: false,
          error: 'Failed to permanently delete analyst'
        }, { status: 500 })
      }

      console.log(`Analyst ${analystId} (${existingAnalyst.firstName} ${existingAnalyst.lastName}) permanently deleted at ${new Date().toISOString()}`)

      return NextResponse.json({
        success: true,
        message: 'Analyst permanently deleted successfully',
        analyst: {
          id: existingAnalyst.id,
          name: `${existingAnalyst.firstName} ${existingAnalyst.lastName}`,
          status: 'DELETED'
        }
      })
    } else {
      // Soft delete (archive) - only allowed for non-archived analysts
      if (existingAnalyst.status === 'ARCHIVED') {
        return NextResponse.json({
          success: false,
          error: 'Analyst is already archived'
        }, { status: 400 })
      }

      // Soft delete by updating status to ARCHIVED
      const { data: updatedAnalyst, error: updateError } = await supabase
        .from('analysts')
        .update({
          status: 'ARCHIVED',
          updatedAt: new Date().toISOString()
        })
        .eq('id', analystId)
        .select('id, firstName, lastName, status')
        .single()

      if (updateError || !updatedAnalyst) {
        return NextResponse.json({
          success: false,
          error: 'Failed to archive analyst'
        }, { status: 500 })
      }

      // Log the deletion activity
      console.log(`Analyst ${analystId} (${existingAnalyst.firstName} ${existingAnalyst.lastName}) archived at ${new Date().toISOString()}`)

      return NextResponse.json({
        success: true,
        message: 'Analyst archived successfully',
        analyst: {
          id: updatedAnalyst.id,
          name: `${updatedAnalyst.firstName} ${updatedAnalyst.lastName}`,
          status: updatedAnalyst.status
        }
      })
    }

  } catch (error) {
    console.error('Error processing analyst deletion:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to process analyst deletion'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: analystId } = await params
    const supabase = await createClient()

    // Get analyst details
    const { data: analyst, error: analystError } = await supabase
      .from('analysts')
      .select('*')
      .eq('id', analystId)
      .single()

    if (analystError || !analyst) {
      return NextResponse.json({
        success: false,
        error: 'Analyst not found'
      }, { status: 404 })
    }

    // Get analyst's social posts
    const { data: socialPosts } = await supabase
      .from('social_posts')
      .select('*')
      .eq('analystId', analystId)
      .order('postedAt', { ascending: false })
      .limit(10)

    // Get analyst's briefings via briefing_analysts table
    const { data: briefingAnalysts } = await supabase
      .from('briefing_analysts')
      .select(`
        briefings(
          id,
          title,
          status,
          scheduledAt,
          completedAt
        )
      `)
      .eq('analystId', analystId)
      .order('briefings(scheduledAt)', { ascending: false })
      .limit(10)

    const briefings = briefingAnalysts?.map(ba => ba.briefings).filter(Boolean) || []

    // Get related topics
    const { data: coveredTopics } = await supabase
      .from('covered_topics')
      .select('topic')
      .eq('analystId', analystId)

    const topics = coveredTopics?.map(ct => ct.topic) || []

    console.log(`📋 Found analyst ${analyst.firstName} ${analyst.lastName} with ${socialPosts?.length || 0} posts, ${briefings.length} briefings, ${topics.length} topics`)

    return NextResponse.json({
      success: true,
      data: {
        ...analyst,
        socialPosts: socialPosts || [],
        briefings: briefings,
        topics: topics,
        metrics: {
          totalBriefings: briefings.length,
          totalSocialPosts: socialPosts?.length || 0,
          totalTopics: topics.length
        }
      }
    })

  } catch (error) {
    console.error('Error fetching analyst:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch analyst'
    }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: analystIdToUpdate } = await params
    const body = await request.json()
    const { action } = body

    // Handle restore action
    if (action === 'restore') {
      const supabase = await createClient()
      
      // Check if analyst exists and is archived
      const { data: existingAnalyst, error: fetchError } = await supabase
        .from('analysts')
        .select('id, firstName, lastName, status')
        .eq('id', analystIdToUpdate)
        .single()

      if (fetchError || !existingAnalyst) {
        return NextResponse.json({
          success: false,
          error: 'Analyst not found'
        }, { status: 404 })
      }

      if (existingAnalyst.status !== 'ARCHIVED') {
        return NextResponse.json({
          success: false,
          error: 'Only archived analysts can be restored'
        }, { status: 400 })
      }

      // Restore by updating status to ACTIVE
      const { data: updatedAnalyst, error: updateError } = await supabase
        .from('analysts')
        .update({
          status: 'ACTIVE',
          updatedAt: new Date().toISOString()
        })
        .eq('id', analystIdToUpdate)
        .select('id, firstName, lastName, status')
        .single()

      if (updateError || !updatedAnalyst) {
        return NextResponse.json({
          success: false,
          error: 'Failed to restore analyst'
        }, { status: 500 })
      }

      console.log(`Analyst ${analystIdToUpdate} (${existingAnalyst.firstName} ${existingAnalyst.lastName}) restored at ${new Date().toISOString()}`)

      return NextResponse.json({
        success: true,
        message: 'Analyst restored successfully',
        analyst: {
          id: updatedAnalyst.id,
          name: `${updatedAnalyst.firstName} ${updatedAnalyst.lastName}`,
          status: updatedAnalyst.status
        }
      })
    }

    // Prefer service-role for updates to avoid RLS blocking admin-approved edits
    const adminSupabase = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL)
      ? createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
      : null
    const supabase = adminSupabase || await createClient()

    // 1. Authentication & Authorization
    const authResult = await requireAuth()
    if (authResult instanceof NextResponse) {
      return authResult // User not authenticated
    }
    const authUser = authResult

    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('role, email')
      .eq('id', authUser.id)
      .single()

    if (!userProfile) {
      return NextResponse.json({ success: false, error: 'User profile not found.' }, { status: 403 })
    }

    if (userProfile.role !== 'ADMIN') {
      // If user is not an Admin, they must be an Analyst updating their own profile
      if (userProfile.role !== 'ANALYST') {
        return NextResponse.json({ success: false, error: 'Permission denied.' }, { status: 403 })
      }

      // Find the analyst record associated with this user's email
      const { data: analystRecord } = await supabase
        .from('analysts')
        .select('id')
        .eq('email', userProfile.email)
        .single()

      if (!analystRecord || analystRecord.id !== analystIdToUpdate) {
        return NextResponse.json({ success: false, error: 'You can only update your own profile.' }, { status: 403 })
      }
    }

    // 2. Check if analyst exists
    const { data: existingAnalyst } = await supabase
      .from('analysts')
      .select('id, firstName, lastName')
      .eq('id', analystIdToUpdate)
      .single()

    if (!existingAnalyst) {
      return NextResponse.json({
        success: false,
        error: 'Analyst not found'
      }, { status: 404 })
    }

    // 3. Prepare and validate update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    // Accept both legacy column names and new alias fields
    // Columns in DB (see types): linkedinUrl, twitterHandle, personalWebsite
    // Only columns that actually exist in DB; social fields are mapped below
    const directFields = [
      'firstName', 'lastName', 'email', 'company', 'title', 'bio',
      'profileImageUrl', 'notes',
      // Persist social/contact directly to DB columns
      'linkedinUrl', 'twitterHandle', 'personalWebsite'
    ] as const

    // Admin-only fields
    const adminFields = ['influence', 'relationshipHealth', 'status', 'lastContactDate', 'keyThemes']

    // Process direct fields
    directFields.forEach((field) => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Process admin fields if user is admin
    if (userProfile.role === 'ADMIN') {
      adminFields.forEach(field => {
        if (body[field] !== undefined) {
          updateData[field] = body[field]
        }
      })
    }

    // Handle aliases from newer schema or UI → map to actual DB columns
    // LinkedIn
    if (body.linkedin !== undefined) {
      updateData.linkedinUrl = Array.isArray(body.linkedin) ? body.linkedin[0] : body.linkedin
    }
    if (body.linkedinUrl !== undefined) {
      updateData.linkedinUrl = Array.isArray(body.linkedinUrl) ? body.linkedinUrl[0] : body.linkedinUrl
    }
    // Twitter
    if (body.twitter !== undefined) {
      updateData.twitterHandle = Array.isArray(body.twitter) ? body.twitter[0] : body.twitter
    }
    if (body.twitterHandle !== undefined) {
      updateData.twitterHandle = Array.isArray(body.twitterHandle) ? body.twitterHandle[0] : body.twitterHandle
    }
    // Website
    if (body.website !== undefined) {
      updateData.personalWebsite = Array.isArray(body.website) ? body.website[0] : body.website
    }
    if (body.personalWebsite !== undefined) {
      updateData.personalWebsite = Array.isArray(body.personalWebsite) ? body.personalWebsite[0] : body.personalWebsite
    }

    // 4. Update the analyst
    const { data: updatedAnalyst, error: updateError } = await supabase
      .from('analysts')
      .update(updateData)
      .eq('id', analystIdToUpdate)
      .select()
      .single()

    if (updateError || !updatedAnalyst) {
      console.error('Error updating analyst:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update analyst'
      }, { status: 500 })
    }

    // 5. Handle topics updates if provided
    if (body.topics && Array.isArray(body.topics)) {
      // Delete existing topics
      await supabase
        .from('covered_topics')
        .delete()
        .eq('analystId', analystIdToUpdate)

      // Insert new topics
      if (body.topics.length > 0) {
        const topicData = body.topics.map((topic: string) => ({
          analystId: analystIdToUpdate,
          topic,
          createdAt: new Date().toISOString()
        }))

        await supabase
          .from('covered_topics')
          .insert(topicData)
      }
    }

    // 6. Sync social handles if social media fields were updated
    const socialFields = ['twitter', 'linkedIn', 'website', 'twitterHandle', 'linkedinUrl', 'personalWebsite']
    const hasSocialUpdates = socialFields.some(field => body[field] !== undefined)
    
    if (hasSocialUpdates) {
      try {
        await syncAnalystSocialHandlesOnUpdate({
          id: updatedAnalyst.id,
          twitterHandle: (updatedAnalyst as any).twitterHandle || body.twitter || body.twitterHandle || null,
          linkedinUrl: (updatedAnalyst as any).linkedinUrl || body.linkedin || body.linkedinUrl || null,
          personalWebsite: (updatedAnalyst as any).personalWebsite || body.website || body.personalWebsite || null
        })
      } catch (syncError) {
        console.error('Error syncing social handles:', syncError)
        // Don't fail the analyst update, just log the error
      }
    }

    console.log(`📝 Updated analyst ${updatedAnalyst.firstName} ${updatedAnalyst.lastName} by user ${authUser.email}`)

    return NextResponse.json({
      success: true,
      message: 'Analyst updated successfully',
      data: updatedAnalyst
    })

  } catch (error) {
    console.error('Error updating analyst:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update analyst'
    }, { status: 500 })
  }
}
