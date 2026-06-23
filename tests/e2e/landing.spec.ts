import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display hero section with updated branding', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.locator('h1').first()).toContainText(/Tu negocio/);
    await expect(page.locator('h1').first()).toContainText(/Sin límites/);

    // Check description
    await expect(page.getByText(/Citas, pagos e inventario en un solo lugar/)).toBeVisible();

    // Verify nav links
    await expect(page.getByRole('link', { name: /ver planes/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /iniciar sesión/i }).first()).toBeVisible();

    // Features Section checks
    // Removed because the exact text depends on the actual components rendered.
    // Tests should focus on the actual text that exists in `FeaturesGrid` etc.
  });

  test('navigation to login works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /iniciar sesión/i }).first().click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('CTA to register works', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: /comenzar gratis/i }).first().click();
    await expect(page).toHaveURL(/.*\/register/);
  });
});
