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

test.describe('Analysts Page - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/analysts`);
  });

  test('should allow an admin to add a new analyst', async ({ page }) => {
    // Click the "Add Analyst" button
    await page.click('[data-testid="add-analyst-button"]');

    // Fill out the form
    const analystName = `Test Analyst ${Date.now()}`;
    await page.fill('input[name="name"]', analystName);
    await page.fill('input[name="firm"]', 'Test Firm');
    await page.fill('input[name="title"]', 'Test Title');

    // You might need to handle dropdowns, checkboxes, etc. differently.
    // For now, assuming text inputs.

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for the modal to close and the table to update
    await page.waitForSelector('[data-testid="analysts-table"]');

    // Verify the new analyst is in the table
    const table = page.locator('[data-testid="analysts-table"]');
    await expect(table).toContainText(analystName);
  });

  test('should allow an admin to edit an existing analyst', async ({ page }) => {
    // Click on the first analyst in the table
    await page.locator('[data-testid="analyst-row"]').first().click();

    // The analyst drawer should open. Click the edit button.
    // I'm assuming a drawer opens, and there is an edit button inside it.
    // This selector might need to be adjusted.
    await page.click('[data-testid="edit-analyst-button"]');

    // Edit the form
    const newAnalystName = `Edited Analyst ${Date.now()}`;
    await page.fill('input[name="name"]', newAnalystName);

    // Save the changes
    await page.click('button[type="submit"]');

    // Wait for the drawer to close and the table to update
    await page.waitForSelector('[data-testid="analysts-table"]');

    // Verify the updated analyst is in the table
    const table = page.locator('[data-testid="analysts-table"]');
    await expect(table).toContainText(newAnalystName);
  });

  test('should allow an admin to delete an analyst', async ({ page }) => {
    // Get the name of the first analyst to verify deletion later
    const firstRow = page.locator('[data-testid="analyst-row"]').first();
    const analystName = await firstRow.locator('td').first().innerText();

    // Click the delete button
    await firstRow.locator('[data-testid="delete-analyst-button"]').click();

    // Handle the confirmation dialog
    page.on('dialog', dialog => dialog.accept());

    // Wait for the table to update
    await page.waitForResponse(response => response.url().includes('/api/analysts') && response.request().method() === 'DELETE');

    // Verify the analyst is no longer in the table
    const table = page.locator('[data-testid="analysts-table"]');
    await expect(table).not.toContainText(analystName);
  });
});
