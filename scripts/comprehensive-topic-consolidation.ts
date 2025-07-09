#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const CLEARCOMPANY_CORE_TOPICS = [
  'Sourcing',
  'CRM', 
  'Candidate relationship management',
  'ATS',
  'Onboarding',
  'Background check',
  'Recruiting as a whole',
  'Talent management',
  'Performance management',
  'Learning management systems',
  'Compensation management',
  'People analytics'
]

async function comprehensiveTopicConsolidation() {
  try {
    console.log('🔄 Starting comprehensive topic consolidation...')

    // Get all analyst covered topics
    const analystCoveredTopics = await prisma.analystCoveredTopic.findMany({
      include: {
        analyst: {
          select: {
            firstName: true,
            lastName: true,
            company: true
          }
        }
      }
    })

    const allAnalystTopics = [...new Set(analystCoveredTopics.map(e => e.topic))]
    console.log(`📊 Found ${allAnalystTopics.length} unique analyst topics`)

    // Call GPT for comprehensive analysis
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
            content: `You are an expert at consolidating HR technology topics. Your task:
1. Identify duplicates, similar topics, and consolidation opportunities
2. Ensure ClearCompany's core topics are preserved or properly represented
3. Create a simplified, strategic topic list that covers all important areas
4. Aim to reduce from ~90+ topics to 25-35 strategic topics

Respond ONLY with valid JSON in this exact format:
{
  "consolidations": [
    {
      "action": "consolidate",
      "originalTopics": ["topic1", "topic2", "topic3"],
      "newTopic": "consolidated topic name",
      "reasoning": "explanation"
    }
  ],
  "finalTopics": ["final list of all simplified topics including core topics"]
}`
          },
          {
            role: 'user',
            content: `CLEARCOMPANY CORE TOPICS (must be included):
${CLEARCOMPANY_CORE_TOPICS.map(t => `- ${t}`).join('\n')}

ALL ANALYST TOPICS TO CONSOLIDATE:
${allAnalystTopics.map(t => `- ${t}`).join('\n')}

Please consolidate these into 25-35 strategic topics, ensuring all ClearCompany core topics are represented.`
          }
        ],
        temperature: 0.2,
        max_tokens: 3000
      })
    })

    if (!gptResponse.ok) {
      throw new Error(`GPT API error: ${gptResponse.status} ${gptResponse.statusText}`)
    }

    const gptData = await gptResponse.json()
    const content = gptData.choices[0].message.content.trim()
    
    console.log('🔄 Parsing GPT response...')
    console.log('Raw GPT response:', content)

    let parsedResponse
    try {
      // Try to extract JSON if wrapped in markdown
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content
      parsedResponse = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse GPT response:', parseError)
      console.log('Response content:', content)
      throw new Error('Invalid JSON response from GPT')
    }

    const { consolidations, finalTopics } = parsedResponse

    console.log(`\n📋 CONSOLIDATION PLAN:`)
    console.log(`   Original topics: ${allAnalystTopics.length}`)
    console.log(`   Final topics: ${finalTopics.length}`)
    console.log(`   Reduction: ${allAnalystTopics.length - finalTopics.length} topics`)

    // Create mapping table
    const mapping = {}
    consolidations.forEach(consolidation => {
      consolidation.originalTopics.forEach(original => {
        mapping[original] = consolidation.newTopic
      })
    })

    // Add unmapped topics (they map to themselves)
    allAnalystTopics.forEach(topic => {
      if (!mapping[topic]) {
        const finalTopic = finalTopics.find(ft => 
          ft.toLowerCase() === topic.toLowerCase() || 
          topic.toLowerCase().includes(ft.toLowerCase()) ||
          ft.toLowerCase().includes(topic.toLowerCase())
        )
        if (finalTopic) {
          mapping[topic] = finalTopic
        }
      }
    })

    console.log('\n🗺️  TOPIC MAPPING:')
    console.table(mapping)

    // Update database
    console.log('\n🛠  Updating database...')
    
    // Clear existing additional topics
    await prisma.predefinedTopic.deleteMany({
      where: { category: 'ADDITIONAL' }
    })

    // Get max core topic order
    const coreTopics = await prisma.predefinedTopic.findMany({
      where: { category: 'CORE' },
      orderBy: { order: 'desc' },
      take: 1
    })
    const maxCoreOrder = coreTopics.length > 0 ? coreTopics[0].order : 0

    // Create new additional topics from final list (excluding core topics)
    const additionalTopicsToCreate = finalTopics.filter(topic => 
      !CLEARCOMPANY_CORE_TOPICS.includes(topic)
    )

    const newTopics = await Promise.all(
      additionalTopicsToCreate.map((topicName, index) =>
        prisma.predefinedTopic.create({
          data: {
            name: topicName,
            category: 'ADDITIONAL',
            order: maxCoreOrder + index + 1,
            description: `Consolidated topic covering: ${Object.keys(mapping).filter(k => mapping[k] === topicName).join(', ')}`
          }
        })
      )
    )

    // Update analyst covered topics based on mapping
    console.log('\n🔄 Updating analyst topic assignments...')
    let updatedCount = 0
    
    for (const analystTopic of analystCoveredTopics) {
      const newTopicName = mapping[analystTopic.topic]
      if (newTopicName && newTopicName !== analystTopic.topic) {
        await prisma.analystCoveredTopic.update({
          where: { id: analystTopic.id },
          data: { topic: newTopicName }
        })
        updatedCount++
      }
    }

    console.log(`\n✅ CONSOLIDATION COMPLETE!`)
    console.log(`   📊 Created ${newTopics.length} new additional topics`)
    console.log(`   🔄 Updated ${updatedCount} analyst topic assignments`)
    console.log(`   📉 Reduced from ${allAnalystTopics.length} to ${finalTopics.length} topics`)
    console.log(`   💾 Total topics now: ${CLEARCOMPANY_CORE_TOPICS.length} core + ${newTopics.length} additional = ${CLEARCOMPANY_CORE_TOPICS.length + newTopics.length}`)

    // Log consolidation details
    console.log('\n📋 CONSOLIDATION DETAILS:')
    consolidations.forEach((consolidation, index) => {
      console.log(`${index + 1}. ${consolidation.action.toUpperCase()}: ${consolidation.originalTopics.join(', ')} → ${consolidation.newTopic}`)
      console.log(`   Reason: ${consolidation.reasoning}\n`)
    })

  } catch (error) {
    console.error('❌ Error in comprehensive topic consolidation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

comprehensiveTopicConsolidation()
