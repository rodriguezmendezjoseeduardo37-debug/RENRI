import { test, expect } from '@playwright/test';

test.describe('Authentication FLow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should load login page with correct modules', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
        await expect(page.getByText('Servicios')).toBeVisible();
        await expect(page.getByText('PYME')).toBeVisible();
        await expect(page.getByText('Cliente')).toBeVisible();
    });

    test('should show validation errors on invalid submit', async ({ page }) => {
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

        // Wait for Zod validations to display
        await expect(page.getByText('Correo electrónico inválido')).toBeVisible();
        await expect(page.getByText('Mínimo 6 caracteres')).toBeVisible();
    });

    test('should show invalid credentials error', async ({ page }) => {
        await page.getByLabel(/correo electrónico/i).fill('wrong@email.com');
        await page.getByLabel(/contraseña/i).fill('wrongpassword123');
        await page.getByRole('button', { name: 'Iniciar Sesión' }).click();

        await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    });
});
