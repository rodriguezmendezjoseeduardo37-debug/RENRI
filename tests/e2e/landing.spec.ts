import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display hero section with updated branding', async ({ page }) => {
    await page.goto('/');

    // Check main heading
    await expect(page.locator('h1')).toContainText(/Tu negocio/);
    await expect(page.locator('h1')).toContainText(/Sin límites/);

    // Badge
    await expect(page.getByText('Plataforma para servicios y negocios')).toBeVisible();

    // Verify nav links
    await expect(page.getByRole('link', { name: /precios/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /iniciar sesión/i }).first()).toBeVisible();

    // Features Section
    await expect(page.getByText('Citas')).toBeVisible();
    await expect(page.getByText('Turnos')).toBeVisible();
    await expect(page.getByText('Pagos')).toBeVisible();
    await expect(page.getByText('Reportes')).toBeVisible();
  });

  test('should display use-case sections for servicios and negocios', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Negocios' })).toBeVisible();
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
