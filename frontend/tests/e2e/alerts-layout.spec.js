import { test, expect } from '@playwright/test';

test.describe('Alerts Page Layout Verification', () => {
  test.use({ viewport: { width: 1366, height: 768 } });

  test('should not have layout shift and match dashboard width', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // 1. Mock ALL APIs
    await page.route('**/api/**', async route => {
      const url = route.request().url();
      if (url.includes('/api/auth/login')) {
        // Return a fake JWT token (header.payload.signature)
        const fakePayload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, role: 'ADMIN' }));
        await route.fulfill({ json: { success: true, data: { token: `fake.${fakePayload}.fake`, user: { role: 'ADMIN' } } } });
      } else if (url.includes('/api/inventory/low-stock-alerts')) {
        await new Promise(resolve => setTimeout(resolve, 1500)); // Delay Alerts API
        await route.fulfill({ json: { success: true, data: { summary: { total_products: 0 }, alerts: [], pagination: { currentPage: 1, totalPages: 1, totalItems: 0 } } } });
      } else {
        await route.fulfill({ json: { success: true, data: { summary: {}, revenue_7_days: [], user: { role: 'ADMIN' } } } });
      }
    });

    // 2. Login
    await page.goto('/login');
    try {
      await page.waitForSelector('input[type="email"]', { timeout: 2000 });
      await page.fill('input[type="email"]', 'admin@admin.com');
      await page.fill('input[type="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard', { timeout: 5000 });
    } catch (e) {
      // Already logged in
    }

    // 3. Measure Dashboard container width
    await page.goto('/dashboard');
    await page.waitForURL('**/dashboard', { timeout: 5000 }).catch(() => console.log('Failed to reach dashboard URL'));
    await page.waitForSelector('[data-testid="page-container"]', { state: 'visible', timeout: 5000 });
    const dashboardContainer = await page.getByTestId('page-container').boundingBox();
    expect(dashboardContainer).toBeTruthy();
    

    // 4. Go to Alerts page
    // Navigate manually to ensure skeleton triggers correctly from router
    await page.goto('/alerts');

    // 5. Measure skeleton box
    await page.waitForSelector('[data-testid="alerts-skeleton"]', { state: 'visible' });
    const skeletonBox = await page.getByTestId('alerts-skeleton').boundingBox();
    expect(skeletonBox).toBeTruthy();

    // 6. Wait for data to load and measure loaded box
    await page.waitForSelector('[data-testid="alerts-skeleton"]', { state: 'detached', timeout: 5000 });
    await page.waitForSelector('[data-testid="page-container"]', { state: 'visible' });
    const loadedContainer = await page.getByTestId('page-container').boundingBox();
    expect(loadedContainer).toBeTruthy();

    // 7. Assertions
    // Skeleton width vs Loaded width
    const widthDiff = Math.abs(skeletonBox.width - loadedContainer.width);
    const xDiff = Math.abs(skeletonBox.x - loadedContainer.x);

    console.log(`\nALERTS LAYOUT TEST RESULTS`);
    console.log(`Alerts loading width: ${skeletonBox.width}`);
    console.log(`Alerts loaded width: ${loadedContainer.width}`);
    console.log(`Dashboard width: ${dashboardContainer.width}`);
    console.log(`Alerts loading x: ${skeletonBox.x}, loaded x: ${loadedContainer.x}`);

    expect(widthDiff).toBeLessThanOrEqual(2);
    expect(xDiff).toBeLessThanOrEqual(2);

    // Alerts width vs Dashboard width
    const dashboardDiff = Math.abs(loadedContainer.width - dashboardContainer.width);
    const dashboardXDiff = Math.abs(loadedContainer.x - dashboardContainer.x);
    
    expect(dashboardDiff).toBeLessThanOrEqual(4);
    expect(dashboardXDiff).toBeLessThanOrEqual(4);
  });
});
