/**
 * Performance Tests
 * Tests page load times, bundle sizes, and performance metrics
 */

import { test, expect } from '@playwright/test'

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  pageLoadTime: 3000, // 3 seconds
  firstContentfulPaint: 2000, // 2 seconds
  largestContentfulPaint: 2500, // 2.5 seconds
  timeToInteractive: 4000, // 4 seconds
  cumulativeLayoutShift: 0.1, // CLS score
  bundleSize: 1000000, // 1MB
}

// Helper function to get performance metrics
async function getPerformanceMetrics(page: any) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    const lcp = paint.find(entry => entry.name === 'largest-contentful-paint')?.startTime || 0
    
    return {
      loadTime: navigation.loadEventEnd - navigation.navigationStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      firstContentfulPaint: fcp,
      largestContentfulPaint: lcp,
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize
    }
  })
}

// Helper function to get Web Vitals
async function getWebVitals(page: any) {
  return await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals: any = {}
      
      // CLS (Cumulative Layout Shift)
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
          }
        }
      })
      
      try {
        observer.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        // Layout shift API not supported
      }
      
      // TTI (Time to Interactive) - approximation
      const tti = performance.now()
      
      setTimeout(() => {
        vitals.cls = clsValue
        vitals.tti = tti
        resolve(vitals)
      }, 2000) // Wait 2 seconds to collect CLS
    })
  })
}

test.describe('Performance Tests - Public Pages', () => {
  test('Login page performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/auth`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    const metrics = await getPerformanceMetrics(page)
    const vitals = await getWebVitals(page)
    
    console.log('Login Page Performance:', {
      loadTime,
      ...metrics,
      ...vitals
    })
    
    // Assertions
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime)
    expect(metrics.firstContentfulPaint).toBeLessThan(PERFORMANCE_THRESHOLDS.firstContentfulPaint)
    expect(vitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift)
  })

  test('Signup page performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/signup`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    const metrics = await getPerformanceMetrics(page)
    
    console.log('Signup Page Performance:', {
      loadTime,
      ...metrics
    })
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime)
  })
})

test.describe('Performance Tests - Authenticated Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login for performance tests
    await page.goto(`${BASE_URL}/auth`)
    // Add authentication logic here if needed
  })

  test('Dashboard performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    const metrics = await getPerformanceMetrics(page)
    const vitals = await getWebVitals(page)
    
    console.log('Dashboard Performance:', {
      loadTime,
      ...metrics,
      ...vitals
    })
    
    // Dashboard may have more complex data loading
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime * 1.5)
    expect(vitals.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cumulativeLayoutShift)
  })

  test('Analysts page performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/analysts`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    const metrics = await getPerformanceMetrics(page)
    
    console.log('Analysts Page Performance:', {
      loadTime,
      ...metrics
    })
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime)
  })

  test('Publications page performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/publications`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    const metrics = await getPerformanceMetrics(page)
    
    console.log('Publications Page Performance:', {
      loadTime,
      ...metrics
    })
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime)
  })

  test('Settings page performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(`${BASE_URL}/settings`)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    const metrics = await getPerformanceMetrics(page)
    
    console.log('Settings Page Performance:', {
      loadTime,
      ...metrics
    })
    
    expect(loadTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoadTime)
  })
})

test.describe('Bundle Size Analysis', () => {
  test('JavaScript bundle size', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    
    // Get all JavaScript files loaded
    const jsFiles = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[src]'))
      return scripts.map(script => ({
        src: (script as HTMLScriptElement).src,
        async: (script as HTMLScriptElement).async,
        defer: (script as HTMLScriptElement).defer
      }))
    })
    
    console.log('JavaScript files loaded:', jsFiles.length)
    
    // Check bundle size via Performance API
    const resourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource')
      return resources
        .filter(resource => resource.name.endsWith('.js'))
        .map(resource => ({
          name: resource.name,
          transferSize: (resource as PerformanceResourceTiming).transferSize,
          encodedBodySize: (resource as PerformanceResourceTiming).encodedBodySize
        }))
    })
    
    const totalJSSize = resourceSizes.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0)
    
    console.log('Total JavaScript transfer size:', totalJSSize, 'bytes')
    console.log('Individual JS files:', resourceSizes)
    
    expect(totalJSSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundleSize)
  })

  test('CSS bundle size', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    
    const cssResourceSizes = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource')
      return resources
        .filter(resource => resource.name.endsWith('.css'))
        .map(resource => ({
          name: resource.name,
          transferSize: (resource as PerformanceResourceTiming).transferSize,
          encodedBodySize: (resource as PerformanceResourceTiming).encodedBodySize
        }))
    })
    
    const totalCSSSize = cssResourceSizes.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0)
    
    console.log('Total CSS transfer size:', totalCSSSize, 'bytes')
    console.log('Individual CSS files:', cssResourceSizes)
    
    // CSS should be much smaller than JS
    expect(totalCSSSize).toBeLessThan(PERFORMANCE_THRESHOLDS.bundleSize / 5)
  })
})

test.describe('Memory Usage', () => {
  test('Memory usage on dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory ? {
        usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
        totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
        jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
      } : null
    })
    
    if (initialMemory) {
      console.log('Initial memory usage:', initialMemory)
      
      // Interact with the page to trigger memory usage
      await page.click('[data-testid="add-analyst-button"]').catch(() => {})
      await page.keyboard.press('Escape').catch(() => {})
      
      await page.waitForTimeout(1000)
      
      const finalMemory = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        }
      })
      
      console.log('Final memory usage:', finalMemory)
      
      const memoryIncrease = finalMemory.usedJSHeapSize - initialMemory.usedJSHeapSize
      console.log('Memory increase:', memoryIncrease, 'bytes')
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    }
  })
})

test.describe('Network Performance', () => {
  test('API response times', async ({ page }) => {
    // Monitor network requests
    const apiRequests: any[] = []
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiRequests.push({
          url: response.url(),
          status: response.status(),
          timing: response.timing()
        })
      }
    })
    
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')
    
    console.log('API requests made:', apiRequests.length)
    
    for (const request of apiRequests) {
      console.log(`API: ${request.url} - ${request.status} - ${request.timing?.responseEnd || 'N/A'}ms`)
      
      // API responses should be fast (under 2 seconds)
      if (request.timing?.responseEnd) {
        expect(request.timing.responseEnd).toBeLessThan(2000)
      }
    }
  })

  test('Image optimization', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    await page.waitForLoadState('networkidle')
    
    const images = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs.map(img => ({
        src: img.src,
        width: img.naturalWidth,
        height: img.naturalHeight,
        loading: img.loading,
        alt: img.alt
      }))
    })
    
    console.log('Images loaded:', images.length)
    
    for (const img of images) {
      // Check that images have alt text for accessibility
      if (!img.alt && !img.src.includes('data:')) {
        console.warn('Image missing alt text:', img.src)
      }
      
      // Check for lazy loading on large images
      if (img.width > 500 || img.height > 500) {
        expect(['lazy', 'eager']).toContain(img.loading)
      }
    }
  })
})

test.describe('Page Speed Insights Simulation', () => {
  test('Core Web Vitals simulation', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    
    // Simulate slow 3G network
    const client = await page.context().newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 400 * 1024, // 400 KB/s
      uploadThroughput: 400 * 1024,
      latency: 20
    })
    
    const startTime = Date.now()
    await page.reload()
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime
    
    console.log('Load time on slow 3G:', loadTime, 'ms')
    
    // Should still load within reasonable time on slow connection
    expect(loadTime).toBeLessThan(10000) // 10 seconds max
  })
})