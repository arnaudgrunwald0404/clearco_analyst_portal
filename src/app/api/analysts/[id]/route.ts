import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id: analystId } = await params
    const supabase = await createClient()

    // Check if analyst exists and is not already archived
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

  } catch (error) {
    console.error('Error archiving analyst:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to archive analyst'
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
    const { id: analystId } = await params
    const body = await request.json()
    const supabase = await createClient()

    // Check if analyst exists
    const { data: existingAnalyst } = await supabase
      .from('analysts')
      .select('id, firstName, lastName')
      .eq('id', analystId)
      .single()

    if (!existingAnalyst) {
      return NextResponse.json({
        success: false,
        error: 'Analyst not found'
      }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    // Map the allowed fields
    const allowedFields = [
      'firstName', 'lastName', 'email', 'company', 'title', 'bio',
      'profileImageUrl', 'influence', 'relationshipHealth', 'status',
      'lastContactDate', 'keyThemes'
    ]

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    })

    // Update the analyst
    const { data: updatedAnalyst, error: updateError } = await supabase
      .from('analysts')
      .update(updateData)
      .eq('id', analystId)
      .select()
      .single()

    if (updateError || !updatedAnalyst) {
      console.error('Error updating analyst:', updateError)
      return NextResponse.json({
        success: false,
        error: 'Failed to update analyst'
      }, { status: 500 })
    }

    // Handle topics updates if provided
    if (body.topics && Array.isArray(body.topics)) {
      // Delete existing topics
      await supabase
        .from('covered_topics')
        .delete()
        .eq('analystId', analystId)

      // Insert new topics
      if (body.topics.length > 0) {
        const topicData = body.topics.map((topic: string) => ({
          analystId,
          topic,
          createdAt: new Date().toISOString()
        }))

        await supabase
          .from('covered_topics')
          .insert(topicData)
      }
    }

    console.log(`📝 Updated analyst ${updatedAnalyst.firstName} ${updatedAnalyst.lastName}`)

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
