import { test, expect } from '@playwright/test';

test.describe('Authentication FLow', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('should load login page with correct modules', async ({ page }) => {
        await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    });

    test('should show validation errors on invalid submit', async ({ page }) => {
        await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();

        // Wait for Zod validations to display
        await expect(page.getByText('Correo electrónico inválido')).toBeVisible();
        await expect(page.getByText('Mínimo 6 caracteres')).toBeVisible();
    });

    test('should show invalid credentials error', async ({ page }) => {
        await page.getByLabel(/correo electrónico/i).fill('wrong@email.com');
        await page.getByLabel(/contraseña/i).fill('wrongpassword123');
        await page.getByRole('button', { name: 'Iniciar Sesión', exact: true }).click();

        await expect(page.getByText('Credenciales inválidas')).toBeVisible();
    });
});
