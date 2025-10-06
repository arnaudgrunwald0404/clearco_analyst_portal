import { NextRequest } from 'next/server'
import { POST } from '@/app/api/admin/remove-analyst-access/route'

// Mock dependencies
jest.mock('@/lib/supabase/service')
jest.mock('@/lib/auth-utils')

const mockSupabase = {
  from: jest.fn(),
  auth: {
    admin: {
      listUsers: jest.fn(),
      deleteUser: jest.fn()
    }
  }
}

const mockRequireSuperAdminAuth = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  
  // Setup default mocks
  const { createServiceClient } = require('@/lib/supabase/service')
  const { requireSuperAdminAuth } = require('@/lib/auth-utils')
  
  ;(createServiceClient as jest.Mock).mockReturnValue(mockSupabase)
  ;(requireSuperAdminAuth as jest.Mock).mockImplementation(mockRequireSuperAdminAuth)
})

describe('/api/admin/remove-analyst-access', () => {
  describe('Authentication', () => {
    it('should require super admin authentication', async () => {
      const mockResponse = new Response('Unauthorized', { status: 401 })
      mockRequireSuperAdminAuth.mockResolvedValue(mockResponse)

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1'] })
      })

      const response = await POST(request)
      
      expect(mockRequireSuperAdminAuth).toHaveBeenCalled()
      expect(response.status).toBe(401)
    })

    it('should proceed when super admin auth succeeds', async () => {
      mockRequireSuperAdminAuth.mockResolvedValue(null) // Success case
      
      // Mock empty analysts result to avoid further processing
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1'] })
      })

      const response = await POST(request)
      
      expect(mockRequireSuperAdminAuth).toHaveBeenCalled()
      expect(response.status).toBe(404) // No analysts found
    })
  })

  describe('Input Validation', () => {
    beforeEach(() => {
      mockRequireSuperAdminAuth.mockResolvedValue(null)
    })

    it('should reject empty analyst IDs array', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: [] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid analyst IDs provided')
    })

    it('should reject missing analyst IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({})
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid analyst IDs provided')
    })

    it('should reject non-array analyst IDs', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: 'not-an-array' })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid analyst IDs provided')
    })
  })

  describe('Analyst Data Fetching', () => {
    beforeEach(() => {
      mockRequireSuperAdminAuth.mockResolvedValue(null)
    })

    it('should handle database error when fetching analysts', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database connection failed' }
          })
        })
      })

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

    it('should handle case when no analysts are found', async () => {
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: [],
            error: null
          })
        })
      })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['non-existent-analyst'] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(404)
      expect(data.success).toBe(false)
      expect(data.error).toBe('No analysts found')
    })
  })

  describe('Access Removal Process', () => {
    const mockAnalysts = [
      {
        id: 'analyst-1',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe'
      },
      {
        id: 'analyst-2',
        email: 'jane.smith@example.com',
        firstName: 'Jane',
        lastName: 'Smith'
      }
    ]

    const mockAuthUsers = [
      {
        id: 'auth-user-1',
        email: 'john.doe@example.com'
      },
      {
        id: 'auth-user-2',
        email: 'jane.smith@example.com'
      }
    ]

    beforeEach(() => {
      mockRequireSuperAdminAuth.mockResolvedValue(null)
      
      // Mock successful analyst fetch
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          in: jest.fn().mockResolvedValue({
            data: mockAnalysts,
            error: null
          })
        })
      })
    })

    it('should successfully remove access for all analysts', async () => {
      // Mock auth users list
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockAuthUsers }
      })

      // Mock successful deletions
      mockSupabase.auth.admin.deleteUser
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: null })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1', 'analyst-2'] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.removedCount).toBe(2)
      expect(data.message).toBe('Successfully removed access for 2 analysts')
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledTimes(2)
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-user-1')
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-user-2')
    })

    it('should handle partial success when some deletions fail', async () => {
      // Mock auth users list
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: mockAuthUsers }
      })

      // Mock one successful and one failed deletion
      mockSupabase.auth.admin.deleteUser
        .mockResolvedValueOnce({ error: null })
        .mockResolvedValueOnce({ error: { message: 'User deletion failed' } })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1', 'analyst-2'] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.removedCount).toBe(1)
      expect(data.partialSuccess).toBe(true)
      expect(data.errors).toHaveLength(1)
      expect(data.errors[0]).toContain('Jane Smith')
      expect(data.message).toBe('Successfully removed access for 1 analyst')
    })

    it('should skip analysts without email addresses', async () => {
      const analystsWithoutEmail = [
        { ...mockAnalysts[0] },
        { ...mockAnalysts[1], email: null }
      ]

      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: analystsWithoutEmail,
            error: null
          })
        })
      })

      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [mockAuthUsers[0]] }
      })

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1', 'analyst-2'] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.removedCount).toBe(1)
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledTimes(1)
    })

    it('should skip analysts without corresponding auth users', async () => {
      // Mock auth users list with only one user
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [mockAuthUsers[0]] }
      })

      mockSupabase.auth.admin.deleteUser.mockResolvedValue({ error: null })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1', 'analyst-2'] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.removedCount).toBe(1)
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledTimes(1)
      expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith('auth-user-1')
    })

    it('should handle case when no auth users are found', async () => {
      mockSupabase.auth.admin.listUsers.mockResolvedValue({
        data: { users: [] }
      })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1', 'analyst-2'] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.removedCount).toBe(0)
      expect(mockSupabase.auth.admin.deleteUser).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockRequireSuperAdminAuth.mockResolvedValue(null)
    })

    it('should handle unexpected errors gracefully', async () => {
      mockSupabase.from.mockImplementation(() => {
        throw new Error('Unexpected database error')
      })

      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: JSON.stringify({ analystIds: ['analyst-1'] })
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed JSON in request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/admin/remove-analyst-access', {
        method: 'POST',
        body: 'invalid-json'
      })

      const response = await POST(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Internal server error')
    })
  })
})
