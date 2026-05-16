import { test, expect, type Page } from '@playwright/test';

async function waitForDbReady(page: Page) {
  const loader = page.getByText('جاري تجهيز قاعدة البيانات');
  await loader.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  await loader.waitFor({ state: 'hidden', timeout: 40_000 });
}

async function typePin(page: Page, digits: string) {
  for (const d of digits) {
    await page.getByRole('button', { name: `رقم ${d}` }).click();
    await page.waitForTimeout(80);
  }
}

test.describe('Smoke', () => {
  test('app loads and DB initialises without critical JS errors', async ({ page }) => {
    const criticalErrors: string[] = [];
    page.on('pageerror', (err) => {
      if (!err.message.includes('OPFS') && !err.message.includes('SAH')) {
        criticalErrors.push(err.message);
      }
    });

    await page.goto('/');
    await waitForDbReady(page);

    expect(criticalErrors).toHaveLength(0);

    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(/[\u0600-\u06FF]/.test(bodyText!)).toBe(true);
  });

  test('POS smoke: setup PINs → daily login → add product to cart', async ({ page }) => {
    await page.goto('/');
    await waitForDbReady(page);

    const isSetup = await page
      .getByText('إعداد أرقام سرية جديدة')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (isSetup) {
      // Step 1: daily lock — enter 2222, then confirm 2222
      await typePin(page, '2222');
      await page.waitForTimeout(400);
      await typePin(page, '2222');
      await page.waitForTimeout(600);

      // Step 2: admin PIN — enter 1111, then confirm 1111
      await typePin(page, '1111');
      await page.waitForTimeout(400);
      await typePin(page, '1111');
      await page.waitForTimeout(600);
    }

    const isDailyLock = await page
      .getByText('تسجيل الدخول لليوم')
      .isVisible({ timeout: 3_000 })
      .catch(() => false);

    if (isDailyLock) {
      await typePin(page, '2222');
      await page.waitForTimeout(600);
    }

    // Navigate to POS
    await page.goto('/pos');

    // Product grid loads (seeded products on first run)
    const addBtn = page.locator('button[aria-label*="إضافة"]').first();
    await expect(addBtn).toBeVisible({ timeout: 15_000 });

    // Add first product to cart
    await addBtn.click();
    await page.waitForTimeout(400);

    // Cart should reflect the added item — المجموع appears when cart is non-empty
    await expect(page.getByText('المجموع').or(page.getByText('الإجمالي')).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
