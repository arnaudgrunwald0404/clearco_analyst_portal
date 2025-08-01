import { PrismaClient } from '@prisma/client'
import fetch from 'node-fetch'

const prisma = new PrismaClient()
const OPENAI_API_KEY = process.env.OPENAI_API_KEY

async function gatherAndSimplifyTopics() {
  try {
    console.log('🔄 Gathering all topics across analysts...')

    // Fetch all existing topics
    const topics = await prisma.predefinedTopic.findMany({
      orderBy: { category: 'asc' }
    })

    const coreTopics = topics.filter(t => t.category === 'CORE').map(t => t.name)
    const additionalTopics = topics.filter(t => t.category === 'ADDITIONAL').map(t => t.name)

    console.log('🔄 Sending topics to GPT for analysis...')

    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
content: `You are an intelligent assistant tasked with consolidating and simplifying topic lists. Please:
1. Identify duplicates and similar topics.
2. Suggest broader, unified categories while preserving necessary specifics where valuable.
3. Ensure core topics are always included or justified if omitted.
Respond with this JSON format:
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
            content: `CORE TOPICS:
${coreTopics.join('\n')}
ADDITIONAL TOPICS:
${additionalTopics.join('\n')}`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000
      })
    })

    if (!gptResponse.ok) {
      throw new Error(`GPT request failed: ${gptResponse.status}`)
    }

    const gptData = await gptResponse.json()
    const content = gptData.choices[0].message.content

    console.log('🔄 Parsing GPT response...')

    const { suggestions, simplifiedTopics } = JSON.parse(content)

    // Ensure core topics are included in the simplified list
    coreTopics.forEach(coreTopic => {
      if (!simplifiedTopics.includes(coreTopic)) {
        simplifiedTopics.push(coreTopic)
      }
    })

    console.log('🛠 Creating mapping table and updating topics...')

    // Create a mapping table
    const mapping = suggestions.reduce((acc, s) => {
      s.originalTopics.forEach(original => {
        acc[original] = s.newTopic
      })
      return acc
    }, {})

    // Update topics
    await prisma.predefinedTopic.deleteMany({
      where: { category: 'ADDITIONAL' }
    })

    await Promise.all(simplifiedTopics.map((name, index) =>
      prisma.predefinedTopic.create({
        data: { name, category: 'ADDITIONAL', order: index + 1 }
      })
    ))

    console.log('✅ Topic simplification completed.')
    console.table(mapping)
    console.log('📝 Documentation written.')
  } catch (error) {
    console.error('Error in topic simplification process:', error)
  } finally {
    await prisma.$disconnect()
  }
}

gatherAndSimplifyTopics().catch(console.error)
