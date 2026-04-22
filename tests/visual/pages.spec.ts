import { test, expect } from '@playwright/test';

// Function to generate a screenshot identifier
const screenshotName = (pageName: string, viewport: string) => `${pageName}-${viewport}.png`;

const VIEWPORTS = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 900 },
];

const PAGES = [
    { name: 'landing', path: '/' },
    { name: 'login', path: '/login' },
    { name: 'register', path: '/register' },
    { name: 'pricing', path: '/pricing' }
];

test.describe('Visual Regression', () => {
    for (const vp of VIEWPORTS) {
        test.describe(`${vp.name} viewport`, () => {
            test.use({ viewport: { width: vp.width, height: vp.height } });

            for (const p of PAGES) {
                test(`should match visual snapshot for ${p.name}`, async ({ page }) => {
                    await page.goto(p.path);
                    
                    // Wait for animations or dynamic elements to settle
                    await page.waitForTimeout(1000); 
                    
                    // Specific masking for pages with highly dynamic content
                    // e.g. await expect(page).toHaveScreenshot(screenshotName(p.name, vp.name), { mask: [page.locator('.dynamic-chart')] });
                    
                    await expect(page).toHaveScreenshot(screenshotName(p.name, vp.name), { fullPage: true });
                });
            }
        });
    }
});
