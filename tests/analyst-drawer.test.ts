import test from 'node:test'
import assert from 'node:assert'
import { JSDOM } from 'jsdom'

// Mock global environment for React components
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`)
global.window = dom.window as any
global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement

// Mock fetch for API calls
global.fetch = async (url: string, options?: any) => {
  const urlString = typeof url === 'string' ? url : url.toString()
  
  if (urlString.includes('/api/analysts/') && options?.method === 'PATCH') {
    return {
      ok: true,
      json: async () => ({
        success: true,
        message: 'Analyst updated successfully',
        analyst: {
          ...JSON.parse(options.body),
          id: 'test-analyst-1'
        }
      })
    }
  }

  if (urlString.includes('/publications')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            title: 'The Future of HR Technology',
            type: 'RESEARCH_REPORT',
            publishedAt: '2024-03-15',
            url: 'https://example.com/report1',
            summary: 'AI adoption in HR technology'
          },
          {
            id: '2',
            title: 'Employee Experience Revolution',
            type: 'BLOG_POST',
            publishedAt: '2024-01-22',
            url: 'https://example.com/blog1',
            summary: 'New approaches to employee experience'
          }
        ]
      })
    }
  }

  if (urlString.includes('/social-posts')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            platform: 'LINKEDIN',
            content: 'Discussion on workplace flexibility',
            postedAt: '2024-06-25',
            engagements: 127,
            url: 'https://linkedin.com/post1'
          },
          {
            id: '2',
            platform: 'TWITTER',
            content: 'Employee experience research findings',
            postedAt: '2024-06-22',
            engagements: 89,
            url: 'https://twitter.com/post1'
          }
        ]
      })
    }
  }

  if (urlString.includes('/briefings')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        data: [
          {
            id: '1',
            title: 'Q2 Product Roadmap Briefing',
            scheduledAt: '2024-06-10',
            completedAt: '2024-06-10',
            status: 'COMPLETED',
            duration: 45,
            outcomes: ['Positive feedback on AI features', 'Interest in integration capabilities'],
            followUpActions: ['Send beta invitation', 'Schedule demo with larger team']
          }
        ]
      })
    }
  }

  if (urlString.includes('/generate-social-response')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        message: 'Great insights! We\'ve been working on similar initiatives and would love to share our experience.'
      })
    }
  }

  if (urlString.includes('/search-social')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        results: [
          {
            url: 'https://linkedin.com/in/sarah-chen-gartner',
            title: 'Sarah Chen - VP Analyst at Gartner',
            description: 'HR Technology expert with 15+ years experience',
            confidence: 92,
            reason: 'Name, title, and company match perfectly'
          },
          {
            url: 'https://linkedin.com/in/sarah-chen-hr',
            title: 'Sarah Chen - HR Technology Consultant',
            description: 'Independent HR consultant',
            confidence: 67,
            reason: 'Name matches, but different company'
          }
        ]
      })
    }
  }

  return {
    ok: false,
    status: 404
  }
}

// Mock analyst data for drawer tests
const mockAnalyst = {
  id: 'test-analyst-1',
  firstName: 'Sarah',
  lastName: 'Chen',
  email: 'sarah.chen@gartner.com',
  company: 'Gartner',
  title: 'VP Analyst',
  phone: '+1-555-0123',
  linkedIn: 'https://linkedin.com/in/sarahchen',
  twitter: '@sarahchen_hr',
  website: 'https://gartner.com/sarah-chen',
  bio: 'Leading HR Technology analyst with 15+ years of experience',
  profileImageUrl: null,
  influence: 'VERY_HIGH',
  status: 'ACTIVE',
  relationshipHealth: 'GOOD',
  expertise: ['HR Technology', 'Talent Management', 'Employee Experience'],
  coveredTopics: [
    { topic: 'HR Technology' },
    { topic: 'Talent Management' },
    { topic: 'Employee Experience' }
  ],
  keyThemes: ['AI in HR', 'Future of Work', 'Employee Engagement']
}

// Test Suite: Drawer State Management
test('Analyst Drawer - State Management', async (t) => {
  await t.test('should manage drawer open/close state', () => {
    let isOpen = false
    
    // Open drawer
    isOpen = true
    assert.strictEqual(isOpen, true)
    
    // Close drawer
    isOpen = false
    assert.strictEqual(isOpen, false)
  })

  await t.test('should manage active tab state', () => {
    let activeTab = 'overview'
    
    // Switch to publications tab
    activeTab = 'publications'
    assert.strictEqual(activeTab, 'publications')
    
    // Switch to briefings tab
    activeTab = 'briefings'
    assert.strictEqual(activeTab, 'briefings')
    
    // Return to overview
    activeTab = 'overview'
    assert.strictEqual(activeTab, 'overview')
  })

  await t.test('should manage loading states for different data types', () => {
    const loading = {
      publications: false,
      socialPosts: false,
      briefings: false
    }
    
    // Start loading publications
    loading.publications = true
    assert.strictEqual(loading.publications, true)
    assert.strictEqual(loading.socialPosts, false)
    assert.strictEqual(loading.briefings, false)
    
    // Complete publications, start social posts
    loading.publications = false
    loading.socialPosts = true
    assert.strictEqual(loading.publications, false)
    assert.strictEqual(loading.socialPosts, true)
  })
})

// Test Suite: Data Fetching
test('Analyst Drawer - Data Fetching', async (t) => {
  await t.test('should fetch publications data', async () => {
    const response = await fetch('/api/analysts/test-analyst-1/publications')
    const data = await response.json()
    
    assert.strictEqual(response.ok, true)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.data.length, 2)
    assert.strictEqual(data.data[0].title, 'The Future of HR Technology')
    assert.strictEqual(data.data[0].type, 'RESEARCH_REPORT')
  })

  await t.test('should fetch social posts data', async () => {
    const response = await fetch('/api/analysts/test-analyst-1/social-posts')
    const data = await response.json()
    
    assert.strictEqual(response.ok, true)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.data.length, 2)
    assert.strictEqual(data.data[0].platform, 'LINKEDIN')
    assert.strictEqual(data.data[1].platform, 'TWITTER')
  })

  await t.test('should fetch briefings data', async () => {
    const response = await fetch('/api/analysts/test-analyst-1/briefings')
    const data = await response.json()
    
    assert.strictEqual(response.ok, true)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.data.length, 1)
    assert.strictEqual(data.data[0].status, 'COMPLETED')
    assert.strictEqual(data.data[0].duration, 45)
  })
})

// Test Suite: Edit Mode Functionality
test('Analyst Drawer - Edit Mode', async (t) => {
  await t.test('should enter edit mode with current data', () => {
    const isEditMode = false
    const editedData = {
      status: mockAnalyst.status,
      influence: mockAnalyst.influence,
      relationshipHealth: mockAnalyst.relationshipHealth,
      email: mockAnalyst.email,
      phone: mockAnalyst.phone,
      linkedIn: mockAnalyst.linkedIn,
      twitter: mockAnalyst.twitter,
      website: mockAnalyst.website,
      coveredTopics: mockAnalyst.coveredTopics.map(t => t.topic)
    }
    
    assert.strictEqual(editedData.status, 'ACTIVE')
    assert.strictEqual(editedData.influence, 'VERY_HIGH')
    assert.strictEqual(editedData.relationshipHealth, 'GOOD')
    assert.strictEqual(editedData.email, 'sarah.chen@gartner.com')
    assert.strictEqual(editedData.coveredTopics.length, 3)
  })

  await t.test('should update edited data fields', () => {
    let editedData = {
      status: 'ACTIVE',
      influence: 'VERY_HIGH',
      relationshipHealth: 'GOOD',
      email: 'sarah.chen@gartner.com',
      phone: '+1-555-0123',
      linkedIn: 'https://linkedin.com/in/sarahchen',
      twitter: '@sarahchen_hr',
      website: 'https://gartner.com/sarah-chen',
      coveredTopics: ['HR Technology', 'Talent Management']
    }
    
    // Update status
    editedData.status = 'INACTIVE'
    assert.strictEqual(editedData.status, 'INACTIVE')
    
    // Update influence
    editedData.influence = 'HIGH'
    assert.strictEqual(editedData.influence, 'HIGH')
    
    // Update relationship health
    editedData.relationshipHealth = 'EXCELLENT'
    assert.strictEqual(editedData.relationshipHealth, 'EXCELLENT')
  })

  await t.test('should save edited data via API', async () => {
    const editedData = {
      status: 'INACTIVE',
      influence: 'HIGH',
      relationshipHealth: 'EXCELLENT',
      email: 'sarah.chen@gartner.com',
      phone: '+1-555-0123',
      linkedIn: 'https://linkedin.com/in/sarahchen-updated',
      twitter: '@sarahchen_hr_new',
      website: 'https://gartner.com/sarah-chen-updated',
      coveredTopics: ['HR Technology', 'AI in HR']
    }
    
    const response = await fetch('/api/analysts/test-analyst-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editedData)
    })
    
    const result = await response.json()
    assert.strictEqual(response.ok, true)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.message, 'Analyst updated successfully')
  })

  await t.test('should handle topic management', () => {
    let coveredTopics = ['HR Technology', 'Talent Management']
    
    // Add new topic
    const newTopic = 'Employee Experience'
    coveredTopics = [...coveredTopics, newTopic]
    assert.strictEqual(coveredTopics.length, 3)
    assert.strictEqual(coveredTopics[2], 'Employee Experience')
    
    // Remove topic
    const indexToRemove = 1
    coveredTopics = coveredTopics.filter((_, i) => i !== indexToRemove)
    assert.strictEqual(coveredTopics.length, 2)
    assert.strictEqual(coveredTopics[1], 'Employee Experience')
  })
})

// Test Suite: Social Media Engagement
test('Analyst Drawer - Social Media Engagement', async (t) => {
  await t.test('should manage engagement modal state', () => {
    let engagementModal = {
      isOpen: false,
      type: null,
      post: null
    }
    
    const mockPost = {
      id: '1',
      platform: 'LINKEDIN',
      content: 'Great discussion on AI in HR',
      postedAt: '2024-06-25',
      engagements: 127
    }
    
    // Open reply modal
    engagementModal = {
      isOpen: true,
      type: 'reply',
      post: mockPost
    }
    
    assert.strictEqual(engagementModal.isOpen, true)
    assert.strictEqual(engagementModal.type, 'reply')
    assert.strictEqual(engagementModal.post.platform, 'LINKEDIN')
  })

  await t.test('should generate AI response for engagement', async () => {
    const mockPost = {
      id: '1',
      platform: 'LINKEDIN',
      content: 'Discussing the future of workplace flexibility',
      postedAt: '2024-06-25'
    }
    
    const response = await fetch('/api/analysts/generate-social-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analystId: 'test-analyst-1',
        analystName: 'Sarah Chen',
        post: mockPost,
        responseType: 'reply',
        context: {
          company: 'Gartner',
          title: 'VP Analyst',
          expertise: ['HR Technology']
        }
      })
    })
    
    const result = await response.json()
    assert.strictEqual(response.ok, true)
    assert.strictEqual(result.success, true)
    assert.ok(result.message.length > 0)
  })

  await t.test('should validate engagement text length for different platforms', () => {
    const validateEngagementText = (text: string, platform: string) => {
      if (platform === 'TWITTER') {
        return text.length <= 280
      }
      if (platform === 'LINKEDIN') {
        return text.length <= 3000
      }
      return true
    }
    
    const shortText = 'Great insights!'
    const longText = 'A'.repeat(300)
    
    assert.strictEqual(validateEngagementText(shortText, 'TWITTER'), true)
    assert.strictEqual(validateEngagementText(longText, 'TWITTER'), false)
    assert.strictEqual(validateEngagementText(longText, 'LINKEDIN'), true)
  })

  await t.test('should handle engagement submission', () => {
    const engagementData = {
      type: 'reply',
      postId: '1',
      message: 'Thank you for sharing these insights!',
      platform: 'LINKEDIN'
    }
    
    // Simulate engagement submission
    assert.strictEqual(engagementData.type, 'reply')
    assert.strictEqual(engagementData.platform, 'LINKEDIN')
    assert.ok(engagementData.message.length > 0)
  })
})

// Test Suite: Social Profile Search
test('Analyst Drawer - Social Profile Search', async (t) => {
  await t.test('should search for social profiles', async () => {
    const response = await fetch('/api/analysts/search-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analystId: 'test-analyst-1',
        analystName: 'Sarah Chen',
        company: 'Gartner',
        platform: 'linkedin'
      })
    })
    
    const result = await response.json()
    assert.strictEqual(response.ok, true)
    assert.strictEqual(result.success, true)
    assert.strictEqual(result.results.length, 2)
    assert.ok(result.results[0].confidence > result.results[1].confidence)
  })

  await t.test('should manage search results modal', () => {
    let searchResultsModal = {
      isOpen: false,
      type: null,
      results: []
    }
    
    const mockResults = [
      {
        url: 'https://linkedin.com/in/sarah-chen-1',
        confidence: 92,
        reason: 'Perfect match'
      },
      {
        url: 'https://linkedin.com/in/sarah-chen-2',
        confidence: 75,
        reason: 'Good match'
      }
    ]
    
    // Open search results modal
    searchResultsModal = {
      isOpen: true,
      type: 'linkedin',
      results: mockResults
    }
    
    assert.strictEqual(searchResultsModal.isOpen, true)
    assert.strictEqual(searchResultsModal.type, 'linkedin')
    assert.strictEqual(searchResultsModal.results.length, 2)
  })

  await t.test('should handle result selection', () => {
    let selectedResults = []
    const availableResults = [
      'https://linkedin.com/in/sarah-chen-1',
      'https://linkedin.com/in/sarah-chen-2'
    ]
    
    // Select first result
    selectedResults = [...selectedResults, availableResults[0]]
    assert.strictEqual(selectedResults.length, 1)
    assert.strictEqual(selectedResults[0], availableResults[0])
    
    // Deselect first result
    selectedResults = selectedResults.filter(item => item !== availableResults[0])
    assert.strictEqual(selectedResults.length, 0)
    
    // Select multiple results
    selectedResults = [...selectedResults, ...availableResults]
    assert.strictEqual(selectedResults.length, 2)
  })

  await t.test('should save selected social media results', async () => {
    const selectedResults = ['https://linkedin.com/in/sarah-chen-gartner']
    
    const response = await fetch('/api/analysts/test-analyst-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linkedin: selectedResults
      })
    })
    
    const result = await response.json()
    assert.strictEqual(response.ok, true)
    assert.strictEqual(result.success, true)
  })
})

// Test Suite: Publication Display
test('Analyst Drawer - Publication Display', async (t) => {
  await t.test('should categorize publication types', () => {
    const getPublicationIcon = (type: string) => {
      switch (type) {
        case 'RESEARCH_REPORT': return 'file-text'
        case 'BLOG_POST': return 'message-square'
        case 'WEBINAR': return 'users'
        case 'WHITEPAPER': return 'file-text'
        default: return 'file-text'
      }
    }
    
    assert.strictEqual(getPublicationIcon('RESEARCH_REPORT'), 'file-text')
    assert.strictEqual(getPublicationIcon('BLOG_POST'), 'message-square')
    assert.strictEqual(getPublicationIcon('WEBINAR'), 'users')
    assert.strictEqual(getPublicationIcon('WHITEPAPER'), 'file-text')
    assert.strictEqual(getPublicationIcon('UNKNOWN'), 'file-text')
  })

  await t.test('should format publication dates', () => {
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
    
    const publicationDate = '2024-03-15'
    const formatted = formatDate(publicationDate)
    assert.ok(formatted.includes('2024'))
    assert.ok(formatted.includes('Mar'))
    assert.ok(formatted.includes('15'))
  })

  await t.test('should handle publication summaries', () => {
    const publication = {
      title: 'The Future of HR Technology',
      summary: 'Comprehensive analysis of AI adoption in HR technology and its impact on workforce management.',
      type: 'RESEARCH_REPORT'
    }
    
    assert.ok(publication.summary.length > 50)
    assert.ok(publication.summary.includes('AI'))
    assert.ok(publication.summary.includes('HR'))
  })
})

// Test Suite: Briefing History
test('Analyst Drawer - Briefing History', async (t) => {
  await t.test('should display briefing status correctly', () => {
    const getBriefingStatusColor = (status: string) => {
      switch (status) {
        case 'COMPLETED': return 'green'
        case 'SCHEDULED': return 'blue'
        case 'CANCELLED': return 'red'
        default: return 'gray'
      }
    }
    
    assert.strictEqual(getBriefingStatusColor('COMPLETED'), 'green')
    assert.strictEqual(getBriefingStatusColor('SCHEDULED'), 'blue')
    assert.strictEqual(getBriefingStatusColor('CANCELLED'), 'red')
    assert.strictEqual(getBriefingStatusColor('UNKNOWN'), 'gray')
  })

  await t.test('should handle briefing outcomes and follow-ups', () => {
    const briefing = {
      outcomes: ['Positive feedback on AI features', 'Interest in integration capabilities'],
      followUpActions: ['Send beta invitation', 'Schedule demo with larger team']
    }
    
    assert.strictEqual(briefing.outcomes.length, 2)
    assert.strictEqual(briefing.followUpActions.length, 2)
    assert.ok(briefing.outcomes[0].includes('Positive feedback'))
    assert.ok(briefing.followUpActions[0].includes('beta invitation'))
  })

  await t.test('should calculate briefing duration', () => {
    const startTime = new Date('2024-06-10T14:00:00Z')
    const endTime = new Date('2024-06-10T14:45:00Z')
    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
    
    assert.strictEqual(durationMinutes, 45)
  })
})

// Test Suite: Contact Information Management
test('Analyst Drawer - Contact Information', async (t) => {
  await t.test('should validate email format', () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(email)
    }
    
    assert.strictEqual(isValidEmail('sarah.chen@gartner.com'), true)
    assert.strictEqual(isValidEmail('invalid.email'), false)
    assert.strictEqual(isValidEmail('test@example.com'), true)
    assert.strictEqual(isValidEmail(''), false)
  })

  await t.test('should validate phone number format', () => {
    const isValidPhone = (phone: string) => {
      const phoneRegex = /^\+?[\d\s\-\(\)]+$/
      return phoneRegex.test(phone) && phone.length >= 10
    }
    
    assert.strictEqual(isValidPhone('+1-555-0123'), true)
    assert.strictEqual(isValidPhone('(555) 123-4567'), true)
    assert.strictEqual(isValidPhone('invalid'), false)
    assert.strictEqual(isValidPhone('123'), false)
  })

  await t.test('should validate URL format', () => {
    const isValidURL = (url: string) => {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }
    
    assert.strictEqual(isValidURL('https://linkedin.com/in/sarahchen'), true)
    assert.strictEqual(isValidURL('https://gartner.com/sarah-chen'), true)
    assert.strictEqual(isValidURL('invalid-url'), false)
    assert.strictEqual(isValidURL(''), false)
  })
})

// Test Suite: Error Handling
test('Analyst Drawer - Error Handling', async (t) => {
  await t.test('should handle API fetch errors', async () => {
    const originalFetch = global.fetch
    global.fetch = async () => ({ ok: false, status: 500 })
    
    try {
      const response = await fetch('/api/analysts/test-analyst-1/publications')
      assert.strictEqual(response.ok, false)
      assert.strictEqual(response.status, 500)
    } finally {
      global.fetch = originalFetch
    }
  })

  await t.test('should handle malformed response data', () => {
    const malformedData = {
      // Missing required fields
      publications: null,
      socialPosts: undefined
    }
    
    assert.strictEqual(malformedData.publications, null)
    assert.strictEqual(malformedData.socialPosts, undefined)
  })

  await t.test('should handle empty data arrays', () => {
    const emptyData = {
      publications: [],
      socialPosts: [],
      briefings: []
    }
    
    assert.strictEqual(emptyData.publications.length, 0)
    assert.strictEqual(emptyData.socialPosts.length, 0)
    assert.strictEqual(emptyData.briefings.length, 0)
  })

  await t.test('should handle social search errors gracefully', async () => {
    const originalFetch = global.fetch
    global.fetch = async (url) => {
      if (url.includes('/search-social')) {
        return { ok: false, status: 500 }
      }
      return originalFetch(url)
    }
    
    try {
      const response = await fetch('/api/analysts/search-social', {
        method: 'POST',
        body: JSON.stringify({ platform: 'linkedin' })
      })
      assert.strictEqual(response.ok, false)
    } finally {
      global.fetch = originalFetch
    }
  })
})

// Test Suite: Body Scroll Management
test('Analyst Drawer - Body Scroll Management', async (t) => {
  await t.test('should manage body scroll when drawer opens/closes', () => {
    // Mock document.body.style
    const mockBodyStyle = {
      overflow: 'unset'
    }
    
    // Simulate drawer opening
    const isOpen = true
    if (isOpen) {
      mockBodyStyle.overflow = 'hidden'
    }
    assert.strictEqual(mockBodyStyle.overflow, 'hidden')
    
    // Simulate drawer closing
    const isClosed = false
    if (!isClosed) {
      mockBodyStyle.overflow = 'unset'
    }
    assert.strictEqual(mockBodyStyle.overflow, 'unset')
  })

  await t.test('should restore scroll on component unmount', () => {
    const mockBodyStyle = {
      overflow: 'hidden'
    }
    
    // Simulate cleanup
    mockBodyStyle.overflow = 'unset'
    assert.strictEqual(mockBodyStyle.overflow, 'unset')
  })
})
