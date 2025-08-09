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

test.describe('Events Page - CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/events`);
  });

  test('should allow an admin to add a new event', async ({ page }) => {
    // Assuming a button to add an event
    await page.click('[data-testid="add-event-button"]');

    // Fill out the form
    const eventName = `Test Event ${Date.now()}`;
    await page.fill('input[name="name"]', eventName);
    // Add other fields as necessary, assuming they exist
    await page.fill('input[name="location"]', 'Virtual');
    await page.fill('input[type="date"]', '2025-12-31');

    // Submit the form
    await page.click('button[type="submit"]');

    // Verify the new event is in the list/calendar
    await expect(page.locator(`text=${eventName}`)).toBeVisible();
  });

  test('should allow an admin to edit an existing event', async ({ page }) => {
    // Click on the first event to open details/edit mode
    await page.locator('[data-testid="event-item"]').first().click();

    // Click the edit button
    await page.click('[data-testid="edit-event-button"]');

    // Edit the form
    const newEventName = `Edited Event ${Date.now()}`;
    await page.fill('input[name="name"]', newEventName);

    // Save the changes
    await page.click('button[type="submit"]');

    // Verify the updated event is visible
    await expect(page.locator(`text=${newEventName}`)).toBeVisible();
  });

  test('should allow an admin to delete an event', async ({ page }) => {
    // Get the name of the first event
    const firstEvent = page.locator('[data-testid="event-item"]').first();
    const eventName = await firstEvent.innerText();

    // Click the delete button
    await firstEvent.locator('[data-testid="delete-event-button"]').click();

    // Handle the confirmation dialog
    page.on('dialog', dialog => dialog.accept());

    // Verify the event is no longer visible
    await expect(page.locator(`text=${eventName}`)).not.toBeVisible();
  });
});
