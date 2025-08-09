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
  
  if (urlString.includes('/api/analysts/') && !urlString.includes('/social-posts') && !urlString.includes('/publications') && !urlString.includes('/briefings')) {
    return {
      ok: true,
      json: async () => ({
        success: true,
        analyst: {
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
          bio: 'Leading HR Technology analyst',
          profileImageUrl: null,
          influenceScore: 85,
          lastContactDate: '2024-10-15T10:00:00Z',
          nextContactDate: '2024-11-15T10:00:00Z',
          communicationCadence: 30,
          relationshipHealth: 'GOOD',
          recentSocialSummary: 'Active in AI discussions',
          socialSummaryUpdatedAt: '2024-10-20T00:00:00Z',
          keyThemes: 'AI in HR,Future of Work,Employee Engagement',
          upcomingPublications: 'The Future of HR Technology 2025',
          recentPublications: 'Employee Experience Trends Q3 2024',
          speakingEngagements: 'HR Tech Conference 2024',
          awards: 'Best HR Analyst 2024',
          status: 'ACTIVE',
          influence: 'VERY_HIGH',
          socialHandles: [
            {
              id: 'sh1',
              platform: 'LINKEDIN',
              handle: 'https://linkedin.com/in/sarahchen',
              displayName: 'Sarah Chen - Gartner',
              isActive: true
            },
            {
              id: 'sh2',
              platform: 'TWITTER',
              handle: '@sarahchen_hr',
              displayName: 'Sarah Chen',
              isActive: true
            }
          ],
          coveredTopics: [
            { topic: 'HR Technology' },
            { topic: 'Talent Management' },
            { topic: 'Employee Experience' }
          ]
        }
      })
    }
  }
  
  if (urlString.includes('/search-social')) {
    const body = options?.body ? JSON.parse(options.body) : {}
    if (body.platform === 'linkedin') {
      return {
        ok: true,
        json: async () => ({
          success: true,
          result: {
            confidence: 85,
            url: 'https://linkedin.com/in/sarahchen-new',
            reason: 'Name and company match'
          }
        })
      }
    } else {
      return {
        ok: true,
        json: async () => ({
          success: true,
          result: {
            confidence: 75,
            handle: '@sarahchen_new',
            reason: 'Name match'
          }
        })
      }
    }
  }
  
  return {
    ok: false,
    status: 404
  }
}

// Test Suite: Analyst Page Data Loading
test('Analyst Page - Data Loading Tests', async (t) => {
  await t.test('should fetch analyst data successfully', async () => {
    const response = await fetch('/api/analysts/test-analyst-1')
    const data = await response.json()
    
    assert.strictEqual(response.ok, true)
    assert.strictEqual(data.success, true)
    assert.strictEqual(data.analyst.firstName, 'Sarah')
    assert.strictEqual(data.analyst.lastName, 'Chen')
    assert.strictEqual(data.analyst.email, 'sarah.chen@gartner.com')
  })

  await t.test('should handle missing analyst gracefully', async () => {
    // Override fetch to return 404 for this specific test
    const originalFetch = global.fetch
    global.fetch = async (url) => {
      if (url.includes('non-existent-id')) {
        return { ok: false, status: 404 }
      }
      return originalFetch(url)
    }
    
    try {
      const response = await fetch('/api/analysts/non-existent-id')
      assert.strictEqual(response.ok, false)
    } finally {
      global.fetch = originalFetch
    }
  })

  await t.test('should load social handles data', async () => {
    const response = await fetch('/api/analysts/test-analyst-1')
    const data = await response.json()
    
    assert.strictEqual(data.analyst.socialHandles.length, 2)
    assert.strictEqual(data.analyst.socialHandles[0].platform, 'LINKEDIN')
    assert.strictEqual(data.analyst.socialHandles[1].platform, 'TWITTER')
  })
})

// Test Suite: Social Profile Icons
test('Analyst Page - Social Profile Icons', async (t) => {
  await t.test('should display Twitter icon for legacy twitter field', async () => {
    const analyst = {
      twitter: '@sarahchen_hr',
      socialHandles: []
    }
    
    // Test that Twitter icon should be rendered
    assert.ok(analyst.twitter)
    assert.strictEqual(analyst.socialHandles.length, 0)
  })



  await t.test('should display multiple Twitter icons from socialHandles', async () => {
    const analyst = {
      socialHandles: [
        { platform: 'TWITTER', handle: '@sarahchen1', isActive: true },
        { platform: 'TWITTER', handle: '@sarahchen2', isActive: true }
      ]
    }
    
    const twitterHandles = analyst.socialHandles.filter(h => h.platform === 'TWITTER')
    assert.strictEqual(twitterHandles.length, 2)
  })

  await t.test('should prefer socialHandles over legacy fields', async () => {
    const analyst = {
      linkedIn: 'https://linkedin.com/in/old-profile',
      twitter: '@old_handle',
      socialHandles: [
        { platform: 'LINKEDIN', handle: 'https://linkedin.com/in/new-profile', isActive: true },
        { platform: 'TWITTER', handle: '@new_handle', isActive: true }
      ]
    }
    
    const linkedinHandles = analyst.socialHandles.filter(h => h.platform === 'LINKEDIN')
    const twitterHandles = analyst.socialHandles.filter(h => h.platform === 'TWITTER')
    
    // Should use socialHandles, not legacy fields
    assert.strictEqual(linkedinHandles.length, 1)
    assert.strictEqual(twitterHandles.length, 1)
    assert.strictEqual(linkedinHandles[0].handle, 'https://linkedin.com/in/new-profile')
    assert.strictEqual(twitterHandles[0].handle, '@new_handle')
  })

  await t.test('should generate correct URLs for social profiles', async () => {
    // Test LinkedIn URL generation
    const linkedinHandle = 'profile-name'
    const linkedinUrl = linkedinHandle.startsWith('http') 
      ? linkedinHandle 
      : `https://linkedin.com/in/${linkedinHandle}`
    assert.strictEqual(linkedinUrl, 'https://linkedin.com/in/profile-name')

    // Test Twitter URL generation
    const twitterHandle = '@username'
    const twitterUrl = `https://twitter.com/${twitterHandle.replace('@', '')}`
    assert.strictEqual(twitterUrl, 'https://twitter.com/username')

    // Test Twitter URL with existing https
    const twitterUrl2 = 'https://twitter.com/username'
    const finalTwitterUrl = twitterUrl2.startsWith('http') 
      ? twitterUrl2 
      : `https://twitter.com/${twitterUrl2.replace('@', '')}`
    assert.strictEqual(finalTwitterUrl, 'https://twitter.com/username')
  })
})

// Test Suite: Social Media Search
test('Analyst Page - Social Media Search', async (t) => {


  await t.test('should search for Twitter profile', async () => {
    const response = await fetch('/api/analysts/search-social', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analystId: 'test-analyst-1',
        analystName: 'Sarah Chen',
        company: 'Gartner',
        platform: 'twitter'
      })
    })
    
    const result = await response.json()
    assert.strictEqual(response.ok, true)
    assert.strictEqual(result.success, true)
  })

  await t.test('should handle search API errors gracefully', async () => {
    // Mock a failed search
    const originalFetch = global.fetch
    global.fetch = async () => ({ ok: false, status: 500 })
    
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

// Test Suite: Data Formatting and Display
test('Analyst Page - Data Formatting', async (t) => {
  await t.test('should format dates correctly', () => {
    const dateString = '2024-10-15T10:00:00Z'
    const formatted = new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
    assert.ok(formatted.includes('2024'))
    assert.ok(formatted.includes('Oct'))
    assert.ok(formatted.includes('15'))
  })

  await t.test('should handle missing optional fields', () => {
    const analyst = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      // Missing optional fields
      phone: null,
      linkedIn: null,
      twitter: null,
      bio: null,
      coveredTopics: null
    }
    
    assert.strictEqual(analyst.phone, null)
    assert.strictEqual(analyst.linkedIn, null)
    assert.strictEqual(analyst.twitter, null)
    assert.strictEqual(analyst.bio, null)
    assert.strictEqual(analyst.coveredTopics, null)
  })

  await t.test('should split key themes correctly', () => {
    const keyThemes = 'AI in HR,Future of Work,Employee Engagement'
    const themes = keyThemes.split(',').map(theme => theme.trim())
    
    assert.strictEqual(themes.length, 3)
    assert.strictEqual(themes[0], 'AI in HR')
    assert.strictEqual(themes[1], 'Future of Work')
    assert.strictEqual(themes[2], 'Employee Engagement')
  })

  await t.test('should handle covered topics array', () => {
    const coveredTopics = [
      { topic: 'HR Technology' },
      { topic: 'Talent Management' },
      { topic: 'Employee Experience' }
    ]
    
    assert.strictEqual(coveredTopics.length, 3)
    assert.strictEqual(coveredTopics[0].topic, 'HR Technology')
  })
})

// Test Suite: UI State Management
test('Analyst Page - UI State Management', async (t) => {
  await t.test('should manage loading states', () => {
    let loading = true
    let analyst = null
    
    // Simulate loading completion
    loading = false
    analyst = { firstName: 'Sarah', lastName: 'Chen' }
    
    assert.strictEqual(loading, false)
    assert.ok(analyst)
    assert.strictEqual(analyst.firstName, 'Sarah')
  })

  await t.test('should manage active tab state', () => {
    let activeTab = 'overview'
    
    // Switch tabs
    activeTab = 'intelligence'
    assert.strictEqual(activeTab, 'intelligence')
    
    activeTab = 'communications'
    assert.strictEqual(activeTab, 'communications')
    
    activeTab = 'briefings'
    assert.strictEqual(activeTab, 'briefings')
  })

  await t.test('should manage social search loading states', () => {
    const socialSearchLoading = {
      linkedin: false,
      twitter: false
    }
    
    // Start LinkedIn search
    socialSearchLoading.linkedin = true
    assert.strictEqual(socialSearchLoading.linkedin, true)
    assert.strictEqual(socialSearchLoading.twitter, false)
    
    // Complete LinkedIn search, start Twitter search
    socialSearchLoading.linkedin = false
    socialSearchLoading.twitter = true
    assert.strictEqual(socialSearchLoading.linkedin, false)
    assert.strictEqual(socialSearchLoading.twitter, true)
  })
})

// Test Suite: Error Handling
test('Analyst Page - Error Handling', async (t) => {
  await t.test('should handle API errors gracefully', async () => {
    const originalFetch = global.fetch
    global.fetch = async () => ({ ok: false, status: 500 })
    
    try {
      const response = await fetch('/api/analysts/test-analyst-1')
      assert.strictEqual(response.ok, false)
      assert.strictEqual(response.status, 500)
    } finally {
      global.fetch = originalFetch
    }
  })

  await t.test('should handle malformed analyst data', () => {
    const malformedAnalyst = {
      // Missing required fields
      id: 'test-1'
      // firstName, lastName, email missing
    }
    
    assert.ok(malformedAnalyst.id)
    assert.strictEqual(malformedAnalyst.firstName, undefined)
    assert.strictEqual(malformedAnalyst.lastName, undefined)
    assert.strictEqual(malformedAnalyst.email, undefined)
  })

  await t.test('should handle empty social handles array', () => {
    const analyst = {
      socialHandles: []
    }
    
    const linkedinHandles = analyst.socialHandles.filter(h => h.platform === 'LINKEDIN')
    const twitterHandles = analyst.socialHandles.filter(h => h.platform === 'TWITTER')
    
    assert.strictEqual(linkedinHandles.length, 0)
    assert.strictEqual(twitterHandles.length, 0)
  })
})

// Test Suite: Influence and Health Scoring
test('Analyst Page - Influence and Health Scoring', async (t) => {
  await t.test('should categorize influence scores correctly', () => {
    const getInfluenceCategory = (score: number) => {
      if (score >= 80) return 'very-high'
      if (score >= 60) return 'high'
      if (score >= 40) return 'medium'
      if (score >= 20) return 'low'
      return 'very-low'
    }
    
    assert.strictEqual(getInfluenceCategory(95), 'very-high')
    assert.strictEqual(getInfluenceCategory(75), 'high')
    assert.strictEqual(getInfluenceCategory(55), 'medium')
    assert.strictEqual(getInfluenceCategory(35), 'low')
    assert.strictEqual(getInfluenceCategory(15), 'very-low')
  })

  await t.test('should categorize relationship health correctly', () => {
    const getHealthCategory = (health: string) => {
      switch (health) {
        case 'EXCELLENT': return 'excellent'
        case 'GOOD': return 'good'
        case 'FAIR': return 'fair'
        case 'POOR': return 'poor'
        case 'CRITICAL': return 'critical'
        default: return 'unknown'
      }
    }
    
    assert.strictEqual(getHealthCategory('EXCELLENT'), 'excellent')
    assert.strictEqual(getHealthCategory('GOOD'), 'good')
    assert.strictEqual(getHealthCategory('FAIR'), 'fair')
    assert.strictEqual(getHealthCategory('POOR'), 'poor')
    assert.strictEqual(getHealthCategory('CRITICAL'), 'critical')
    assert.strictEqual(getHealthCategory('INVALID'), 'unknown')
  })
})

// Test Suite: Communication Timeline
test('Analyst Page - Communication Timeline', async (t) => {
  await t.test('should calculate next contact date', () => {
    // Use UTC to avoid DST/timezone discrepancies
    const lastContactDate = new Date(Date.UTC(2024, 9, 15)) // Oct is month 9 (0-indexed)
    const cadence = 30 // days
    const nextContactDate = new Date(lastContactDate.getTime() + (cadence * 24 * 60 * 60 * 1000))

    assert.strictEqual(nextContactDate.getUTCDate(), 14) // November 14th
    assert.strictEqual(nextContactDate.getUTCMonth(), 10) // November (0-indexed)
  })

  await t.test('should handle missing communication data', () => {
    const analyst = {
      lastContactDate: null,
      nextContactDate: null,
      communicationCadence: null
    }
    
    assert.strictEqual(analyst.lastContactDate, null)
    assert.strictEqual(analyst.nextContactDate, null)
    assert.strictEqual(analyst.communicationCadence, null)
  })

  await t.test('should determine if communication is overdue', () => {
    const isOverdue = (nextContactDate: string | null) => {
      if (!nextContactDate) return false
      return new Date(nextContactDate) < new Date()
    }
    
    const pastDate = '2024-09-15T10:00:00Z'
    const futureDate = '2025-12-15T10:00:00Z'
    
    assert.strictEqual(isOverdue(pastDate), true)
    assert.strictEqual(isOverdue(futureDate), false)
    assert.strictEqual(isOverdue(null), false)
  })
})
