/**
 * Simple integration test for the bulk delete API endpoint
 * This test focuses on the core functionality without complex mocking
 */

import { NextRequest } from 'next/server'

// Mock the auth check to always pass
jest.mock('@/lib/auth-utils', () => ({
  requireSuperAdminAuth: jest.fn().mockResolvedValue(null)
}))

// Mock Supabase service client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      in: jest.fn().mockResolvedValue({
        data: [
          {
            id: 'analyst-1',
            email: 'john.doe@example.com',
            firstName: 'John',
            lastName: 'Doe'
          }
        ],
        error: null
      })
    }))
  })),
  auth: {
    admin: {
      listUsers: jest.fn().mockResolvedValue({
        data: { 
          users: [
            {
              id: 'auth-user-1',
              email: 'john.doe@example.com'
            }
          ]
        }
      }),
      deleteUser: jest.fn().mockResolvedValue({ error: null })
    }
  }
}

jest.mock('@/lib/supabase/service', () => ({
  createServiceClient: jest.fn(() => mockSupabaseClient)
}))

describe('Bulk Delete API - Core Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should validate input correctly', async () => {
    const { POST } = require('@/app/api/admin/remove-analyst-access/route')
    
    // Test empty array
    const request1 = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
      method: 'POST',
      body: JSON.stringify({ analystIds: [] })
    })

    const response1 = await POST(request1)
    const data1 = await response1.json()
    
    expect(response1.status).toBe(400)
    expect(data1.success).toBe(false)
    expect(data1.error).toBe('Invalid analyst IDs provided')
  })

  it('should handle successful deletion', async () => {
    const { POST } = require('@/app/api/admin/remove-analyst-access/route')
    
    const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
      method: 'POST',
      body: JSON.stringify({ analystIds: ['analyst-1'] })
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.removedCount).toBe(1)
    expect(mockSupabaseClient.auth.admin.deleteUser).toHaveBeenCalledWith('auth-user-1')
  })

  it('should handle case when no analysts found', async () => {
    // Mock empty result
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        in: jest.fn().mockResolvedValue({
          data: [],
          error: null
        })
      }))
    })

    const { POST } = require('@/app/api/admin/remove-analyst-access/route')
    
    const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
      method: 'POST',
      body: JSON.stringify({ analystIds: ['non-existent'] })
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(404)
    expect(data.success).toBe(false)
    expect(data.error).toBe('No analysts found')
  })

  it('should handle database errors', async () => {
    // Mock database error
    mockSupabaseClient.from.mockReturnValue({
      select: jest.fn(() => ({
        in: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        })
      }))
    })

    const { POST } = require('@/app/api/admin/remove-analyst-access/route')
    
    const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
      method: 'POST',
      body: JSON.stringify({ analystIds: ['analyst-1'] })
    })

    const response = await POST(request)
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toBe('Failed to fetch analyst data')
  })
})
