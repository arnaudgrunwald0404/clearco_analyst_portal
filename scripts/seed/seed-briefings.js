const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seedBriefings() {
  try {
    // Get existing analysts
    const analysts = await prisma.analyst.findMany()
    
    if (analysts.length === 0) {
      console.log('No analysts found. Please run the main seeder first.')
      return
    }

    console.log('Seeding briefings...')

    // Create sample briefings
    const briefings = [
      {
        title: 'Q4 Strategic Platform Review',
        description: 'Quarterly review of our platform strategy and roadmap with key analysts',
        scheduledAt: new Date('2024-12-15T19:00:00Z'), // 2:00 PM EST
        status: 'SCHEDULED',
        agenda: [
          'AI capabilities roadmap Q1-Q2 2025',
          'Competitive positioning discussion',
          'Customer feedback integration',
          'Partnership strategy overview'
        ],
        duration: 60,
        attendeeEmails: [
          analysts[0]?.email,
          'aj.rodriguez@hrtech.com',
          'jennifer.park@hrtech.com'
        ].filter(Boolean),
        analystIds: [analysts[0]?.id].filter(Boolean)
      },
      {
        title: 'Product Demo & Feedback Session',
        description: 'Demonstration of new analytics features with analyst feedback',
        scheduledAt: new Date('2024-11-28T15:00:00Z'), // 10:00 AM EST
        completedAt: new Date('2024-11-28T15:45:00Z'),
        status: 'COMPLETED',
        agenda: [
          'New analytics dashboard walkthrough',
          'AI-powered insights demonstration', 
          'Integration capabilities overview',
          'Q&A and feedback collection'
        ],
        notes: 'Great session! Sarah was particularly interested in our predictive analytics capabilities. She mentioned this aligns well with Gartner\'s research on the future of HR analytics.',
        outcomes: [
          'Positive feedback on new dashboard UI',
          'Interest in API integration capabilities',
          'Request for ROI case studies'
        ],
        followUpActions: [
          'Send detailed technical specs for API integration',
          'Follow up with ROI case studies',
          'Schedule follow-up demo for extended team'
        ],
        duration: 45,
        recordingUrl: 'https://zoom.us/rec/share/abc123',
        transcript: `[00:00] AJ Rodriguez: Good morning everyone, thank you for joining our product demo session. Today we'll be walking through our new analytics dashboard and AI-powered insights features.

[00:02] Sarah Chen: Thanks for having me, AJ. I'm excited to see what you've been working on.

[00:05] AJ Rodriguez: Let me start by sharing my screen. As you can see, we've completely redesigned our dashboard to provide more intuitive access to key metrics...

[00:15] Sarah Chen: I really like the clean interface. The data visualization is much more readable than what I typically see in HR tech platforms.

[00:20] Mark Thompson: Sarah, one thing I wanted to highlight is our new predictive analytics engine. It can forecast turnover risk with 85% accuracy.

[00:25] Sarah Chen: That's impressive. What data sources are you pulling from for these predictions?

[00:27] Mark Thompson: We integrate with HRIS systems, performance management platforms, and even communication tools to analyze sentiment and engagement patterns.

[00:35] Sarah Chen: This aligns perfectly with the research we're doing on the future of HR analytics. The ability to predict and prevent turnover is becoming critical for organizations.

[00:40] AJ Rodriguez: Exactly. We're also working on expanding this to include promotion readiness and skills gap analysis.

[00:45] Sarah Chen: Very interesting. I'd love to see some ROI case studies from your existing customers using these features.`,
        attendeeEmails: [
          analysts[0]?.email,
          'aj.rodriguez@hrtech.com',
          'mark.thompson@hrtech.com'
        ].filter(Boolean),
        analystIds: [analysts[0]?.id].filter(Boolean)
      },
      {
        title: 'Market Research Collaboration',
        description: 'Collaborative session on HR tech market trends and sizing',
        scheduledAt: new Date('2024-11-15T20:00:00Z'), // 3:00 PM EST
        completedAt: new Date('2024-11-15T20:30:00Z'),
        status: 'COMPLETED',
        agenda: [
          'Industry trends validation',
          'Market sizing discussion',
          'Competitive landscape review',
          'Research methodology alignment'
        ],
        notes: 'Valuable insights shared on market trends. Sarah provided perspective on how enterprises are evaluating HR tech solutions. Agreed to collaborate on upcoming research paper.',
        outcomes: [
          'Validated market size estimates',
          'Identified key competitive differentiators',
          'Established research partnership'
        ],
        followUpActions: [
          'Share market data for Q3 analysis',
          'Review draft research methodology',
          'Schedule quarterly research sync'
        ],
        duration: 30,
        recordingUrl: 'https://zoom.us/rec/share/def456',
        attendeeEmails: [
          analysts[0]?.email,
          'aj.rodriguez@hrtech.com',
          'lisa.wang@hrtech.com'
        ].filter(Boolean),
        analystIds: [analysts[0]?.id].filter(Boolean)
      }
    ]

    // Add briefings with multiple analysts if we have enough
    if (analysts.length >= 2) {
      briefings.push({
        title: 'Multi-Analyst Innovation Strategy Session',
        description: 'Strategic discussion on innovation roadmap with multiple analyst perspectives',
        scheduledAt: new Date('2024-10-20T18:00:00Z'), // 1:00 PM EST
        completedAt: new Date('2024-10-20T19:15:00Z'),
        status: 'COMPLETED',
        agenda: [
          'Long-term product vision (2025-2027)',
          'Emerging technology evaluation',
          'Industry disruption scenarios',
          'Investment prioritization framework'
        ],
        notes: 'Deep dive into long-term strategy with multiple analyst perspectives. Great collaboration between different analyst viewpoints on AI implementation and market evolution.',
        outcomes: [
          'Aligned on 3-year product vision',
          'Identified key technology investments',
          'Established innovation partnership framework'
        ],
        followUpActions: [
          'Develop AI ethics framework document',
          'Create technology adoption timeline',
          'Explore co-authoring opportunity'
        ],
        duration: 75,
        recordingUrl: 'https://zoom.us/rec/share/ghi789',
        transcript: `[00:00] AJ Rodriguez: Welcome everyone to our innovation strategy session. We have both Sarah from Gartner and Michael from Forrester joining us today.

[00:05] Sarah Chen: Thanks AJ. It's great to be here with Michael as well. Different analyst perspectives should make for a rich discussion.

[00:08] Michael Foster: Absolutely, Sarah. I'm looking forward to hearing both your roadmap and getting Sarah's take on the market evolution.

[00:15] David Kim: Let me start with our 3-year vision. We're seeing AI not just as a feature, but as the foundation for a completely new category of HR technology...

[00:25] Sarah Chen: That's an interesting positioning, David. From our research, we're seeing similar themes, but the key differentiator will be ethical AI implementation.

[00:30] Michael Foster: I agree with Sarah. The compliance and ethics aspect is going to be critical, especially in regulated industries.

[00:40] AJ Rodriguez: That's exactly why we're planning to develop a comprehensive AI ethics framework as part of our core platform.

[00:45] Sarah Chen: That's smart. We'd be interested in collaborating on thought leadership around ethical AI in HR.

[00:50] Michael Foster: Count Forrester in as well. This could be a multi-firm research initiative.`,
        attendeeEmails: [
          analysts[0]?.email,
          analysts[1]?.email,
          'aj.rodriguez@hrtech.com',
          'david.kim@hrtech.com'
        ].filter(Boolean),
        analystIds: [analysts[0]?.id, analysts[1]?.id].filter(Boolean)
      })
    }

    for (const briefingData of briefings) {
      const { analystIds, attendeeEmails, agenda, outcomes, followUpActions, ...briefingFields } = briefingData
      
      const briefing = await prisma.briefing.create({
        data: {
          ...briefingFields,
          agenda: JSON.stringify(agenda),
          outcomes: outcomes ? JSON.stringify(outcomes) : null,
          followUpActions: followUpActions ? JSON.stringify(followUpActions) : null,
          attendeeEmails: JSON.stringify(attendeeEmails),
          analysts: {
            create: analystIds.map((analystId, index) => ({
              analystId,
              role: index === 0 ? 'PRIMARY' : 'SECONDARY'
            }))
          }
        },
        include: {
          analysts: {
            include: {
              analyst: true
            }
          }
        }
      })

      // Generate AI summary for completed briefings with transcripts
      if (briefing.transcript && briefing.status === 'COMPLETED') {
        const aiSummary = generateMockAISummary(briefing.title, briefing.transcript)
        await prisma.briefing.update({
          where: { id: briefing.id },
          data: {
            ai_summary: aiSummary.summary
          }
        })
      }

      console.log(`✓ Created briefing: ${briefing.title}`)
    }

    console.log('✅ Briefings seeded successfully!')
    
  } catch (error) {
    console.error('Error seeding briefings:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

function generateMockAISummary(title, transcript) {
  // Mock AI summary generation based on title and transcript content
  if (title.includes('Demo')) {
    return {
      summary: `**TLDR:** Successful product demonstration showcasing new analytics dashboard and AI-powered insights features. Analyst expressed strong interest in predictive analytics capabilities and alignment with market research.

**Key Points:**
• New dashboard interface received positive feedback for usability
• Predictive analytics engine demonstrates 85% accuracy in turnover forecasting
• Integration capabilities with HRIS and performance management systems highlighted
• Strong alignment with analyst research on future of HR analytics`,
      followUps: 'Send detailed technical specs for API integration\n• Follow up with ROI case studies\n• Schedule follow-up demo for extended team'
    }
  } else if (title.includes('Research')) {
    return {
      summary: `**TLDR:** Collaborative market research session validating industry trends and market sizing. Established strong research partnership for ongoing market intelligence.

**Key Points:**
• Market size estimates validated through analyst perspective
• Competitive landscape analysis identified key differentiators  
• Research methodology aligned for future collaborations
• Partnership framework established for ongoing intelligence sharing`,
      followUps: 'Share Q3 market data for analysis\n• Review draft research methodology\n• Schedule quarterly research sync meetings'
    }
  } else if (title.includes('Innovation') || title.includes('Strategy')) {
    return {
      summary: `**TLDR:** Strategic innovation session with multiple analyst perspectives on long-term product vision and technology roadmap. Strong alignment on AI ethics and market evolution.

**Key Points:**
• 3-year product vision aligned with market evolution trends
• AI ethics framework identified as critical competitive differentiator
• Multi-analyst perspective provided comprehensive market intelligence
• Investment prioritization framework established for emerging technologies`,
      followUps: 'Develop comprehensive AI ethics framework\n• Create detailed technology adoption timeline\n• Explore co-authoring opportunities for thought leadership'
    }
  } else {
    return {
      summary: `**TLDR:** Productive analyst briefing session covering strategic initiatives and product roadmap alignment.

**Key Points:**
• Strategic alignment on key initiatives
• Valuable analyst perspective on market trends
• Strong foundation for ongoing collaboration`,
      followUps: 'Follow up on discussed action items\n• Schedule next quarterly briefing\n• Share relevant research and updates'
    }
  }
}

if (require.main === module) {
  seedBriefings()
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}

module.exports = { seedBriefings }
