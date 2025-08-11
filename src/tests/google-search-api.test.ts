import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { GoogleSearchEngine } from '@/lib/publication-discovery/search-engines'

describe('GoogleSearchEngine', () => {
  const originalEnv = process.env

  beforeEach(() => {
    // Clear environment variables before each test
    jest.resetModules()
    process.env = { ...originalEnv }
    jest.restoreAllMocks()
  })

  afterEach(() => {
    // Restore environment variables after each test
    process.env = originalEnv
    jest.restoreAllMocks()
  })

  describe('Configuration', () => {
    it('should handle missing API key', () => {
      // Remove API key from environment
      delete process.env.GOOGLE_SEARCH_API_KEY
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-engine-id'

      const searchEngine = new GoogleSearchEngine()
      expect(searchEngine.isConfigured()).toBe(false)
    })

    it('should handle missing search engine ID', () => {
      // Remove search engine ID from environment
      process.env.GOOGLE_SEARCH_API_KEY = 'test-api-key'
      delete process.env.GOOGLE_SEARCH_ENGINE_ID

      const searchEngine = new GoogleSearchEngine()
      expect(searchEngine.isConfigured()).toBe(false)
    })

    it('should be properly configured with both API key and search engine ID', () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-api-key'
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-engine-id'

      const searchEngine = new GoogleSearchEngine()
      expect(searchEngine.isConfigured()).toBe(true)
    })
  })

  describe('Search Functionality', () => {
    beforeEach(() => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-api-key'
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-engine-id'
    })

    it('should return empty array when not configured', async () => {
      delete process.env.GOOGLE_SEARCH_API_KEY
      const searchEngine = new GoogleSearchEngine()
      const results = await searchEngine.search('test query')
      expect(results).toEqual([])
    })

    it('should handle API errors gracefully', async () => {
      const searchEngine = new GoogleSearchEngine()
      
      // Mock fetch to simulate API error
      global.fetch = jest.fn().mockRejectedValue(new Error('API Error')) as any
      
      const results = await searchEngine.search('test query')
      expect(results).toEqual([])
    })

    it('should handle empty API response', async () => {
      const searchEngine = new GoogleSearchEngine()
      
      // Mock fetch to return empty items
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] })
      }) as any
      
      const results = await searchEngine.search('test query')
      expect(results).toEqual([])
    })

    it('should transform Google results correctly', async () => {
      const searchEngine = new GoogleSearchEngine()
      
      const mockApiResponse = {
        items: [{
          title: 'Test Title',
          link: 'https://example.com/article',
          snippet: 'Test snippet',
          pagemap: {
            metatags: [{
              'article:published_time': '2023-01-01'
            }]
          }
        }]
      }

      // Mock fetch to return test data
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockApiResponse)
      }) as any
      
      const results = await searchEngine.search('test query')
      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        title: 'Test Title',
        url: 'https://example.com/article',
        snippet: 'Test snippet',
        publishedDate: '2023-01-01',
        source: 'Google Search',
        domain: 'example.com',
        searchEngine: 'google'
      })
    })

    it('should respect maxResults parameter', async () => {
      const searchEngine = new GoogleSearchEngine()
      const maxResults = 5
      
      // Mock fetch to verify the URL contains the correct num parameter
      global.fetch = jest.fn().mockImplementation((url) => {
        expect(url as string).toContain(`num=${maxResults}`)
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [] })
        })
      }) as any
      
      await searchEngine.search('test query', maxResults)
      expect(fetch).toHaveBeenCalled()
    })

    it('should handle non-200 API responses', async () => {
      const searchEngine = new GoogleSearchEngine()
      
      // Mock fetch to return a 403 error
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403
      }) as any
      
      const results = await searchEngine.search('test query')
      expect(results).toEqual([])
    })

    it('should enforce rate limiting', async () => {
      const searchEngine = new GoogleSearchEngine()
      const startTime = Date.now()
      
      // Mock fetch to return success
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ items: [] })
      }) as any
      
      // Make two consecutive requests
      await searchEngine.search('query 1')
      await searchEngine.search('query 2')
      
      const timeDiff = Date.now() - startTime
      expect(timeDiff).toBeGreaterThanOrEqual(1000) // Assuming 1 second rate limit
    })
  })

  describe('URL Construction', () => {
    it('should construct valid search URLs', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-api-key'
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-engine-id'
      
      const searchEngine = new GoogleSearchEngine()
      
      // Mock fetch to capture and verify the URL
      global.fetch = jest.fn().mockImplementation((url) => {
        const u = String(url)
        expect(u).toMatch(/^https:\/\/www\.googleapis\.com\/customsearch\/v1/)
        expect(u).toContain('key=test-api-key')
        expect(u).toContain('cx=test-engine-id')
        expect(u).toContain('q=test%20query') // URL encoded query
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [] })
        })
      }) as any
      
      await searchEngine.search('test query')
      expect(fetch).toHaveBeenCalled()
    })

    it('should properly encode special characters in search query', async () => {
      process.env.GOOGLE_SEARCH_API_KEY = 'test-api-key'
      process.env.GOOGLE_SEARCH_ENGINE_ID = 'test-engine-id'
      const searchEngine = new GoogleSearchEngine()
      const specialQuery = 'test \u0026 query + special!'
      
      // Mock fetch to verify URL encoding
      global.fetch = jest.fn().mockImplementation((url) => {
        expect(String(url)).toContain(encodeURIComponent(specialQuery))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ items: [] })
        })
      }) as any
      
      await searchEngine.search(specialQuery)
      expect(fetch).toHaveBeenCalled()
    })
  })
})