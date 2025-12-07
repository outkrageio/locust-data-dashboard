import { test, expect } from '@playwright/test';

test.describe('Test Runs Page', () => {
  test('should display test runs list with summary cards', async ({ page }) => {
    await page.goto('/test-runs');

    await expect(page.locator('h1')).toContainText('Test Runs');

    await expect(page.getByText('Test Runs')).toBeVisible();
    await expect(page.getByText('Active')).toBeVisible();
    await expect(page.getByText('Success')).toBeVisible();
  });

  test('should display filter controls', async ({ page }) => {
    await page.goto('/test-runs');

    await expect(page.getByLabel('Project')).toBeVisible();
    await expect(page.getByLabel('Start Date')).toBeVisible();
    await expect(page.getByLabel('End Date')).toBeVisible();
  });

  test('should filter by project', async ({ page }) => {
    await page.goto('/test-runs');

    const projectSelect = page.getByLabel('Project');
    await expect(projectSelect).toBeVisible();

    const options = await projectSelect.locator('option').count();
    if (options > 1) {
      await projectSelect.selectOption({ index: 1 });

      await expect(page.getByText(/filtered results/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /clear filters/i })).toBeVisible();
    }
  });

  test('should clear filters when clear button is clicked', async ({ page }) => {
    await page.goto('/test-runs');

    const projectSelect = page.getByLabel('Project');
    const options = await projectSelect.locator('option').count();

    if (options > 1) {
      await projectSelect.selectOption({ index: 1 });

      const clearButton = page.getByRole('button', { name: /clear filters/i });
      await expect(clearButton).toBeVisible();
      await clearButton.click();

      await expect(clearButton).not.toBeVisible();
      await expect(projectSelect).toHaveValue('');
    }
  });

  test('should display test runs table with correct columns', async ({ page }) => {
    await page.goto('/test-runs');

    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Project' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Test Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Host' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Spawn Rate' })).toBeVisible();
  });

  test('should navigate to test run details when row is clicked', async ({ page }) => {
    await page.goto('/test-runs');

    await page.waitForLoadState('networkidle');

    const firstRow = page.locator('tbody tr').first();
    const rowCount = await page.locator('tbody tr').count();

    if (rowCount > 0) {
      await firstRow.click();

      await expect(page).toHaveURL(/\/test-runs\/.+/);
    }
  });
});
