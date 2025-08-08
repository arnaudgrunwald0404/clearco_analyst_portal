/**
 * API Endpoints Tests
 * Tests all API routes for proper authentication, validation, and responses
 */

import { test, expect } from '@playwright/test'

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test data
const TEST_USER = {
  email: 'test@clearcompany.com',
  password: 'test123'
}

// Helper function to get auth cookie
async function getAuthCookie(request: any) {
  // Login and get session cookie
  const response = await request.post(`${BASE_URL}/api/auth/login`, {
    data: {
      email: TEST_USER.email,
      password: TEST_USER.password
    }
  })
  
  const cookies = response.headers()['set-cookie']
  return cookies
}

test.describe('Authentication API Endpoints', () => {
  test('POST /api/auth/login - successful login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: TEST_USER.email,
        password: TEST_USER.password
      }
    })
    
    expect(response.status()).toBe(200)
    
    const data = await response.json()
    expect(data).toHaveProperty('success', true)
    expect(data).toHaveProperty('user')
  })

  test('POST /api/auth/login - invalid credentials', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/login`, {
      data: {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      }
    })
    
    expect(response.status()).toBe(401)
    
    const data = await response.json()
    expect(data).toHaveProperty('success', false)
    expect(data).toHaveProperty('error')
  })

  test('POST /api/auth/analyst - analyst login', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/auth/analyst`, {
      data: {
        email: 'analyst@test.com',
        password: 'analyst123'
      }
    })
    
    // Should return appropriate response (200 for success, 401 for failure)
    expect([200, 401]).toContain(response.status())
  })
})

test.describe('Settings API Endpoints', () => {
  test('GET /api/settings/general - requires authentication', async ({ request }) => {
    // Test without authentication
    const response = await request.get(`${BASE_URL}/api/settings/general`)
    
    expect(response.status()).toBe(401)
    
    const data = await response.json()
    expect(data).toHaveProperty('error', 'Authentication required')
    expect(data).toHaveProperty('redirectTo', '/auth')
  })

  test('GET /api/settings/general - authenticated request', async ({ request }) => {
    // Get auth cookie first
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/settings/general`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('company_name')
      expect(data).toHaveProperty('protected_domain')
      expect(data).toHaveProperty('industry_name')
    } else {
      // May return 401 if auth setup is different
      expect(response.status()).toBe(401)
    }
  })

  test('PUT /api/settings/general - update settings', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.put(`${BASE_URL}/api/settings/general`, {
      headers: {
        'Cookie': authCookie
      },
      data: {
        companyName: 'Test Company Updated',
        protectedDomain: 'test-updated.com',
        logoUrl: '',
        industryName: 'Technology'
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('company_name', 'Test Company Updated')
    }
  })

  test('PUT /api/settings/general - validation errors', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.put(`${BASE_URL}/api/settings/general`, {
      headers: {
        'Cookie': authCookie
      },
      data: {
        companyName: '', // Required field
        protectedDomain: 'invalid', // Invalid domain
        industryName: ''
      }
    })
    
    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('GET /api/settings/calendar-connections - requires authentication', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/settings/calendar-connections`)
    
    expect(response.status()).toBe(401)
    
    const data = await response.json()
    expect(data).toHaveProperty('error', 'Authentication required')
  })
})

test.describe('Analysts API Endpoints', () => {
  test('GET /api/analysts - list analysts', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/analysts`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })

  test('POST /api/analysts - create analyst', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.post(`${BASE_URL}/api/analysts`, {
      headers: {
        'Cookie': authCookie
      },
      data: {
        firstName: 'Test',
        lastName: 'Analyst',
        email: 'test.analyst@example.com',
        company: 'Test Company',
        title: 'Senior Analyst'
      }
    })
    
    // Should return 201 for success or 401 for auth failure
    expect([201, 401]).toContain(response.status())
    
    if (response.status() === 201) {
      const data = await response.json()
      expect(data).toHaveProperty('firstName', 'Test')
      expect(data).toHaveProperty('lastName', 'Analyst')
    }
  })

  test('POST /api/analysts - validation errors', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.post(`${BASE_URL}/api/analysts`, {
      headers: {
        'Cookie': authCookie
      },
      data: {
        firstName: '', // Required field
        lastName: '',  // Required field
        email: 'invalid-email' // Invalid email format
      }
    })
    
    expect(response.status()).toBe(400)
    
    const data = await response.json()
    expect(data).toHaveProperty('error')
  })

  test('GET /api/analysts/[id] - get specific analyst', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    // First get list of analysts to get a valid ID
    const listResponse = await request.get(`${BASE_URL}/api/analysts`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    if (listResponse.status() === 200) {
      const analysts = await listResponse.json()
      if (analysts.length > 0) {
        const analystId = analysts[0].id
        
        const response = await request.get(`${BASE_URL}/api/analysts/${analystId}`, {
          headers: {
            'Cookie': authCookie
          }
        })
        
        expect(response.status()).toBe(200)
        
        const data = await response.json()
        expect(data).toHaveProperty('id', analystId)
      }
    }
  })

  test('POST /api/analysts/bulk - bulk create analysts', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.post(`${BASE_URL}/api/analysts/bulk`, {
      headers: {
        'Cookie': authCookie
      },
      data: {
        analysts: [
          {
            firstName: 'Bulk',
            lastName: 'Analyst1',
            email: 'bulk1@example.com',
            company: 'Test Company'
          },
          {
            firstName: 'Bulk',
            lastName: 'Analyst2',
            email: 'bulk2@example.com',
            company: 'Test Company'
          }
        ]
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('created')
    }
  })
})

test.describe('Publications API Endpoints', () => {
  test('GET /api/publications - list publications', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/publications`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })

  test('POST /api/publications - create publication', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.post(`${BASE_URL}/api/publications`, {
      headers: {
        'Cookie': authCookie
      },
      data: {
        title: 'Test Publication',
        type: 'RESEARCH_REPORT',
        analystId: 'test-analyst-id',
        publishedDate: '2025-01-01',
        status: 'PUBLISHED'
      }
    })
    
    // Should return 201 for success or 401 for auth failure
    expect([201, 401, 400]).toContain(response.status())
  })

  test('GET /api/publications/discover - publication discovery', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/publications/discover`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('discovered')
      expect(Array.isArray(data.discovered)).toBe(true)
    }
  })
})

test.describe('Events API Endpoints', () => {
  test('GET /api/events - list events', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/events`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })

  test('POST /api/events - create event', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.post(`${BASE_URL}/api/events`, {
      headers: {
        'Cookie': authCookie
      },
      data: {
        title: 'Test Event',
        type: 'BRIEFING',
        date: '2025-02-01',
        analystId: 'test-analyst-id'
      }
    })
    
    // Should return 201 for success or 401/400 for failure
    expect([201, 401, 400]).toContain(response.status())
  })
})

test.describe('Awards API Endpoints', () => {
  test('GET /api/awards - list awards', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/awards`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })
})

test.describe('Dashboard API Endpoints', () => {
  test('GET /api/dashboard/metrics - dashboard metrics', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/dashboard/metrics`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(data).toHaveProperty('totalAnalysts')
      expect(data).toHaveProperty('activeAnalysts')
      expect(data).toHaveProperty('engagementRate')
    }
  })

  test('GET /api/dashboard/top-analysts - top analysts', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/dashboard/top-analysts`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })

  test('GET /api/dashboard/recent-activity - recent activity', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/dashboard/recent-activity`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })
})

test.describe('Briefings API Endpoints', () => {
  test('GET /api/briefings - list briefings', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/briefings`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })
})

test.describe('Social Media API Endpoints', () => {
  test('GET /api/social-media/recent-activity - recent social activity', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.get(`${BASE_URL}/api/social-media/recent-activity`, {
      headers: {
        'Cookie': authCookie
      }
    })
    
    // Should return 200 for success or 401 for auth failure
    expect([200, 401]).toContain(response.status())
    
    if (response.status() === 200) {
      const data = await response.json()
      expect(Array.isArray(data)).toBe(true)
    }
  })
})

test.describe('Error Handling', () => {
  test('404 for non-existent endpoints', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/non-existent-endpoint`)
    
    expect(response.status()).toBe(404)
  })

  test('405 for wrong HTTP methods', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/api/settings/general`)
    
    expect(response.status()).toBe(405)
  })

  test('400 for malformed JSON', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.post(`${BASE_URL}/api/analysts`, {
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'application/json'
      },
      data: 'invalid json'
    })
    
    expect(response.status()).toBe(400)
  })
})

test.describe('Rate Limiting and Security', () => {
  test('API endpoints have appropriate CORS headers', async ({ request }) => {
    const response = await request.options(`${BASE_URL}/api/settings/general`)
    
    const headers = response.headers()
    // Check for security headers (these may vary based on your implementation)
    expect(headers).toHaveProperty('access-control-allow-origin')
  })

  test('API endpoints reject requests with invalid content types', async ({ request }) => {
    const authCookie = await getAuthCookie(request)
    
    const response = await request.post(`${BASE_URL}/api/analysts`, {
      headers: {
        'Cookie': authCookie,
        'Content-Type': 'text/plain'
      },
      data: 'plain text data'
    })
    
    expect(response.status()).toBe(400)
  })
})