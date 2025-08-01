import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Cache duration in seconds
const CACHE_DURATION = 300; // 5 minutes
let metricsCache: any = null;
let cacheTimestamp: number = 0;

export async function GET(request: NextRequest) {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (metricsCache && (now - cacheTimestamp) < (CACHE_DURATION * 1000)) {
      return NextResponse.json({
        success: true,
        data: metricsCache,
        cached: true,
        cacheAge: Math.floor((now - cacheTimestamp) / 1000)
      });
    }

    // Fetch fresh data with optimized queries
    const [
      analystStats,
      contentStats,
      briefingStats,
      newsletterStats,
      interactionStats,
      calendarStats,
      alertStats,
      socialStats,
      subscriptionStats
    ] = await Promise.all([
      // Analyst stats (optimized)
      prisma.analyst.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      
      // Content stats
      prisma.content.groupBy({
        by: ['isPublished'],
        _count: { _all: true }
      }),
      
      // Briefing stats
      prisma.briefing.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      
      // Newsletter stats
      prisma.newsletter.groupBy({
        by: ['status'],
        _count: { _all: true }
      }),
      
      // Interaction stats
      prisma.interaction.aggregate({
        _count: { _all: true }
      }),
      
      // Calendar meeting stats
      prisma.calendarMeeting.groupBy({
        by: ['isAnalystMeeting'],
        _count: { _all: true }
      }),
      
      // Alert stats
      prisma.alert.groupBy({
        by: ['isRead'],
        _count: { _all: true }
      }),
      
      // Social post stats
      prisma.socialPost.groupBy({
        by: ['isRelevant'],
        _count: { _all: true }
      }),
      
      // Newsletter subscription stats
      prisma.newsletterSubscription.aggregate({
        _count: { _all: true }
      })
    ]);

    // Process and format the data
    const processedData = {
      analysts: {
        total: analystStats.reduce((sum, stat) => sum + stat._count._all, 0),
        active: analystStats.find(s => s.status === 'ACTIVE')?._count._all || 0,
        inactive: analystStats.find(s => s.status === 'INACTIVE')?._count._all || 0,
        averageInfluence: 0 // Simplified for now
      },
      content: {
        total: contentStats.reduce((sum, stat) => sum + stat._count._all, 0),
        published: contentStats.find(s => s.isPublished === true)?._count._all || 0,
        draft: contentStats.find(s => s.isPublished === false)?._count._all || 0
      },
      briefings: {
        total: briefingStats.reduce((sum, stat) => sum + stat._count._all, 0),
        scheduled: briefingStats.find(s => s.status === 'SCHEDULED')?._count._all || 0,
        completed: briefingStats.find(s => s.status === 'COMPLETED')?._count._all || 0,
        cancelled: briefingStats.find(s => s.status === 'CANCELLED')?._count._all || 0
      },
      newsletters: {
        total: newsletterStats.reduce((sum, stat) => sum + stat._count._all, 0),
        sent: newsletterStats.find(s => s.status === 'SENT')?._count._all || 0,
        draft: newsletterStats.find(s => s.status === 'DRAFT')?._count._all || 0
      },
      interactions: {
        total: interactionStats._count._all || 0,
        averageEngagement: 0 // Simplified for now
      },
      calendar: {
        total: calendarStats.reduce((sum, stat) => sum + stat._count._all, 0),
        analystMeetings: calendarStats.find(s => s.isAnalystMeeting === true)?._count._all || 0,
        otherMeetings: calendarStats.find(s => s.isAnalystMeeting === false)?._count._all || 0
      },
      alerts: {
        total: alertStats.reduce((sum, stat) => sum + stat._count._all, 0),
        unread: alertStats.find(s => s.isRead === false)?._count._all || 0,
        read: alertStats.find(s => s.isRead === true)?._count._all || 0
      },
      social: {
        total: socialStats.reduce((sum, stat) => sum + stat._count._all, 0),
        relevant: socialStats.find(s => s.isRelevant === true)?._count._all || 0,
        irrelevant: socialStats.find(s => s.isRelevant === false)?._count._all || 0
      },
      subscriptions: {
        total: subscriptionStats._count._all || 0,
        totalOpened: 0, // Simplified for now
        totalClicked: 0  // Simplified for now
      }
    };

    // Update cache
    metricsCache = processedData;
    cacheTimestamp = now;

    return NextResponse.json({
      success: true,
      data: processedData,
      cached: false,
      cacheAge: 0
    });

  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard metrics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Cache invalidation endpoint
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    if (action === 'invalidate') {
      metricsCache = null;
      cacheTimestamp = 0;
      return NextResponse.json({ success: true, message: 'Cache invalidated' });
    }
    
    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 });
  }
} 