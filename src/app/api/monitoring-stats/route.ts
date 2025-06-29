import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const type = searchParams.get('type') // Filter by monitoring type
    const hours = parseInt(searchParams.get('hours') || '24') // Default last 24 hours
    const limit = parseInt(searchParams.get('limit') || '100') // Default limit
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000)
    
    // Build where clause
    const whereClause: any = {
      timestamp: {
        gte: since
      }
    }
    
    if (type) {
      whereClause.type = type
    }
    
    // Get monitoring statistics
    const stats = await prisma.$queryRaw`
      SELECT 
        id,
        timestamp,
        type,
        analysts_checked,
        posts_found,
        posts_stored,
        new_mentions,
        high_relevance_posts,
        error_count,
        errors,
        hostname,
        created_at
      FROM monitoring_stats 
      WHERE timestamp >= ${since}
      ${type ? `AND type = ${type}` : ''}
      ORDER BY timestamp DESC
      LIMIT ${limit}
    `
    
    // Get summary statistics
    const summary = await prisma.$queryRaw`
      SELECT 
        COUNT(*) as total_runs,
        SUM(analysts_checked) as total_analysts_checked,
        SUM(posts_found) as total_posts_found,
        SUM(posts_stored) as total_posts_stored,
        SUM(new_mentions) as total_new_mentions,
        SUM(high_relevance_posts) as total_high_relevance_posts,
        SUM(error_count) as total_errors,
        AVG(posts_found) as avg_posts_per_run,
        AVG(posts_stored) as avg_stored_per_run,
        MIN(timestamp) as earliest_run,
        MAX(timestamp) as latest_run
      FROM monitoring_stats 
      WHERE timestamp >= ${since}
      ${type ? `AND type = ${type}` : ''}
    `
    
    // Get hourly breakdown for the last 24 hours
    const hourlyBreakdown = await prisma.$queryRaw`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
        COUNT(*) as runs,
        SUM(posts_found) as posts_found,
        SUM(posts_stored) as posts_stored,
        SUM(new_mentions) as new_mentions,
        SUM(error_count) as errors
      FROM monitoring_stats 
      WHERE timestamp >= ${new Date(Date.now() - 24 * 60 * 60 * 1000)}
      GROUP BY strftime('%Y-%m-%d %H', timestamp)
      ORDER BY hour DESC
      LIMIT 24
    `
    
    return NextResponse.json({
      success: true,
      data: {
        stats: stats || [],
        summary: Array.isArray(summary) ? summary[0] : summary,
        hourlyBreakdown: hourlyBreakdown || []
      },
      meta: {
        hours_requested: hours,
        type_filter: type,
        limit,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Monitoring stats API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      type, 
      analystsChecked, 
      postsFound, 
      postsStored, 
      newMentions, 
      highRelevancePosts, 
      errors 
    } = body
    
    if (!type) {
      return NextResponse.json({
        success: false,
        error: 'Type is required'
      }, { status: 400 })
    }
    
    const monitoringRecord = {
      id: `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      type,
      analystsChecked: analystsChecked || 0,
      postsFound: postsFound || 0,
      postsStored: postsStored || 0,
      newMentions: newMentions || 0,
      highRelevancePosts: highRelevancePosts || 0,
      errorCount: Array.isArray(errors) ? errors.length : 0,
      errors: Array.isArray(errors) ? JSON.stringify(errors) : null,
      hostname: process.env.HOSTNAME || 'unknown'
    }
    
    await prisma.$executeRaw`
      INSERT INTO monitoring_stats (
        id, timestamp, type, analysts_checked, posts_found, posts_stored, 
        new_mentions, high_relevance_posts, error_count, errors, hostname
      ) VALUES (
        ${monitoringRecord.id}, ${monitoringRecord.timestamp}, ${monitoringRecord.type},
        ${monitoringRecord.analystsChecked}, ${monitoringRecord.postsFound}, ${monitoringRecord.postsStored},
        ${monitoringRecord.newMentions}, ${monitoringRecord.highRelevancePosts}, 
        ${monitoringRecord.errorCount}, ${monitoringRecord.errors}, ${monitoringRecord.hostname}
      )
    `
    
    return NextResponse.json({
      success: true,
      message: 'Monitoring statistics stored successfully',
      data: {
        id: monitoringRecord.id,
        timestamp: monitoringRecord.timestamp
      }
    })
  } catch (error) {
    console.error('Store monitoring stats error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
