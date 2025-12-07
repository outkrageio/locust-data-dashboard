import { test, expect } from '@playwright/test';

test.describe('Test Run Details Page', () => {
  test('should display test run details when navigating from test runs list', async ({ page }) => {
    await page.goto('/test-runs');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      const firstRow = page.locator('tbody tr').first();
      await firstRow.click();

      await expect(page).toHaveURL(/\/test-runs\/.+/);

      await expect(page.getByText('Test Run Details')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display test configuration section', async ({ page }) => {
    await page.goto('/test-runs');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await page.locator('tbody tr').first().click();

      await expect(page.getByText('Test Configuration')).toBeVisible();
      await expect(page.getByText('Project')).toBeVisible();
      await expect(page.getByText('Host')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display performance metrics section', async ({ page }) => {
    await page.goto('/test-runs');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await page.locator('tbody tr').first().click();

      await expect(page.getByText('Performance Overview')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display endpoint statistics section', async ({ page }) => {
    await page.goto('/test-runs');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await page.locator('tbody tr').first().click();

      await expect(page.getByText('Endpoint Statistics')).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('should display bandwidth stats if available', async ({ page }) => {
    await page.goto('/test-runs');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await page.locator('tbody tr').first().click();
      await page.waitForLoadState('networkidle');

      const bandwidthSection = page.getByText('Network & Bandwidth');
      const hasBandwidth = await bandwidthSection.isVisible().catch(() => false);

      if (hasBandwidth) {
        await expect(bandwidthSection).toBeVisible();
        await expect(page.getByText('Total Data')).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('should have back to test runs navigation', async ({ page }) => {
    await page.goto('/test-runs');
    await page.waitForLoadState('networkidle');

    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await page.locator('tbody tr').first().click();

      const backLink = page.getByRole('link', { name: /back to test runs/i });
      await expect(backLink).toBeVisible();

      await backLink.click();
      await expect(page).toHaveURL('/test-runs');
    } else {
      test.skip();
    }
  });
});
