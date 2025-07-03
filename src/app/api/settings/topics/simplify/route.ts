import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Get all existing topics (both CORE and ADDITIONAL)
    const existingTopics = await prisma.predefinedTopic.findMany({
      orderBy: [
        { category: 'asc' }, // CORE topics first
        { order: 'asc' }
      ]
    })

    const coreTopics = existingTopics.filter(t => t.category === 'CORE')
    const additionalTopics = existingTopics.filter(t => t.category === 'ADDITIONAL')

    // Prepare topic names for GPT analysis
    const additionalTopicNames = additionalTopics.map(t => t.name)
    const coreTopicNames = coreTopics.map(t => t.name)

    if (additionalTopicNames.length === 0) {
      return NextResponse.json({
        message: 'No additional topics found to simplify',
        suggestions: [],
        stats: {
          originalCount: additionalTopicNames.length,
          suggestedCount: 0,
          potentialReduction: 0
        }
      })
    }

    // Call GPT for topic simplification
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert at simplifying and consolidating topic lists for analyst tracking systems. Your goal is to:
1. Identify duplicate, similar, or overly specific topics that can be consolidated
2. Suggest broader, more useful categories while preserving specificity where valuable
3. Respect core topics - these should NEVER be modified or consolidated
4. Focus only on simplifying additional topics
5. Ensure the simplified list covers the same conceptual space but with fewer, more strategic topics

Respond with a JSON object containing:
{
  "suggestions": [
    {
      "action": "consolidate|remove|rename",
      "originalTopics": ["topic1", "topic2"],
      "newTopic": "consolidated topic name",
      "reasoning": "explanation of why this consolidation makes sense"
    }
  ],
  "simplifiedTopics": ["final list of simplified topic names"]
}`
          },
          {
            role: 'user',
            content: `Please analyze and simplify this list of additional topics while respecting the core topics.

CORE TOPICS (do not modify these):
${coreTopicNames.map(name => `- ${name}`).join('\n')}

ADDITIONAL TOPICS (simplify these):
${additionalTopicNames.map(name => `- ${name}`).join('\n')}

Please provide consolidation suggestions that would make this list more strategic and manageable while maintaining comprehensive coverage.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!gptResponse.ok) {
      throw new Error(`GPT API error: ${gptResponse.status}`)
    }

    const gptData = await gptResponse.json()
    let suggestions, simplifiedTopics

    try {
      const content = gptData.choices[0].message.content
      const parsed = JSON.parse(content)
      suggestions = parsed.suggestions || []
      simplifiedTopics = parsed.simplifiedTopics || []
    } catch (parseError) {
      console.error('Error parsing GPT response:', parseError)
      return NextResponse.json(
        { error: 'Failed to parse topic simplification suggestions' },
        { status: 500 }
      )
    }

    // Calculate statistics
    const stats = {
      originalCount: additionalTopicNames.length,
      suggestedCount: simplifiedTopics.length,
      potentialReduction: additionalTopicNames.length - simplifiedTopics.length,
      reductionPercentage: Math.round(((additionalTopicNames.length - simplifiedTopics.length) / additionalTopicNames.length) * 100)
    }

    return NextResponse.json({
      suggestions,
      simplifiedTopics,
      stats,
      message: `Analysis complete. Found ${suggestions.length} consolidation opportunities with potential reduction of ${stats.potentialReduction} topics (${stats.reductionPercentage}%).`
    })

  } catch (error) {
    console.error('Error in topic simplification:', error)
    return NextResponse.json(
      { 
        error: 'Failed to simplify topics',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { simplifiedTopics } = body

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

    console.log(`✅ Topic simplification applied: ${newTopics.length} additional topics created`)

    return NextResponse.json({
      message: `Successfully applied topic simplification. Created ${newTopics.length} simplified additional topics.`,
      newTopicsCount: newTopics.length,
      coreTopicsPreserved: coreTopics.length
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
