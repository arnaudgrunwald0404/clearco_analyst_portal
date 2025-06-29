import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database with sample data...')

  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@hrtech.com' },
    update: {},
    create: {
      email: 'admin@hrtech.com',
      name: 'Admin User',
      password: 'hashedpassword123', // In real app, this would be properly hashed
      role: 'ADMIN',
    },
  })

  console.log('✅ Created admin user')

  // Create sample analysts
const analysts = await Promise.all([
    prisma.analyst.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@gartner.com',
        company: 'Gartner',
        title: 'Vice President Analyst',
        phone: '+1-555-0123',
        linkedIn: 'https://linkedin.com/in/sarahchen',
        twitter: '@sarahchen_hr',
        website: 'https://gartner.com',
        bio: 'Sarah Chen is a leading analyst in HR technology and talent management with over 15 years of experience.',
        influence: 'VERY_HIGH',
        status: 'ACTIVE',
        
        coveredTopics: {
          create: [
            { topic: 'HR Technology' },
            { topic: 'Talent Management' },
            { topic: 'Employee Experience' }
          ]
        }
      },
    }),
    prisma.analyst.create({
      data: {
        firstName: 'Michael',
        lastName: 'Rodriguez',
        email: 'mrodriguez@forrester.com',
        company: 'Forrester',
        title: 'Principal Analyst',
        phone: '+1-555-0124',
        linkedIn: 'https://linkedin.com/in/michaelrodriguez',
        bio: 'Michael Rodriguez specializes in employee experience and HR analytics research.',
        influence: 'HIGH',
        status: 'ACTIVE',

        coveredTopics: {
          create: [
            { topic: 'Employee Experience' },
            { topic: 'HR Analytics' },
            { topic: 'Workplace Technology' }
          ]
        }
      },
    }),
    prisma.analyst.create({
      data: {
        firstName: 'Jennifer',
        lastName: 'Kim',
        email: 'jennifer.kim@idc.com',
        company: 'IDC',
        title: 'Research Director',
        phone: '+1-555-0125',
        linkedIn: 'https://linkedin.com/in/jenniferkim',
        twitter: '@jenkim_tech',
        bio: 'Jennifer Kim focuses on HR technology market research and vendor analysis.',
        influence: 'HIGH',
        status: 'ACTIVE',

        coveredTopics: {
          create: [
            { topic: 'HR Technology' },
            { topic: 'Market Research' },
            { topic: 'Vendor Analysis' }
          ]
        }
      },
    }),
  ])

  console.log('✅ Created sample analysts')

  // Create sample newsletters
  const newsletters = await Promise.all([
    prisma.newsletter.create({
      data: {
        title: 'Q4 HR Tech Trends Report',
        subject: 'Key HR Technology Trends to Watch in Q4 2024',
        content: 'Our comprehensive analysis of the latest trends in HR technology...',
        htmlContent: '\u003ch1\u003eQ4 HR Tech Trends\u003c/h1\u003e\u003cp\u003eOur comprehensive analysis...\u003c/p\u003e',
        status: 'SENT',
        sentAt: new Date('2024-10-16'),
        createdBy: adminUser.id,
        subscriptions: {
          create: [
            {
              analystId: analysts[0].id,
              sentAt: new Date('2024-10-16'),
              opened: true,
              clicked: true
            },
            {
              analystId: analysts[1].id,
              sentAt: new Date('2024-10-16'),
              opened: true,
              clicked: false
            }
          ]
        }
      }
    }),
    prisma.newsletter.create({
      data: {
        title: 'Employee Experience Innovation',
        subject: 'Revolutionary Approaches to Employee Experience',
        content: 'Discover the latest innovations in employee experience...',
        status: 'DRAFT',
        createdBy: adminUser.id
      }
    })
  ])

  console.log('✅ Created sample newsletters')

  // Create sample interactions
  await Promise.all([
    prisma.interaction.create({
      data: {
        analystId: analysts[0].id,
        type: 'MEETING',
        subject: 'Q4 Product Roadmap Briefing',
        description: 'Discussed upcoming features and strategic direction for 2025',
        date: new Date('2024-10-20'),
      },
    }),
    prisma.interaction.create({
      data: {
        analystId: analysts[1].id,
        type: 'EMAIL',
        subject: 'Follow-up on Employee Analytics Discussion',
        description: 'Shared additional resources on our analytics capabilities',
        date: new Date('2024-10-15'),
      },
    }),
  ])

  console.log('✅ Created sample interactions')

  // Create sample content
  await Promise.all([
    prisma.content.create({
      data: {
        title: 'HR Tech Market Report 2024',
        description: 'Comprehensive analysis of the HR technology landscape',
        type: 'REPORT',
        url: '/content/hr-tech-report-2024.pdf',
        isExclusive: true,
        isPublished: true,
      },
    }),
    prisma.content.create({
      data: {
        title: 'Product Demo: AI-Powered Analytics',
        description: 'Interactive demonstration of our latest analytics features',
        type: 'DEMO',
        url: '/content/ai-analytics-demo',
        isExclusive: true,
        isPublished: true,
      },
    }),
  ])

  console.log('✅ Created sample content')

  // Create company vision content
  await Promise.all([
    prisma.companyVision.create({
      data: {
        title: 'Our Mission',
        content: 'To revolutionize the workplace by creating intelligent, human-centric technology solutions that empower organizations to build thriving, engaged workforces.',
        type: 'MISSION',
        isPublished: true,
        order: 1,
      },
    }),
    prisma.companyVision.create({
      data: {
        title: 'Core Values',
        content: 'Innovation through empathy, transparent communication, continuous learning, and sustainable growth that benefits both people and organizations.',
        type: 'VALUES',
        isPublished: true,
        order: 2,
      },
    }),
    prisma.companyVision.create({
      data: {
        title: 'Strategic Vision',
        content: 'Leading the future of work through AI-powered insights, predictive analytics, and seamless integration platforms that scale with organizational needs.',
        type: 'STRATEGY',
        isPublished: true,
        order: 3,
      },
    }),
  ])

  console.log('✅ Created company vision content')

  // Create exclusive content for analyst portal
  await Promise.all([
    prisma.exclusiveContent.create({
      data: {
        title: 'Q4 2024 Product Roadmap Deep Dive',
        description: 'Exclusive preview of upcoming features, AI capabilities, and platform enhancements',
        content: 'Detailed roadmap content goes here...',
        type: 'VIDEO',
        accessLevel: 'TIER1',
        downloadUrl: '/content/roadmap-q4-2024.mp4',
        isActive: true,
      },
    }),
    prisma.exclusiveContent.create({
      data: {
        title: 'Market Research: Future of HR Tech 2025',
        description: 'Proprietary research findings and market intelligence report',
        content: 'Market research content goes here...',
        type: 'REPORT',
        accessLevel: 'ALL',
        downloadUrl: '/content/hr-tech-2025-research.pdf',
        isActive: true,
      },
    }),
  ])

  console.log('✅ Created exclusive content')

  // Create analyst access credentials
  await prisma.analystAccess.create({
    data: {
      analystId: analysts[0].id,
      password: 'hashedpassword123', // In real app, this would be properly hashed
      isActive: true,
    },
  })

  console.log('✅ Created analyst portal access')

  // Create sample testimonials
  await Promise.all([
    prisma.testimonial.create({
      data: {
        analystId: analysts[0].id,
        quote: "ClearCompany's innovative approach to HR technology is setting new standards in the industry. Their platform demonstrates exceptional understanding of modern workforce needs.",
        context: 'Q4 2024 HR Tech Evaluation Report',
        isPublished: true,
        displayOrder: 1,
      },
    }),
    prisma.testimonial.create({
      data: {
        analystId: analysts[1].id,
        quote: "The employee experience capabilities we've seen from ClearCompany are truly impressive. They're addressing real pain points with practical solutions.",
        context: 'Employee Experience Technology Review',
        isPublished: true,
        displayOrder: 2,
      },
    }),
    prisma.testimonial.create({
      data: {
        analystId: analysts[2].id,
        quote: "ClearCompany stands out in the crowded HR tech market with their data-driven approach and commitment to measurable outcomes.",
        context: 'IDC HR Technology MarketScape 2024',
        isPublished: true,
        displayOrder: 3,
      },
    }),
  ])

  console.log('✅ Created sample testimonials')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📊 Summary:')
  console.log(`- ${analysts.length} analysts created`)
  console.log(`- ${newsletters.length} newsletters created`)
  console.log('- Sample interactions, content, and vision created')
  console.log('- Analyst portal access configured')
  console.log('\n🔑 Login credentials:')
  console.log('Admin: admin@hrtech.com / hashedpassword123')
  console.log('Analyst Portal: sarah.chen@gartner.com / hashedpassword123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
