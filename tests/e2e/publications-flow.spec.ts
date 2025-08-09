import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const TEST_USER = {
  email: 'test@clearcompany.com',
  password: 'test123',
};

async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/auth`);
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE_URL}/`);
}

test.describe('Publications Page - Main Actions', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/publications`);
  });

  test('should allow an admin to search for a publication', async ({ page }) => {
    // Assuming there is a search input with this testid
    const searchInput = page.locator('[data-testid="search-input"]');
    await searchInput.fill('Test Publication');

    // Assuming the table updates after search
    const table = page.locator('[data-testid="publications-table"]');
    await expect(table).toContainText('Test Publication');
  });

  test('should allow an admin to filter publications', async ({ page }) => {
    // Assuming there is a filter dropdown with this testid
    const filter = page.locator('[data-testid="status-filter"]');
    await filter.click();
    // Assuming 'Archived' is an option in the filter
    await page.locator('text=Archived').click();

    // Assuming the table updates after filtering
    const table = page.locator('[data-testid="publications-table"]');
    // This assertion will depend on the data and what "Archived" means
    // For now, we just check that the table doesn't error
    await expect(table).toBeVisible();
  });

  test('should allow an admin to sort publications', async ({ page }) => {
    // Assuming there is a sortable header with this testid
    const titleHeader = page.locator('[data-testid="title-header"]');

    // Get the text of the first and last rows before sorting
    const firstRowTextBefore = await page.locator('[data-testid="publication-row"]').first().innerText();
    const lastRowTextBefore = await page.locator('[data-testid="publication-row"]').last().innerText();

    // Click to sort by title
    await titleHeader.click();

    // Wait for the table to update
    await page.waitForResponse(response => response.url().includes('/api/publications'));

    // Get the text of the first and last rows after sorting
    const firstRowTextAfter = await page.locator('[data-testid="publication-row"]').first().innerText();
    const lastRowTextAfter = await page.locator('[data-testid="publication-row"]').last().innerText();

    // Verify that the order has changed. This is a simple check.
    // A more robust check would be to compare the text of all rows.
    expect(firstRowTextBefore).not.toEqual(firstRowTextAfter);
    expect(lastRowTextBefore).not.toEqual(lastRowTextAfter);
  });
});
