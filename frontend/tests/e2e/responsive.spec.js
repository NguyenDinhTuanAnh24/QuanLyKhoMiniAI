import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { width: 320, height: 568 }, // iPhone SE (1st gen)
  { width: 375, height: 667 }, // iPhone 6/7/8
  { width: 390, height: 844 }, // iPhone 12/13
  { width: 430, height: 932 }, // iPhone 14 Pro Max
  { width: 768, height: 1024 }, // iPad
  { width: 1366, height: 768 }, // Laptop
  { width: 1920, height: 1080 } // Desktop
];

const PAGES_TO_TEST = [
  '/dashboard',
  '/products',
  '/inventory-ops',
  '/sales',
  '/ai-insights',
  '/reports',
  '/activity-logs',
  '/settings',
  '/alerts'
];

test.describe('Responsive Verification', () => {
  // Use global setup or simply login before each if state is isolated per worker
  // Since we run fullyParallel: false and workers: 1, state might persist or we just login once in test.beforeAll

  test.beforeAll(async ({ browser }) => {
    // Empty, we will login on first run
  });

  for (const viewport of VIEWPORTS) {
    test.describe(`Viewport ${viewport.width}x${viewport.height}`, () => {
      test.use({ viewport });

      for (const targetPage of PAGES_TO_TEST) {
        test(`Test page ${targetPage}`, async ({ page }) => {
          const errors = [];
          
          // Catch unhandled errors and console errors
          page.on('pageerror', err => errors.push(`Page Error: ${err.message}`));
          page.on('console', msg => {
            if (msg.type() === 'error') {
              // Ignore some common Vite/React warning if needed, but let's capture all for now
              errors.push(`Console Error: ${msg.text()}`);
            }
          });

          // Login flow if needed
          await page.goto('/login');
          try {
            await page.waitForSelector('input[type="email"]', { timeout: 2000 });
            await page.fill('input[type="email"]', 'admin@admin.com');
            await page.fill('input[type="password"]', '123456');
            await page.click('button[type="submit"]');
            await page.waitForURL('**/dashboard', { timeout: 5000 });
          } catch (e) {
            // Already logged in or token valid
          }

          await page.goto(targetPage);
          
          // Wait for network idle to ensure data is loaded
          await page.waitForLoadState('networkidle');
          // Add small delay for rendering
          await page.waitForTimeout(1000);
          
          // Check horizontal overflow of body
          const isOverflowing = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
          });

          // Check if main content is wider than viewport
          const mainWidthOverflow = await page.evaluate(() => {
            const main = document.querySelector('main') || document.body;
            return main.scrollWidth > document.documentElement.clientWidth;
          });
          
          let aiSummaryOverflowing = false;
          let aiOverviewOverflowing = false;
          let aiFindingsOverflowing = false;
          let aiRisksOverflowing = false;
          let aiOpportunitiesOverflowing = false;

          if (targetPage === '/ai-insights') {
            const checkElOverflow = async (testid) => {
              const el = page.getByTestId(testid);
              if (await el.count() > 0) {
                return await el.evaluate(e => e.scrollWidth > e.clientWidth + 1);
              }
              return false;
            };

            aiSummaryOverflowing = await checkElOverflow('ai-summary');
            aiOverviewOverflowing = await checkElOverflow('ai-overview');
            aiFindingsOverflowing = await checkElOverflow('ai-findings');
            aiRisksOverflowing = await checkElOverflow('ai-risks');
            aiOpportunitiesOverflowing = await checkElOverflow('ai-opportunities');
          }

          // Mobile Centering / Offset assertion
          const viewportWidth = viewport.width;
          let offsetErrors = [];

          if (targetPage === '/ai-insights') {
            const sections = [
              'ai-page',
              'ai-summary',
              'ai-forecast-chart',
              'ai-actions'
            ];

            for (const testId of sections) {
              const el = page.getByTestId(testId);
              if (await el.count() > 0) {
                const box = await el.boundingBox();
                if (box) {
                  if (box.x < 0) {
                    offsetErrors.push(`${testId} has negative x: ${box.x}`);
                  }
                  if (box.x + box.width > viewportWidth + 1) {
                    offsetErrors.push(`${testId} overflows viewport width: x=${box.x}, w=${box.width}, v=${viewportWidth}`);
                  }
                }
              }
            }
          }

          // Snapshot criteria
          if (viewport.width === 430 && ['/dashboard', '/inventory-ops', '/ai-insights', '/activity-logs', '/settings'].includes(targetPage)) {
            await page.screenshot({ path: `tests/e2e/screenshots/430-${targetPage.replace('/', '')}.png`, fullPage: true });
          }
          if (viewport.width === 1366 && ['/ai-insights', '/activity-logs'].includes(targetPage)) {
            await page.screenshot({ path: `tests/e2e/screenshots/1366-${targetPage.replace('/', '')}.png`, fullPage: true });
          }

          // Output useful error if failing
          if (isOverflowing) {
            console.error(`[FAIL] ${targetPage} at ${viewport.width}x${viewport.height}: Body horizontal overflow detected.`);
          }
          if (mainWidthOverflow) {
            console.error(`[FAIL] ${targetPage} at ${viewport.width}x${viewport.height}: Main content horizontal overflow detected.`);
          }
          if (aiSummaryOverflowing || aiOverviewOverflowing || aiFindingsOverflowing || aiRisksOverflowing || aiOpportunitiesOverflowing) {
            console.error(`[FAIL] ${targetPage} at ${viewport.width}x${viewport.height}: AI Summary element clipping detected.`);
          }
          if (offsetErrors.length > 0) {
            console.error(`[FAIL] ${targetPage} at ${viewport.width}x${viewport.height}: AI Page offset error:`, offsetErrors.join(', '));
          }

          expect(isOverflowing).toBeFalsy(); // Body horizontal overflow is NOT allowed
          expect(mainWidthOverflow).toBeFalsy(); // Main content width should be <= viewport
          expect(offsetErrors.length).toBe(0); // Elements should fit in bounding box without right shift
          if (targetPage === '/ai-insights') {
            expect(aiSummaryOverflowing).toBeFalsy();
            expect(aiOverviewOverflowing).toBeFalsy();
            expect(aiFindingsOverflowing).toBeFalsy();
            expect(aiRisksOverflowing).toBeFalsy();
            expect(aiOpportunitiesOverflowing).toBeFalsy();
          }
          expect(errors.filter(e => 
            !e.includes('net::ERR_') && 
            !e.includes('favicon') && 
            !e.includes('ResizeObserver') && 
            !e.includes('401 (Unauthorized)') &&
            !e.includes('404 (Not Found)')
          )).toEqual([]); 
        });
      }
    });
  }
});
