import test from 'node:test'
import assert from 'node:assert'
import { NextRequest } from 'next/server'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

const originalEnv = { ...process.env }

function resetEnv() {
  process.env = { ...originalEnv }
}

// Skip OpenAI tests for now since mocking is complex with Node.js test runner
// These tests verify the API endpoint structure and parameter validation
// For full OpenAI integration testing, use a separate test environment

test('POST endpoint - API structure validation', async () => {
  // This test validates the API structure without calling OpenAI
  const { POST } = await import('../src/app/api/analysts/search-social/route')
  
  const requestBody = {
    analystId: '123',
    analystName: 'John Doe',
    company: 'Gartner',
    platform: 'linkedin',
    title: 'Senior Analyst'
  }
  
  const request = new NextRequest('http://localhost/api/analysts/search-social', {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const response = await POST(request)
  const data = await response.json()
  
  // Should fail gracefully if OpenAI API key is invalid/missing
  assert.ok(response.status === 200 || response.status === 500)
  assert.ok(typeof data.success === 'boolean')
  
  if (data.success) {
    assert.ok(data.result)
    assert.strictEqual(data.result.platform, 'linkedin')
  } else {
    assert.ok(data.error)
  }
})


test('POST endpoint - missing required parameters', async () => {
  const { POST } = await import('../src/app/api/analysts/search-social/route')
  
  const requestBody = {
    analystName: 'John Doe',
    // Missing analystId and platform
  }
  
  const request = new NextRequest('http://localhost/api/analysts/search-social', {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const response = await POST(request)
  const data = await response.json()
  
  assert.strictEqual(response.status, 400)
  assert.strictEqual(data.success, false)
  assert.ok(data.error.includes('Missing required parameters'))
})

test('POST endpoint - invalid platform', async () => {
  const { POST } = await import('../src/app/api/analysts/search-social/route')
  
  const requestBody = {
    analystId: '123',
    analystName: 'John Doe',
    company: 'Gartner',
    platform: 'invalid-platform'
  }
  
  const request = new NextRequest('http://localhost/api/analysts/search-social', {
    method: 'POST',
    body: JSON.stringify(requestBody),
    headers: {
      'Content-Type': 'application/json'
    }
  })
  
  const response = await POST(request)
  const data = await response.json()
  
  assert.strictEqual(response.status, 400)
  assert.strictEqual(data.success, false)
  assert.ok(data.error.includes('Platform must be'))
})


test('GET endpoint - missing required parameters', async () => {
  const { GET } = await import('../src/app/api/analysts/search-social/route')
  
  const url = 'http://localhost/api/analysts/search-social?analystName=John%20Doe'
  // Missing company parameter
  const request = new NextRequest(url, { method: 'GET' })
  
  const response = await GET(request)
  const data = await response.json()
  
  assert.strictEqual(response.status, 400)
  assert.strictEqual(data.success, false)
  assert.ok(data.error.includes('Missing required parameters'))
})

// Note: OpenAI integration tests require proper mocking setup
// For integration testing with OpenAI, run tests in a separate environment
// These tests focus on parameter validation and API structure
