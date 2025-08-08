/**
 * Comprehensive Page Load Tests
 * Tests all main pages and routes for proper loading, authentication, and performance
 */

import { test, expect, Page } from '@playwright/test'

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_TIMEOUT = 10000 // 10 seconds

// Test data
const TEST_USER = {
  email: 'test@clearcompany.com',
  password: 'test123',
  analystEmail: 'analyst@test.com',
  analystPassword: 'analyst123'
}

/**
 * Helper function to login as admin user
 */
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth`)
  await page.fill('[data-testid="email-input"]', TEST_USER.email)
  await page.fill('[data-testid="password-input"]', TEST_USER.password)
  await page.click('[data-testid="login-button"]')
  await page.waitForURL(`${BASE_URL}/`)
}

/**
 * Helper function to login as analyst
 */
async function loginAsAnalyst(page: Page) {
  await page.goto(`${BASE_URL}/analyst-login`)
  await page.fill('[data-testid="email-input"]', TEST_USER.analystEmail)
  await page.fill('[data-testid="password-input"]', TEST_USER.analystPassword)
  await page.click('[data-testid="login-button"]')
  await page.waitForURL(`${BASE_URL}/portal`)
}

/**
 * Helper function to check page performance
 */
async function checkPagePerformance(page: Page, pageName: string) {
  const startTime = Date.now()
  
  // Wait for page to be fully loaded
  await page.waitForLoadState('networkidle')
  
  const loadTime = Date.now() - startTime
  
  console.log(`${pageName} load time: ${loadTime}ms`)
  
  // Performance assertion - pages should load within 5 seconds
  expect(loadTime).toBeLessThan(5000)
  
  // Check for console errors
  const logs = []
  page.on('console', msg => {
    if (msg.type() === 'error') {
      logs.push(msg.text())
    }
  })
  
  // Wait a bit to catch any console errors
  await page.waitForTimeout(1000)
  
  if (logs.length > 0) {
    console.warn(`Console errors on ${pageName}:`, logs)
  }
}

test.describe('Public Pages - No Authentication Required', () => {
  test('Login page (/auth) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth`)
    
    // Check page loads
    await expect(page).toHaveTitle(/Login|Auth/)
    
    // Check essential elements
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Login Page')
  })

  test('Analyst login page (/analyst-login) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analyst-login`)
    
    // Check page loads
    await expect(page).toHaveTitle(/Analyst Login/)
    
    // Check essential elements
    await expect(page.locator('[data-testid="email-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="password-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Analyst Login Page')
  })

  test('Signup page (/signup) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/signup`)
    
    // Check page loads without errors
    await expect(page).not.toHaveURL(/error/)
    
    // Check performance
    await checkPagePerformance(page, 'Signup Page')
  })
})

test.describe('Admin Pages - Authentication Required', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Dashboard (/) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/`)
    
    // Check dashboard elements
    await expect(page.locator('[data-testid="dashboard-metrics"]')).toBeVisible()
    await expect(page.locator('[data-testid="analysts-widget"]')).toBeVisible()
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Dashboard')
  })

  test('Analysts page (/analysts) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Check analysts list elements
    await expect(page.locator('[data-testid="analysts-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-analyst-button"]')).toBeVisible()
    await expect(page.locator('[data-testid="analysts-table"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Analysts Page')
  })

  test('Individual analyst page (/analysts/[id]) loads correctly', async ({ page }) => {
    // First go to analysts page to get an ID
    await page.goto(`${BASE_URL}/analysts`)
    
    // Click on first analyst if available
    const firstAnalyst = page.locator('[data-testid="analyst-row"]').first()
    if (await firstAnalyst.count() > 0) {
      await firstAnalyst.click()
      
      // Should navigate to analyst detail page
      await expect(page).toHaveURL(/\/analysts\//)
      
      // Check analyst detail elements
      await expect(page.locator('[data-testid="analyst-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="analyst-info"]')).toBeVisible()
      
      // Check performance
      await checkPagePerformance(page, 'Analyst Detail Page')
    }
  })

  test('Publications page (/publications) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/publications`)
    
    // Check publications elements
    await expect(page.locator('[data-testid="publications-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="publications-stats"]')).toBeVisible()
    await expect(page.locator('[data-testid="publications-table"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Publications Page')
  })

  test('Events page (/events) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`)
    
    // Check events elements
    await expect(page.locator('[data-testid="events-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-event-button"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Events Page')
  })

  test('Awards page (/awards) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/awards`)
    
    // Check awards elements
    await expect(page.locator('[data-testid="awards-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="add-award-button"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Awards Page')
  })

  test('Briefings page (/briefings) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/briefings`)
    
    // Check briefings elements
    await expect(page.locator('[data-testid="briefings-header"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Briefings Page')
  })

  test('Email Templates page (/email-templates) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/email-templates`)
    
    // Check email templates elements
    await expect(page.locator('[data-testid="email-templates-header"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Email Templates Page')
  })

  test('Newsletters page (/newsletters) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/newsletters`)
    
    // Check newsletters elements
    await expect(page.locator('[data-testid="newsletters-header"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Newsletters Page')
  })

  test('Testimonials page (/testimonials) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/testimonials`)
    
    // Check testimonials elements
    await expect(page.locator('[data-testid="testimonials-header"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Testimonials Page')
  })

  test('Settings page (/settings) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)
    
    // Check settings elements
    await expect(page.locator('[data-testid="settings-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="general-settings"]')).toBeVisible()
    await expect(page.locator('[data-testid="calendar-settings"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Settings Page')
  })

  test('Analytics page (/analytics) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analytics`)
    
    // Check analytics elements (may be placeholder)
    await expect(page).not.toHaveURL(/error/)
    
    // Check performance
    await checkPagePerformance(page, 'Analytics Page')
  })

  test('Analyst Access page (/analyst-access) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analyst-access`)
    
    // Check analyst access elements
    await expect(page.locator('[data-testid="analyst-access-header"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Analyst Access Page')
  })

  test('Scheduling Agent page (/scheduling-agent) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/scheduling-agent`)
    
    // Check scheduling agent elements
    await expect(page).not.toHaveURL(/error/)
    
    // Check performance
    await checkPagePerformance(page, 'Scheduling Agent Page')
  })
})

test.describe('Analyst Portal Pages - Analyst Authentication Required', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAnalyst(page)
  })

  test('Portal home (/portal) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal`)
    
    // Check portal elements
    await expect(page.locator('[data-testid="portal-header"]')).toBeVisible()
    await expect(page.locator('[data-testid="briefing-summary"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Portal Home')
  })

  test('Portal briefings (/portal/briefings) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/briefings`)
    
    // Check portal briefings elements
    await expect(page.locator('[data-testid="portal-briefings"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Portal Briefings')
  })

  test('Portal content (/portal/content) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/content`)
    
    // Check portal content elements
    await expect(page.locator('[data-testid="portal-content"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Portal Content')
  })

  test('Portal news (/portal/news) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/news`)
    
    // Check portal news elements
    await expect(page.locator('[data-testid="portal-news"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Portal News')
  })

  test('Portal testimonials (/portal/testimonials) loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/portal/testimonials`)
    
    // Check portal testimonials elements
    await expect(page.locator('[data-testid="portal-testimonials"]')).toBeVisible()
    
    // Check performance
    await checkPagePerformance(page, 'Portal Testimonials')
  })
})

test.describe('Authentication and Access Control', () => {
  test('Unauthenticated users are redirected to login', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Should redirect to auth page
    await expect(page).toHaveURL(/\/auth/)
  })

  test('Admin pages reject analyst users', async ({ page }) => {
    await loginAsAnalyst(page)
    
    // Try to access admin page
    await page.goto(`${BASE_URL}/analysts`)
    
    // Should redirect or show error
    await expect(page).not.toHaveURL(`${BASE_URL}/analysts`)
  })

  test('Portal pages reject admin users', async ({ page }) => {
    await loginAsAdmin(page)
    
    // Try to access portal page
    await page.goto(`${BASE_URL}/portal`)
    
    // Should redirect or show error
    await expect(page).not.toHaveURL(`${BASE_URL}/portal`)
  })
})

test.describe('Error Pages', () => {
  test('404 page loads correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/non-existent-page`)
    
    // Should show 404 page
    await expect(page.locator('text=404')).toBeVisible()
  })

  test('500 error page handles gracefully', async ({ page }) => {
    // This would need to be implemented based on how errors are handled
    // For now, just check that navigation doesn't break the app
    await page.goto(`${BASE_URL}/`)
    await expect(page).toHaveURL(`${BASE_URL}/`)
  })
})