import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Placeholder implementation
    return NextResponse.json({
      success: true,
      message: 'Topics simplify endpoint - to be implemented'
    })
  } catch (error) {
    console.error('Error in topics simplify:', error)
    return NextResponse.json(
      { success: false, error: 'Topics simplify not implemented yet' },
      { status: 501 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { simplifiedTopics, applyToAnalysts = false } = body

    if (!simplifiedTopics || !Array.isArray(simplifiedTopics)) {
      return NextResponse.json(
        { error: 'Simplified topics array is required' },
        { status: 400 }
      )
    }

    // Get existing topics
    const existingTopics = await prisma.predefinedTopic.findMany({
      orderBy: [
        { category: 'asc' },
        { order: 'asc' }
      ]
    })

    const coreTopics = existingTopics.filter(t => t.category === 'CORE')

    // Delete all additional topics
    await prisma.predefinedTopic.deleteMany({
      where: {
        category: 'ADDITIONAL'
      }
    })

    // Create new additional topics from simplified list
    const maxCoreOrder = Math.max(...coreTopics.map(t => t.order), 0)
    
    const newTopics = await Promise.all(
      simplifiedTopics.map((topicName: string, index: number) => 
        prisma.predefinedTopic.create({
          data: {
            name: topicName.trim(),
            category: 'ADDITIONAL',
            order: maxCoreOrder + index + 1
          }
        })
      )
    )

    let updatedAnalystsCount = 0

    // If requested, apply topic consolidation to existing analysts to remove duplicates
    if (applyToAnalysts) {
      const { consolidateTopics } = await import('@/lib/topic-consolidation')
      
      // Get all analysts with their covered topics
      const analysts = await prisma.analyst.findMany({
        select: {
          id: true,
          firstName: true,
          lastName: true,
          coveredTopics: {
            select: { topic: true }
          }
        },
        where: {
          coveredTopics: {
            some: {}
          }
        }
      })

      // Apply consolidation and deduplication to each analyst
      for (const analyst of analysts) {
        if (analyst.coveredTopics && Array.isArray(analyst.coveredTopics)) {
          const originalTopics = analyst.coveredTopics.map(t => t.topic)
          const consolidatedTopics = consolidateTopics(originalTopics)
          
          // Only update if there's a difference (including duplicates removed)
          if (JSON.stringify(originalTopics.sort()) !== JSON.stringify(consolidatedTopics.sort())) {
            // Delete existing topics
            await prisma.analystCoveredTopic.deleteMany({
              where: { analystId: analyst.id }
            })
            
            // Insert consolidated and deduplicated topics
            const topicInserts = consolidatedTopics.map(topic => ({
              analystId: analyst.id,
              topic: topic
            }))
            
            await prisma.analystCoveredTopic.createMany({
              data: topicInserts
            })
            
            updatedAnalystsCount++
            console.log(`✅ Deduplicated topics for ${analyst.firstName} ${analyst.lastName}: ${originalTopics.length} → ${consolidatedTopics.length} topics`)
          }
        }
      }
    }

    console.log(`✅ Topic simplification applied: ${newTopics.length} additional topics created`)
    if (applyToAnalysts) {
      console.log(`✅ Updated ${updatedAnalystsCount} analysts with deduplicated topics`)
    }

    return NextResponse.json({
      message: `Successfully applied topic simplification. Created ${newTopics.length} simplified additional topics.${applyToAnalysts ? ` Updated ${updatedAnalystsCount} analysts with deduplicated topics.` : ''}`,
      newTopicsCount: newTopics.length,
      coreTopicsPreserved: coreTopics.length,
      updatedAnalystsCount: applyToAnalysts ? updatedAnalystsCount : 0
    })

  } catch (error) {
    console.error('Error applying topic simplification:', error)
    return NextResponse.json(
      { 
        error: 'Failed to apply topic simplification',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}
