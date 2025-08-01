/**
 * Comprehensive tests for Supabase-migrated APIs
 * These tests verify that all APIs work correctly after Prisma removal
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test data
const testAnalyst = {
  firstName: 'Test',
  lastName: 'Analyst',
  email: `test-analyst-${Date.now()}@example.com`,
  company: 'Test Company',
  type: 'Analyst' as const,
  influence: 'MEDIUM' as const
}

const testBriefing = {
  title: `Test Briefing ${Date.now()}`,
  description: 'Test briefing description',
  scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
  duration: 60
}

const testActionItem = {
  title: `Test Action Item ${Date.now()}`,
  description: 'Test action item description',
  priority: 'HIGH' as const,
  status: 'PENDING' as const
}

let createdAnalystId: string
let createdBriefingId: string
let createdActionItemId: string

describe('Supabase API Tests', () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData()
  })

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData()
  })

  describe('Analysts API (/api/analysts)', () => {
    test('GET /api/analysts - should fetch analysts successfully', async () => {
      const response = await fetch(`${baseUrl}/api/analysts`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
    })

    test('POST /api/analysts - should create new analyst', async () => {
      const response = await fetch(`${baseUrl}/api/analysts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testAnalyst)
      })
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.email).toBe(testAnalyst.email)
      
      createdAnalystId = data.data.id
    })

    test('GET /api/analysts with filters - should filter correctly', async () => {
      const response = await fetch(`${baseUrl}/api/analysts?status=ACTIVE&type=Analyst`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      // All returned analysts should have status ACTIVE and type Analyst
      data.forEach((analyst: any) => {
        expect(analyst.status).toBe('ACTIVE')
        expect(analyst.type).toBe('Analyst')
      })
    })
  })

  describe('Briefings API (/api/briefings)', () => {
    test('GET /api/briefings - should fetch briefings successfully', async () => {
      const response = await fetch(`${baseUrl}/api/briefings`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('POST /api/briefings - should create new briefing', async () => {
      const briefingData = {
        ...testBriefing,
        analystIds: createdAnalystId ? [createdAnalystId] : []
      }
      
      const response = await fetch(`${baseUrl}/api/briefings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(briefingData)
      })
      const data = await response.json()
      
      expect(response.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe(testBriefing.title)
      
      createdBriefingId = data.data.id
    })

    test('GET /api/briefings with filters - should filter by status', async () => {
      const response = await fetch(`${baseUrl}/api/briefings?status=SCHEDULED`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // All returned briefings should have status SCHEDULED
      data.data.forEach((briefing: any) => {
        expect(briefing.status).toBe('SCHEDULED')
      })
    })
  })

  describe('Action Items API (/api/action-items)', () => {
    test('GET /api/action-items - should fetch action items successfully', async () => {
      const response = await fetch(`${baseUrl}/api/action-items`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(Array.isArray(data.data)).toBe(true)
    })

    test('POST /api/action-items - should create new action item', async () => {
      const actionItemData = {
        ...testActionItem,
        analystId: createdAnalystId,
        briefingId: createdBriefingId
      }
      
      const response = await fetch(`${baseUrl}/api/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(actionItemData)
      })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.title).toBe(testActionItem.title)
      
      createdActionItemId = data.data.id
    })

    test('GET /api/action-items with status filter - should filter correctly', async () => {
      const response = await fetch(`${baseUrl}/api/action-items?status=pending`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // All returned items should be pending or in progress
      data.data.forEach((item: any) => {
        expect(['PENDING', 'IN_PROGRESS']).toContain(item.status)
      })
    })
  })

  describe('Dashboard Metrics API (/api/dashboard/metrics)', () => {
    test('GET /api/dashboard/metrics - should fetch metrics successfully', async () => {
      const response = await fetch(`${baseUrl}/api/dashboard/metrics`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(typeof data.totalAnalysts).toBe('number')
      expect(typeof data.activeAnalysts).toBe('number')
      expect(typeof data.totalBriefings).toBe('number')
      expect(typeof data.upcomingBriefings).toBe('number')
      expect(Array.isArray(data.analystsByInfluence)).toBe(true)
      expect(Array.isArray(data.analystsByType)).toBe(true)
    })
  })

  describe('Social Media API (/api/social-media/recent-activity)', () => {
    test('GET /api/social-media/recent-activity - should fetch social activity', async () => {
      const response = await fetch(`${baseUrl}/api/social-media/recent-activity?limit=5`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data.posts)).toBe(true)
      expect(typeof data.todayPosts).toBe('number')
      expect(typeof data.weekPosts).toBe('number')
    })
  })

  describe('General Settings API (/api/settings/general)', () => {
    test('GET /api/settings/general - should fetch settings successfully', async () => {
      const response = await fetch(`${baseUrl}/api/settings/general`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(typeof data.companyName).toBe('string')
      expect(typeof data.protectedDomain).toBe('string')
      expect(typeof data.industryName).toBe('string')
    })

    test('PUT /api/settings/general - should update settings', async () => {
      const updatedSettings = {
        companyName: 'Test Company Updated',
        protectedDomain: 'testcompany.com',
        logoUrl: '/test-logo.png',
        industryName: 'Test Industry'
      }
      
      const response = await fetch(`${baseUrl}/api/settings/general`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.companyName).toBe(updatedSettings.companyName)
      expect(data.protectedDomain).toBe(updatedSettings.protectedDomain)
    })
  })

  describe('Influence Tiers API (/api/settings/influence-tiers)', () => {
    test('GET /api/settings/influence-tiers - should fetch tiers successfully', async () => {
      const response = await fetch(`${baseUrl}/api/settings/influence-tiers`)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    test('POST /api/settings/influence-tiers - should update tiers', async () => {
      const testTiers = [
        { name: 'VERY_HIGH', color: '#dc2626', briefingFrequency: 30, touchpointFrequency: 15, order: 1, isActive: true },
        { name: 'HIGH', color: '#ea580c', briefingFrequency: 60, touchpointFrequency: 30, order: 2, isActive: true },
        { name: 'MEDIUM', color: '#ca8a04', briefingFrequency: 90, touchpointFrequency: 45, order: 3, isActive: true },
        { name: 'LOW', color: '#16a34a', briefingFrequency: -1, touchpointFrequency: -1, order: 4, isActive: true }
      ]
      
      const response = await fetch(`${baseUrl}/api/settings/influence-tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiers: testTiers })
      })
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.tiers).toHaveLength(4)
    })
  })

  describe('Logo Upload API (/api/upload/logo)', () => {
    test('POST /api/upload/logo - should handle missing file', async () => {
      const formData = new FormData()
      
      const response = await fetch(`${baseUrl}/api/upload/logo`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('No file provided')
    })

    test('POST /api/upload/logo - should validate file type', async () => {
      const formData = new FormData()
      const textFile = new Blob(['test content'], { type: 'text/plain' })
      formData.append('logo', textFile, 'test.txt')
      
      const response = await fetch(`${baseUrl}/api/upload/logo`, {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toContain('Invalid file type')
    })
  })
})

// Helper function to clean up test data
async function cleanupTestData() {
  try {
    // Clean up in reverse order due to foreign key constraints
    if (createdActionItemId) {
      await supabase.from('action_items').delete().eq('id', createdActionItemId)
    }
    
    if (createdBriefingId) {
      await supabase.from('briefing_analysts').delete().eq('briefingId', createdBriefingId)
      await supabase.from('briefings').delete().eq('id', createdBriefingId)
    }
    
    if (createdAnalystId) {
      await supabase.from('analysts').delete().eq('id', createdAnalystId)
    }
    
    // Clean up any test analysts by email pattern
    await supabase.from('analysts').delete().like('email', 'test-analyst-%@example.com')
    
    // Clean up any test briefings by title pattern
    await supabase.from('briefings').delete().like('title', 'Test Briefing %')
    
    // Clean up any test action items by title pattern
    await supabase.from('action_items').delete().like('title', 'Test Action Item %')
    
  } catch (error) {
    console.warn('Cleanup failed:', error)
  }
} 