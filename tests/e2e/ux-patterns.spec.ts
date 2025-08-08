/**
 * UX Patterns Tests
 * Tests modals, drawers, forms, and other interactive components
 */

import { test, expect, Page } from '@playwright/test'

// Configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// Test data
const TEST_USER = {
  email: 'test@clearcompany.com',
  password: 'test123'
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

test.describe('Modal Components', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Add Analyst Modal opens and closes correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Open modal
    await page.click('[data-testid="add-analyst-button"]')
    
    // Check modal is visible
    await expect(page.locator('[data-testid="add-analyst-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="modal-backdrop"]')).toBeVisible()
    
    // Check modal content
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Add Analyst')
    await expect(page.locator('[data-testid="analyst-form"]')).toBeVisible()
    
    // Test close button
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="add-analyst-modal"]')).not.toBeVisible()
    
    // Test backdrop close
    await page.click('[data-testid="add-analyst-button"]')
    await expect(page.locator('[data-testid="add-analyst-modal"]')).toBeVisible()
    await page.click('[data-testid="modal-backdrop"]')
    await expect(page.locator('[data-testid="add-analyst-modal"]')).not.toBeVisible()
    
    // Test ESC key close
    await page.click('[data-testid="add-analyst-button"]')
    await expect(page.locator('[data-testid="add-analyst-modal"]')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.locator('[data-testid="add-analyst-modal"]')).not.toBeVisible()
  })

  test('Add Event Modal functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`)
    
    // Open modal
    await page.click('[data-testid="add-event-button"]')
    
    // Check modal is visible
    await expect(page.locator('[data-testid="add-event-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Add Event')
    
    // Check form fields
    await expect(page.locator('[data-testid="event-title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="event-date-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="event-type-select"]')).toBeVisible()
    
    // Test form validation
    await page.click('[data-testid="save-event-button"]')
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="add-event-modal"]')).not.toBeVisible()
  })

  test('Add Award Modal functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/awards`)
    
    // Open modal
    await page.click('[data-testid="add-award-button"]')
    
    // Check modal is visible
    await expect(page.locator('[data-testid="add-award-modal"]')).toBeVisible()
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Add Award')
    
    // Check form fields
    await expect(page.locator('[data-testid="award-title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="award-category-select"]')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="add-award-modal"]')).not.toBeVisible()
  })

  test('Bulk Upload Modal functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Open add analyst modal first
    await page.click('[data-testid="add-analyst-button"]')
    
    // Switch to bulk upload tab
    await page.click('[data-testid="bulk-upload-tab"]')
    
    // Check bulk upload interface
    await expect(page.locator('[data-testid="file-upload-zone"]')).toBeVisible()
    await expect(page.locator('[data-testid="download-template-button"]')).toBeVisible()
    
    // Test file upload zone
    await expect(page.locator('text=drag and drop')).toBeVisible()
    
    // Close modal
    await page.click('[data-testid="modal-close-button"]')
    await expect(page.locator('[data-testid="add-analyst-modal"]')).not.toBeVisible()
  })

  test('Analyst Impersonation Modal functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Look for analyst with impersonation option
    const analystRow = page.locator('[data-testid="analyst-row"]').first()
    if (await analystRow.count() > 0) {
      await analystRow.locator('[data-testid="analyst-actions-menu"]').click()
      await page.click('[data-testid="impersonate-analyst"]')
      
      // Check impersonation modal
      await expect(page.locator('[data-testid="impersonation-modal"]')).toBeVisible()
      await expect(page.locator('[data-testid="modal-title"]')).toContainText('Impersonate')
      
      // Close modal
      await page.click('[data-testid="modal-close-button"]')
      await expect(page.locator('[data-testid="impersonation-modal"]')).not.toBeVisible()
    }
  })
})

test.describe('Drawer Components', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Analyst Drawer opens and closes correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Click on an analyst to open drawer
    const analystRow = page.locator('[data-testid="analyst-row"]').first()
    if (await analystRow.count() > 0) {
      await analystRow.click()
      
      // Check drawer is visible
      await expect(page.locator('[data-testid="analyst-drawer"]')).toBeVisible()
      await expect(page.locator('[data-testid="drawer-overlay"]')).toBeVisible()
      
      // Check drawer content
      await expect(page.locator('[data-testid="analyst-header"]')).toBeVisible()
      await expect(page.locator('[data-testid="analyst-tabs"]')).toBeVisible()
      
      // Test tab navigation
      await page.click('[data-testid="tab-publications"]')
      await expect(page.locator('[data-testid="publications-content"]')).toBeVisible()
      
      await page.click('[data-testid="tab-social"]')
      await expect(page.locator('[data-testid="social-content"]')).toBeVisible()
      
      await page.click('[data-testid="tab-briefings"]')
      await expect(page.locator('[data-testid="briefings-content"]')).toBeVisible()
      
      // Test close button
      await page.click('[data-testid="drawer-close-button"]')
      await expect(page.locator('[data-testid="analyst-drawer"]')).not.toBeVisible()
      
      // Test overlay close
      await analystRow.click()
      await expect(page.locator('[data-testid="analyst-drawer"]')).toBeVisible()
      await page.click('[data-testid="drawer-overlay"]')
      await expect(page.locator('[data-testid="analyst-drawer"]')).not.toBeVisible()
    }
  })

  test('Event Drawer functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`)
    
    // Click on an event to open drawer
    const eventRow = page.locator('[data-testid="event-row"]').first()
    if (await eventRow.count() > 0) {
      await eventRow.click()
      
      // Check drawer is visible
      await expect(page.locator('[data-testid="event-drawer"]')).toBeVisible()
      await expect(page.locator('[data-testid="event-details"]')).toBeVisible()
      
      // Close drawer
      await page.click('[data-testid="drawer-close-button"]')
      await expect(page.locator('[data-testid="event-drawer"]')).not.toBeVisible()
    }
  })

  test('Award Drawer functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/awards`)
    
    // Click on an award to open drawer
    const awardRow = page.locator('[data-testid="award-row"]').first()
    if (await awardRow.count() > 0) {
      await awardRow.click()
      
      // Check drawer is visible
      await expect(page.locator('[data-testid="award-drawer"]')).toBeVisible()
      await expect(page.locator('[data-testid="award-details"]')).toBeVisible()
      
      // Close drawer
      await page.click('[data-testid="drawer-close-button"]')
      await expect(page.locator('[data-testid="award-drawer"]')).not.toBeVisible()
    }
  })
})

test.describe('Form Components', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('General Settings Form functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)
    
    // Check form is visible
    await expect(page.locator('[data-testid="general-settings-form"]')).toBeVisible()
    
    // Check form fields
    await expect(page.locator('[data-testid="company-name-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="protected-domain-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="industry-select"]')).toBeVisible()
    
    // Test form validation
    await page.fill('[data-testid="company-name-input"]', '')
    await page.click('[data-testid="save-settings-button"]')
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible()
    
    // Test successful form submission
    await page.fill('[data-testid="company-name-input"]', 'Test Company')
    await page.fill('[data-testid="protected-domain-input"]', 'test.com')
    await page.click('[data-testid="save-settings-button"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Analyst Portal Settings Form functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/settings`)
    
    // Navigate to analyst portal settings
    await page.click('[data-testid="analyst-portal-tab"]')
    
    // Check form is visible
    await expect(page.locator('[data-testid="analyst-portal-form"]')).toBeVisible()
    
    // Check form fields
    await expect(page.locator('[data-testid="portal-title-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="portal-description-textarea"]')).toBeVisible()
    
    // Test form submission
    await page.fill('[data-testid="portal-title-input"]', 'Test Portal')
    await page.click('[data-testid="save-portal-settings-button"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('Email Template Editor functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/email-templates`)
    
    // Check editor is visible
    await expect(page.locator('[data-testid="email-editor"]')).toBeVisible()
    
    // Check editor components
    await expect(page.locator('[data-testid="template-selector"]')).toBeVisible()
    await expect(page.locator('[data-testid="subject-input"]')).toBeVisible()
    await expect(page.locator('[data-testid="content-editor"]')).toBeVisible()
    
    // Test template selection
    await page.selectOption('[data-testid="template-selector"]', 'welcome')
    await expect(page.locator('[data-testid="content-editor"]')).not.toBeEmpty()
    
    // Test save functionality
    await page.fill('[data-testid="subject-input"]', 'Test Subject')
    await page.click('[data-testid="save-template-button"]')
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })
})

test.describe('Action Menus', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Analyst Actions Menu functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Click on analyst actions menu
    const analystRow = page.locator('[data-testid="analyst-row"]').first()
    if (await analystRow.count() > 0) {
      await analystRow.locator('[data-testid="analyst-actions-menu"]').click()
      
      // Check menu is visible
      await expect(page.locator('[data-testid="actions-dropdown"]')).toBeVisible()
      
      // Check menu items
      await expect(page.locator('[data-testid="edit-analyst"]')).toBeVisible()
      await expect(page.locator('[data-testid="delete-analyst"]')).toBeVisible()
      await expect(page.locator('[data-testid="impersonate-analyst"]')).toBeVisible()
      
      // Test menu close on outside click
      await page.click('body')
      await expect(page.locator('[data-testid="actions-dropdown"]')).not.toBeVisible()
    }
  })

  test('Event Actions Menu functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/events`)
    
    // Click on event actions menu
    const eventRow = page.locator('[data-testid="event-row"]').first()
    if (await eventRow.count() > 0) {
      await eventRow.locator('[data-testid="event-actions-menu"]').click()
      
      // Check menu is visible
      await expect(page.locator('[data-testid="actions-dropdown"]')).toBeVisible()
      
      // Check menu items
      await expect(page.locator('[data-testid="edit-event"]')).toBeVisible()
      await expect(page.locator('[data-testid="delete-event"]')).toBeVisible()
      
      // Close menu
      await page.click('body')
      await expect(page.locator('[data-testid="actions-dropdown"]')).not.toBeVisible()
    }
  })

  test('Award Actions Menu functions correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/awards`)
    
    // Click on award actions menu
    const awardRow = page.locator('[data-testid="award-row"]').first()
    if (await awardRow.count() > 0) {
      await awardRow.locator('[data-testid="award-actions-menu"]').click()
      
      // Check menu is visible
      await expect(page.locator('[data-testid="actions-dropdown"]')).toBeVisible()
      
      // Check menu items
      await expect(page.locator('[data-testid="edit-award"]')).toBeVisible()
      await expect(page.locator('[data-testid="delete-award"]')).toBeVisible()
      
      // Close menu
      await page.click('body')
      await expect(page.locator('[data-testid="actions-dropdown"]')).not.toBeVisible()
    }
  })
})

test.describe('Interactive Features', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('Search functionality works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Check search input is visible
    await expect(page.locator('[data-testid="search-input"]')).toBeVisible()
    
    // Test search functionality
    await page.fill('[data-testid="search-input"]', 'test')
    await page.keyboard.press('Enter')
    
    // Check that search results are displayed
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
    
    // Clear search
    await page.fill('[data-testid="search-input"]', '')
    await page.keyboard.press('Enter')
  })

  test('Filtering functionality works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Check filter controls are visible
    await expect(page.locator('[data-testid="filter-dropdown"]')).toBeVisible()
    
    // Test filter application
    await page.click('[data-testid="filter-dropdown"]')
    await page.click('[data-testid="filter-active"]')
    
    // Check that filter is applied
    await expect(page.locator('[data-testid="active-filter-tag"]')).toBeVisible()
    
    // Clear filter
    await page.click('[data-testid="clear-filters"]')
    await expect(page.locator('[data-testid="active-filter-tag"]')).not.toBeVisible()
  })

  test('Sorting functionality works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Test column sorting
    await page.click('[data-testid="sort-by-name"]')
    
    // Check sort indicator
    await expect(page.locator('[data-testid="sort-indicator-name"]')).toBeVisible()
    
    // Test reverse sort
    await page.click('[data-testid="sort-by-name"]')
    await expect(page.locator('[data-testid="sort-indicator-name"].desc')).toBeVisible()
  })

  test('Pagination works correctly', async ({ page }) => {
    await page.goto(`${BASE_URL}/analysts`)
    
    // Check pagination controls
    const pagination = page.locator('[data-testid="pagination"]')
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible()
      
      // Test next page
      const nextButton = page.locator('[data-testid="next-page"]')
      if (await nextButton.isEnabled()) {
        await nextButton.click()
        await expect(page.locator('[data-testid="page-indicator"]')).toContainText('2')
        
        // Test previous page
        await page.click('[data-testid="prev-page"]')
        await expect(page.locator('[data-testid="page-indicator"]')).toContainText('1')
      }
    }
  })
})

test.describe('Responsive Design', () => {
  test('Mobile viewport renders correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/`)
    
    // Check mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible()
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible()
    
    // Test navigation
    await page.click('[data-testid="mobile-nav-analysts"]')
    await expect(page).toHaveURL(/\/analysts/)
  })

  test('Tablet viewport renders correctly', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/`)
    
    // Check that layout adapts to tablet size
    await expect(page.locator('[data-testid="dashboard-grid"]')).toBeVisible()
    
    // Test that modals work on tablet
    await page.goto(`${BASE_URL}/analysts`)
    await page.click('[data-testid="add-analyst-button"]')
    await expect(page.locator('[data-testid="add-analyst-modal"]')).toBeVisible()
  })

  test('Desktop viewport renders correctly', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    
    await loginAsAdmin(page)
    await page.goto(`${BASE_URL}/`)
    
    // Check desktop layout
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible()
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible()
    
    // Test that all elements are properly spaced
    await expect(page.locator('[data-testid="dashboard-grid"]')).toHaveCSS('grid-template-columns', /repeat/)
  })
})