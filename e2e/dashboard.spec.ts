import { test, expect } from '@playwright/test';

test.describe('Dashboard Homepage', () => {
  test('should display dashboard with overview stats', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1')).toContainText('Dashboard');

    await expect(page.getByText('Total Tests')).toBeVisible();
    await expect(page.getByText('Completed')).toBeVisible();
    await expect(page.getByText('Running')).toBeVisible();
    await expect(page.getByText('Failed')).toBeVisible();
  });

  test('should display recent test runs section', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Recent Test Runs')).toBeVisible();
  });

  test('should navigate to test runs page from quick actions', async ({ page }) => {
    await page.goto('/');

    const viewAllButton = page.getByRole('link', { name: /view all test runs/i });
    await viewAllButton.click();

    await expect(page).toHaveURL('/test-runs');
    await expect(page.locator('h1')).toContainText('Test Runs');
  });

  test('should display quick action cards', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('View All Test Runs')).toBeVisible();
    await expect(page.getByText('Browse and filter all your test runs')).toBeVisible();
  });
});
