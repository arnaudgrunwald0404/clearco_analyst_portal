import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const modules = searchParams.get('modules')?.split(',').filter(Boolean) || []
    const pastQuarters = parseInt(searchParams.get('pastQuarters') || '2')
    const futureQuarters = parseInt(searchParams.get('futureQuarters') || '3')

    // Enhanced mock data with rich visual content and metadata
    // In a real implementation, this would fetch from your database
    const mockBoulders = [
      {
        id: '1',
        name: 'Enhanced Analytics Dashboard',
        alternate_name: 'Analytics 3.0',
        description: 'Comprehensive analytics and reporting improvements for better insights into talent acquisition and performance metrics',
        module: 'R&A',
        devRoadmap: 'Analytics',
        quarter: 'Q4 2024',
        release: 'Release 24.4',
        releaseDate: '2024-12-15',
        status: 'In Progress',
        statusComplete: false,
        boulder_file_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        cpo_take: 'This is our most requested feature from enterprise customers. The new dashboard will provide real-time insights and predictive analytics that will help our customers make data-driven hiring decisions. We\'re particularly excited about the AI-powered recommendations engine.',
        priority: 'High',
        effort: '8 weeks',
        team_size: 4,
        dependencies: ['Data Pipeline Upgrade', 'UI Framework 2.0']
      },
      {
        id: '2', 
        name: 'AI-Powered Talent Matching',
        alternate_name: 'SmartMatch AI',
        description: 'Machine learning algorithms to improve candidate-role matching accuracy by 40%',
        module: 'TA',
        devRoadmap: 'AI/ML',
        quarter: 'Q1 2025',
        release: 'Release 25.1',
        releaseDate: '2025-03-30',
        status: 'Planning',
        statusComplete: false,
        boulder_file_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop',
        cpo_take: 'This represents a fundamental shift in how we approach talent matching. By leveraging advanced ML models, we can reduce time-to-hire by 35% while improving match quality. The beta results show incredible promise.',
        priority: 'Critical',
        effort: '12 weeks',
        team_size: 6,
        dependencies: ['ML Infrastructure', 'Data Quality Initiative']
      },
      {
        id: '3',
        name: 'Mobile App Redesign',
        alternate_name: 'Mobile 3.0',
        description: 'Complete redesign of mobile experience with modern UI/UX and offline capabilities',
        module: 'PLAT',
        devRoadmap: 'Mobile',
        quarter: 'Q1 2025',
        release: 'Release 25.1',
        releaseDate: '2025-02-28',
        status: 'Design',
        statusComplete: false,
        boulder_file_url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop',
        cpo_take: 'Mobile usage has grown 300% this year. This redesign focuses on creating a mobile-first experience that rivals our desktop platform. The new design system will also accelerate future development.',
        priority: 'High',
        effort: '10 weeks',
        team_size: 5,
        dependencies: ['Design System 2.0', 'Mobile Framework']
      },
      {
        id: '4',
        name: 'Advanced Onboarding Workflows',
        alternate_name: 'Onboarding Pro',
        description: 'Streamlined and automated onboarding processes with smart task routing and progress tracking',
        module: 'ONB',
        devRoadmap: 'Workflows',
        quarter: 'Q2 2025',
        release: 'Release 25.2',
        releaseDate: '2025-06-15',
        status: 'Planning',
        statusComplete: false,
        boulder_file_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
        cpo_take: 'Onboarding is where we make our first impression. This initiative will reduce onboarding time by 50% while improving new hire satisfaction scores. The automated workflows will free up HR teams to focus on strategic activities.',
        priority: 'Medium',
        effort: '6 weeks',
        team_size: 3,
        dependencies: ['Workflow Engine', 'Notification System']
      },
      {
        id: '5',
        name: 'Performance Management 2.0',
        alternate_name: 'PerfTrack Next',
        description: 'Next-generation performance tracking with 360-degree feedback, goal alignment, and development planning',
        module: 'TD',
        devRoadmap: 'Performance',
        quarter: 'Q2 2025',
        release: 'Release 25.2',
        releaseDate: '2025-05-30',
        status: 'Research',
        statusComplete: false,
        boulder_file_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop',
        cpo_take: 'Performance management is evolving from annual reviews to continuous development. Our new system will provide real-time feedback, peer insights, and AI-driven development recommendations. This is the future of talent development.',
        priority: 'High',
        effort: '14 weeks',
        team_size: 7,
        dependencies: ['Feedback Engine', 'Analytics Platform', 'AI Recommendations']
      },
      {
        id: '6',
        name: 'Global Compliance Suite',
        alternate_name: 'ComplianceMax',
        description: 'Comprehensive compliance management for global hiring regulations and data privacy',
        module: 'COMP',
        devRoadmap: 'Compliance',
        quarter: 'Q3 2025',
        release: 'Release 25.3',
        releaseDate: '2025-09-15',
        status: 'Research',
        statusComplete: false,
        boulder_file_url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&h=300&fit=crop',
        cpo_take: 'With expanding global operations, compliance is critical. This suite will automate GDPR, CCPA, and other regulatory requirements while providing audit trails and real-time compliance monitoring.',
        priority: 'Critical',
        effort: '16 weeks',
        team_size: 5,
        dependencies: ['Legal Framework', 'Data Governance', 'Audit System']
      },
      {
        id: '7',
        name: 'Integrated Video Interviewing',
        alternate_name: 'VideoConnect Pro',
        description: 'Built-in video interviewing platform with AI-powered candidate assessment and recording capabilities',
        module: 'INT',
        devRoadmap: 'Interviewing',
        quarter: 'Q3 2025',
        release: 'Release 25.3',
        releaseDate: '2025-08-30',
        status: 'Planning',
        statusComplete: false,
        boulder_file_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&h=300&fit=crop',
        cpo_take: 'Remote interviewing is here to stay. Our integrated solution will eliminate the need for third-party tools while providing superior candidate experience and interviewer insights through AI analysis.',
        priority: 'High',
        effort: '12 weeks',
        team_size: 6,
        dependencies: ['Video Infrastructure', 'AI Assessment Engine']
      },
      {
        id: '8',
        name: 'Advanced Reporting Engine',
        alternate_name: 'ReportBuilder 3.0',
        description: 'Drag-and-drop report builder with real-time data visualization and automated insights',
        module: 'R&A',
        devRoadmap: 'Reporting',
        quarter: 'Q4 2025',
        release: 'Release 25.4',
        releaseDate: '2025-12-15',
        status: 'Complete/Done (GA)',
        statusComplete: true,
        boulder_file_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
        cpo_take: 'Custom reporting has been our most requested enterprise feature. This visual report builder will democratize data analysis and enable customers to create publication-ready reports in minutes.',
        priority: 'High',
        effort: '10 weeks',
        team_size: 4,
        dependencies: ['Chart Library', 'Export Engine', 'Data Connectors']
      }
    ]

    // Apply search filter
    let filteredBoulders = mockBoulders
    if (search) {
      filteredBoulders = filteredBoulders.filter(boulder => 
        boulder.name.toLowerCase().includes(search.toLowerCase()) ||
        boulder.description.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Apply module filter
    if (modules.length > 0) {
      filteredBoulders = filteredBoulders.filter(boulder => 
        modules.includes(boulder.module)
      )
    }

    // Group by quarters
    const quarterGroups = filteredBoulders.reduce((acc, boulder) => {
      const existing = acc.find(group => group.quarter === boulder.quarter)
      if (existing) {
        existing.epics.push(boulder)
      } else {
        acc.push({
          quarter: boulder.quarter,
          epics: [boulder]
        })
      }
      return acc
    }, [] as Array<{ quarter: string; epics: typeof mockBoulders }>)

    // Sort quarters chronologically
    quarterGroups.sort((a, b) => {
      // Simple quarter sorting (you might want to improve this)
      const quarterOrder = ['Q4 2024', 'Q1 2025', 'Q2 2025', 'Q3 2025', 'Q4 2025']
      return quarterOrder.indexOf(a.quarter) - quarterOrder.indexOf(b.quarter)
    })

    // Get available modules
    const availableModules = Array.from(new Set(mockBoulders.map(b => b.module))).sort()

    const response = {
      quarters: quarterGroups,
      availableModules,
      totalBoulders: mockBoulders.length,
      filteredBoulders: filteredBoulders.length
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in boulders API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch boulders' },
      { status: 500 }
    )
  }
}
