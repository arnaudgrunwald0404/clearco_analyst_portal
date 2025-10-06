import { test, expect } from '@playwright/test'

test.describe('Admin Bulk Delete Analysts', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API responses
    await page.route('**/api/admin/analysts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'analyst-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              company: 'TechCorp',
              title: 'Senior Analyst',
              type: 'Analyst',
              influence: 'HIGH',
              status: 'ACTIVE',
              vendor_domain_id: 'domain-1',
              vendor_domain: {
                company_name: 'TechCorp',
                protected_domain: 'techcorp.com'
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'analyst-2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              company: 'DataCorp',
              title: 'Principal Analyst',
              type: 'Analyst',
              influence: 'MEDIUM',
              status: 'ACTIVE',
              vendor_domain_id: 'domain-2',
              vendor_domain: {
                company_name: 'DataCorp',
                protected_domain: 'datacorp.com'
              },
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            },
            {
              id: 'analyst-3',
              firstName: 'Bob',
              lastName: 'Johnson',
              email: 'bob.johnson@example.com',
              company: 'CloudVendor',
              title: 'Research Director',
              type: 'Analyst',
              influence: 'LOW',
              status: 'INACTIVE',
              vendor_domain_id: null,
              createdAt: '2024-01-01T00:00:00Z',
              updatedAt: '2024-01-01T00:00:00Z'
            }
          ]
        })
      })
    })

    await page.route('**/api/admin/vendor-domains', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'domain-1',
              company_name: 'TechCorp',
              protected_domain: 'techcorp.com'
            },
            {
              id: 'domain-2',
              company_name: 'DataCorp',
              protected_domain: 'datacorp.com'
            }
          ]
        })
      })
    })

    await page.route('**/api/admin/all-analysts', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: 'analyst-4',
              firstName: 'Alice',
              lastName: 'Wilson',
              email: 'alice.wilson@example.com',
              company: 'NewCorp',
              hasLoginAccess: false
            }
          ]
        })
      })
    })

    // Navigate to admin page
    await page.goto('/admin?section=analyst-accounts')
  })

  test('should display analyst accounts with checkboxes', async ({ page }) => {
    // Wait for data to load
    await expect(page.getByText('John Doe')).toBeVisible()
    await expect(page.getByText('Jane Smith')).toBeVisible()
    await expect(page.getByText('Bob Johnson')).toBeVisible()

    // Check for checkboxes
    const checkboxes = page.locator('input[type="checkbox"]')
    await expect(checkboxes).toHaveCount(4) // 1 header + 3 rows
  })

  test('should allow selecting individual analysts', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    // Select first analyst
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    await firstRowCheckbox.check()

    // Verify selection indicator appears
    await expect(page.getByText('• 1 selected')).toBeVisible()

    // Verify remove button appears
    await expect(page.getByText('Remove Access (1)')).toBeVisible()
  })

  test('should allow selecting all analysts with header checkbox', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    // Click header checkbox
    const headerCheckbox = page.locator('thead input[type="checkbox"]')
    await headerCheckbox.check()

    // Verify all analysts are selected
    await expect(page.getByText('• 3 selected')).toBeVisible()
    await expect(page.getByText('Remove Access (3)')).toBeVisible()

    // Verify all row checkboxes are checked
    const rowCheckboxes = page.locator('tbody input[type="checkbox"]')
    const count = await rowCheckboxes.count()
    for (let i = 0; i < count; i++) {
      await expect(rowCheckboxes.nth(i)).toBeChecked()
    }
  })

  test('should deselect all when header checkbox is unchecked', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    const headerCheckbox = page.locator('thead input[type="checkbox"]')
    
    // Select all
    await headerCheckbox.check()
    await expect(page.getByText('• 3 selected')).toBeVisible()

    // Deselect all
    await headerCheckbox.uncheck()
    await expect(page.getByText('• 3 selected')).not.toBeVisible()
    await expect(page.getByText('Remove Access')).not.toBeVisible()
  })

  test('should show clear selection button and functionality', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    // Select some analysts
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    const secondRowCheckbox = page.locator('tbody tr:nth-child(2) input[type="checkbox"]')
    
    await firstRowCheckbox.check()
    await secondRowCheckbox.check()

    await expect(page.getByText('• 2 selected')).toBeVisible()
    await expect(page.getByText('Clear Selection')).toBeVisible()

    // Click clear selection
    await page.getByText('Clear Selection').click()

    // Verify selection is cleared
    await expect(page.getByText('• 2 selected')).not.toBeVisible()
    await expect(page.getByText('Clear Selection')).not.toBeVisible()
    await expect(page.getByText('Remove Access')).not.toBeVisible()
  })

  test('should open confirmation modal when remove access is clicked', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    // Select analysts
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    const secondRowCheckbox = page.locator('tbody tr:nth-child(2) input[type="checkbox"]')
    
    await firstRowCheckbox.check()
    await secondRowCheckbox.check()

    // Click remove access button
    await page.getByText('Remove Access (2)').click()

    // Verify modal opens
    await expect(page.getByText('Remove Analyst Access')).toBeVisible()
    await expect(page.getByText('Are you sure you want to remove login access for 2 analysts?')).toBeVisible()
    await expect(page.getByText('This will prevent them from signing in to the platform')).toBeVisible()
  })

  test('should allow canceling the deletion', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    // Select analyst and open modal
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    await firstRowCheckbox.check()
    await page.getByText('Remove Access (1)').click()

    // Verify modal is open
    await expect(page.getByText('Remove Analyst Access')).toBeVisible()

    // Click cancel
    await page.getByText('Cancel').click()

    // Verify modal is closed and selection remains
    await expect(page.getByText('Remove Analyst Access')).not.toBeVisible()
    await expect(page.getByText('• 1 selected')).toBeVisible()
  })

  test('should successfully perform bulk deletion', async ({ page }) => {
    // Mock successful deletion API
    await page.route('**/api/admin/remove-analyst-access', async route => {
      const request = route.request()
      const body = JSON.parse(request.postData() || '{}')
      
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: `Successfully removed access for ${body.analystIds.length} analysts`,
          removedCount: body.analystIds.length
        })
      })
    })

    await expect(page.getByText('John Doe')).toBeVisible()

    // Select analysts
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    const secondRowCheckbox = page.locator('tbody tr:nth-child(2) input[type="checkbox"]')
    
    await firstRowCheckbox.check()
    await secondRowCheckbox.check()

    // Open modal and confirm deletion
    await page.getByText('Remove Access (2)').click()
    await expect(page.getByText('Remove Analyst Access')).toBeVisible()
    
    await page.getByRole('button', { name: 'Remove Access' }).click()

    // Verify loading state
    await expect(page.getByText('Removing Access...')).toBeVisible()

    // Wait for success (toast notification would appear in real app)
    await expect(page.getByText('Remove Analyst Access')).not.toBeVisible()
    await expect(page.getByText('• 2 selected')).not.toBeVisible()
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/admin/remove-analyst-access', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Database connection failed'
        })
      })
    })

    await expect(page.getByText('John Doe')).toBeVisible()

    // Select analyst and attempt deletion
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    await firstRowCheckbox.check()
    
    await page.getByText('Remove Access (1)').click()
    await page.getByRole('button', { name: 'Remove Access' }).click()

    // Wait for error handling (error toast would appear in real app)
    await expect(page.getByText('Removing Access...')).toBeVisible()
    
    // Modal should remain open on error
    await expect(page.getByText('Remove Analyst Access')).toBeVisible()
  })

  test('should handle partial success responses', async ({ page }) => {
    // Mock partial success API
    await page.route('**/api/admin/remove-analyst-access', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          message: 'Successfully removed access for 1 analyst',
          removedCount: 1,
          errors: ['Failed to remove access for Jane Smith: User not found'],
          partialSuccess: true
        })
      })
    })

    await expect(page.getByText('John Doe')).toBeVisible()

    // Select multiple analysts
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    const secondRowCheckbox = page.locator('tbody tr:nth-child(2) input[type="checkbox"]')
    
    await firstRowCheckbox.check()
    await secondRowCheckbox.check()

    // Perform deletion
    await page.getByText('Remove Access (2)').click()
    await page.getByRole('button', { name: 'Remove Access' }).click()

    // Should still close modal and clear selection on partial success
    await expect(page.getByText('Remove Analyst Access')).not.toBeVisible()
    await expect(page.getByText('• 2 selected')).not.toBeVisible()
  })

  test('should update selection count dynamically', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    const checkboxes = page.locator('tbody input[type="checkbox"]')

    // Select first analyst
    await checkboxes.nth(0).check()
    await expect(page.getByText('• 1 selected')).toBeVisible()
    await expect(page.getByText('Remove Access (1)')).toBeVisible()

    // Select second analyst
    await checkboxes.nth(1).check()
    await expect(page.getByText('• 2 selected')).toBeVisible()
    await expect(page.getByText('Remove Access (2)')).toBeVisible()

    // Select third analyst
    await checkboxes.nth(2).check()
    await expect(page.getByText('• 3 selected')).toBeVisible()
    await expect(page.getByText('Remove Access (3)')).toBeVisible()

    // Deselect one analyst
    await checkboxes.nth(0).uncheck()
    await expect(page.getByText('• 2 selected')).toBeVisible()
    await expect(page.getByText('Remove Access (2)')).toBeVisible()
  })

  test('should maintain selection state during filtering', async ({ page }) => {
    await expect(page.getByText('John Doe')).toBeVisible()

    // Select an analyst
    const firstRowCheckbox = page.locator('tbody tr:first-child input[type="checkbox"]')
    await firstRowCheckbox.check()
    await expect(page.getByText('• 1 selected')).toBeVisible()

    // Apply a filter that might hide the selected analyst
    await page.getByPlaceholder('Search by name, email, or company').fill('Jane')

    // Selection count should still be visible even if filtered analyst is hidden
    await expect(page.getByText('• 1 selected')).toBeVisible()

    // Clear filter
    await page.getByPlaceholder('Search by name, email, or company').clear()

    // Selection should still be maintained
    await expect(page.getByText('• 1 selected')).toBeVisible()
    await expect(firstRowCheckbox).toBeChecked()
  })
})
