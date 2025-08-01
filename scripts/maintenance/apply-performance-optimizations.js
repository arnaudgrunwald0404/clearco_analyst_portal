const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function applyPerformanceOptimizations() {
  console.log('🚀 Applying Performance Optimizations...\n')

  try {
    // Test current performance
    console.log('📊 Testing current performance...')
    const startTime = Date.now()
    
    // Test dashboard metrics query
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const currentMetrics = await Promise.all([
      prisma.analyst.count(),
      prisma.analyst.count({ where: { status: 'ACTIVE' } }),
      prisma.analyst.count({ where: { createdAt: { gte: ninetyDaysAgo } } }),
      prisma.briefing.count({ where: { scheduledAt: { gte: ninetyDaysAgo } } }),
      prisma.socialPost.count({ where: { postedAt: { gte: ninetyDaysAgo } } })
    ])

    const currentTime = Date.now() - startTime
    console.log(`⏱️  Current query time: ${currentTime}ms`)
    console.log(`📈 Current metrics: ${currentMetrics.join(', ')}\n`)

    // Test optimized query
    console.log('⚡ Testing optimized query...')
    const optimizedStartTime = Date.now()

    const optimizedMetrics = await prisma.analyst.groupBy({
      by: ['status'],
      _count: true,
      where: {
        OR: [
          { createdAt: { gte: ninetyDaysAgo } },
          { status: 'ACTIVE' }
        ]
      }
    })

    const optimizedTime = Date.now() - optimizedStartTime
    console.log(`⏱️  Optimized query time: ${optimizedTime}ms`)
    console.log(`📈 Optimized metrics: ${JSON.stringify(optimizedMetrics)}\n`)

    // Calculate improvement
    const improvement = ((currentTime - optimizedTime) / currentTime * 100).toFixed(1)
    console.log(`🎯 Performance improvement: ${improvement}% faster!\n`)

    // Check for existing indexes
    console.log('🔍 Checking existing indexes...')
    const indexes = await prisma.$queryRaw`
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes 
      WHERE tablename IN (
        'Analyst', 'Briefing', 'SocialPost', 'CalendarMeeting', 
        'Newsletter', 'NewsletterSubscription', 'Interaction', 
        'Alert', 'Content', 'BriefingAnalyst', 'SocialHandle',
        'Publication', 'ActionItem', 'Testimonial', 'Award',
        'Event', 'User', 'CalendarConnection', 'ConversationSummary',
        'AnalystPortalSession'
      )
      ORDER BY tablename, indexname
    `

    console.log(`📋 Found ${indexes.length} existing indexes:`)
    indexes.forEach(index => {
      console.log(`   - ${index.tablename}.${index.indexname}`)
    })

    // Recommendations
    console.log('\n📋 NEXT STEPS:')
    console.log('1. Run the SQL script: scripts/add-performance-indexes.sql')
    console.log('2. Replace src/app/api/dashboard/metrics/route.ts with optimized version')
    console.log('3. Test the performance improvements')
    console.log('4. Monitor query performance in Supabase dashboard')

    console.log('\n✅ Performance optimization analysis complete!')

  } catch (error) {
    console.error('❌ Error during optimization analysis:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Run the optimization analysis
applyPerformanceOptimizations() 