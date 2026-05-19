# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> Smoke >> POS smoke: setup PINs → daily login → add product to cart
- Location: e2e/smoke.spec.ts:35:3

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for locator('button[aria-label*="إضافة"]').first()
    - locator resolved to <button type="button" aria-label="إضافة حماية شاشة أيفون 13، السعر 50.00 د.أ" class="bg-surface border border-border rounded-xl flex flex-col select-none relative overflow-hidden text-start w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 cursor-pointer hover:border-accent transition-all">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <p class="font-medium text-gray-800">اختر "إضافة إلى الشاشة الرئيسية"</p> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="font-medium text-gray-800">اختر "إضافة إلى الشاشة الرئيسية"</p> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">…</div> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
  21 × retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p class="font-medium text-gray-800">اختر "إضافة إلى الشاشة الرئيسية"</p> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <p class="font-medium text-gray-800">اختر "إضافة إلى الشاشة الرئيسية"</p> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">…</div> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms
       - waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <div class="bg-white rounded-2xl p-5 shadow-sm flex items-center gap-4">…</div> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <p class="font-medium text-gray-800">اختر "إضافة إلى الشاشة الرئيسية"</p> from <div class="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-[#F9F8F5]">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e4]:
    - heading "ثبّت التطبيق للحصول على أفضل تجربة" [level=1] [ref=e5]
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img [ref=e9]
        - paragraph [ref=e13]: اضغط قائمة المتصفح (⋮) أعلى الشاشة
      - generic [ref=e14]:
        - img [ref=e16]
        - paragraph [ref=e18]: اختر "إضافة إلى الشاشة الرئيسية"
      - generic [ref=e19]:
        - img [ref=e21]
        - paragraph [ref=e23]: افتح التطبيق من أيقونته الجديدة
    - button "متابعة بدون تثبيت" [ref=e24]
  - generic [ref=e26]:
    - generic [ref=e27]:
      - img [ref=e29]
      - generic [ref=e31]:
        - heading "تنبيه أمان البيانات!" [level=3] [ref=e32]
        - paragraph [ref=e33]: لقد مرت أكثر من ٢٤ ساعة على آخر نسخة احتياطية للبيانات. يرجى أخذ نسخة الآن.
    - generic [ref=e34]:
      - button "تنزيل نسخة الآن" [ref=e35]
      - button [ref=e36]:
        - img [ref=e37]
  - main [ref=e42]:
    - generic [ref=e43]:
      - generic [ref=e45]:
        - heading "السلة 0" [level=2] [ref=e47]:
          - text: السلة
          - generic [ref=e48]: "0"
        - generic [ref=e50]:
          - img [ref=e51]
          - paragraph [ref=e55]: السلة فارغة
        - generic [ref=e56]:
          - generic [ref=e57]:
            - generic [ref=e58]:
              - generic [ref=e59]: المجموع الفرعي
              - generic [ref=e60]: 0.00 د.أ
            - generic [ref=e61]:
              - generic [ref=e62]:
                - generic [ref=e63]: الخصم
                - button "فاتورة" [ref=e64]:
                  - img [ref=e65]
                  - generic [ref=e69]: فاتورة
              - generic [ref=e70]: —
            - generic [ref=e71]:
              - generic [ref=e72]: الإجمالي
              - generic [ref=e73]: 0.00 د.أ
          - generic [ref=e74]:
            - button "الكمية" [disabled] [ref=e75]:
              - img [ref=e76]
              - text: الكمية
            - button "خصم %" [disabled] [ref=e79]:
              - img [ref=e80]
              - text: خصم %
            - button "السعر" [disabled] [ref=e84]:
              - img [ref=e85]
              - text: السعر
          - button "إتمام البيع" [disabled] [ref=e88]
      - generic [ref=e89]:
        - generic [ref=e90]:
          - button "العودة للرئيسية" [ref=e91]:
            - img [ref=e92]
          - button [ref=e98]:
            - img [ref=e99]
        - generic [ref=e101]:
          - generic [ref=e102]:
            - generic [ref=e103]:
              - textbox "البحث في المنتجات" [ref=e104]:
                - /placeholder: بحث عن منتج برمز SKU أو الاسم...
              - img [ref=e105]
            - tablist "تصفية حسب الفئة" [ref=e108]:
              - tab "الكل" [selected] [ref=e109]:
                - generic [ref=e110]: الكل
              - tab "أجهزة" [ref=e111]:
                - generic [ref=e112]: أجهزة
              - tab "شرائح" [ref=e113]:
                - generic [ref=e114]: شرائح
              - tab "خدمات عامة" [ref=e115]:
                - generic [ref=e116]: خدمات عامة
              - tab "خدمات صيانة" [ref=e117]:
                - generic [ref=e118]: خدمات صيانة
              - tab "إكسسوار" [ref=e119]:
                - generic [ref=e120]: إكسسوار
              - tab "باقات" [ref=e121]:
                - generic [ref=e122]: باقات
          - generic [ref=e124]:
            - generic [ref=e125]:
              - button "إضافة حماية شاشة أيفون 13، السعر 50.00 د.أ" [ref=e127] [cursor=pointer]:
                - img [ref=e130]
                - generic [ref=e133]:
                  - heading "حماية شاشة أيفون 13" [level=3] [ref=e134]
                  - generic [ref=e136]: 50.00 د.أ
              - button "إضافة شاحن أيفون أصلي، السعر 150.00 د.أ" [ref=e138] [cursor=pointer]:
                - img [ref=e141]
                - generic [ref=e144]:
                  - heading "شاحن أيفون أصلي" [level=3] [ref=e145]
                  - generic [ref=e147]: 150.00 د.أ
              - button "إضافة خدمة فورمات وتنظيف، السعر 100.00 د.أ" [ref=e149] [cursor=pointer]:
                - img [ref=e152]
                - generic [ref=e155]:
                  - heading "خدمة فورمات وتنظيف" [level=3] [ref=e156]
                  - generic [ref=e158]: 100.00 د.أ
            - button "إضافة شريحة اتصال انترنت، السعر 30.00 د.أ" [ref=e161] [cursor=pointer]:
              - img [ref=e164]
              - generic [ref=e167]:
                - heading "شريحة اتصال انترنت" [level=3] [ref=e168]
                - generic [ref=e170]: 30.00 د.أ
  - region "Notifications alt+T"
```

# Test source

```ts
  1  | import { test, expect, type Page } from '@playwright/test';
  2  | 
  3  | async function waitForDbReady(page: Page) {
  4  |   const loader = page.getByText('جاري تجهيز قاعدة البيانات');
  5  |   await loader.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
  6  |   await loader.waitFor({ state: 'hidden', timeout: 40_000 });
  7  | }
  8  | 
  9  | async function typePin(page: Page, digits: string) {
  10 |   for (const d of digits) {
  11 |     await page.getByRole('button', { name: `رقم ${d}` }).click();
  12 |     await page.waitForTimeout(80);
  13 |   }
  14 | }
  15 | 
  16 | test.describe('Smoke', () => {
  17 |   test('app loads and DB initialises without critical JS errors', async ({ page }) => {
  18 |     const criticalErrors: string[] = [];
  19 |     page.on('pageerror', (err) => {
  20 |       if (!err.message.includes('OPFS') && !err.message.includes('SAH')) {
  21 |         criticalErrors.push(err.message);
  22 |       }
  23 |     });
  24 | 
  25 |     await page.goto('/');
  26 |     await waitForDbReady(page);
  27 | 
  28 |     expect(criticalErrors).toHaveLength(0);
  29 | 
  30 |     const bodyText = await page.locator('body').textContent();
  31 |     expect(bodyText).toBeTruthy();
  32 |     expect(/[\u0600-\u06FF]/.test(bodyText!)).toBe(true);
  33 |   });
  34 | 
  35 |   test('POS smoke: setup PINs → daily login → add product to cart', async ({ page }) => {
  36 |     await page.goto('/');
  37 |     await waitForDbReady(page);
  38 | 
  39 |     const isSetup = await page
  40 |       .getByText('إعداد أرقام سرية جديدة')
  41 |       .isVisible({ timeout: 3_000 })
  42 |       .catch(() => false);
  43 | 
  44 |     if (isSetup) {
  45 |       // Step 1: daily lock — enter 2222, then confirm 2222
  46 |       await typePin(page, '2222');
  47 |       await page.waitForTimeout(400);
  48 |       await typePin(page, '2222');
  49 |       await page.waitForTimeout(600);
  50 | 
  51 |       // Step 2: admin PIN — enter 1111, then confirm 1111
  52 |       await typePin(page, '1111');
  53 |       await page.waitForTimeout(400);
  54 |       await typePin(page, '1111');
  55 |       await page.waitForTimeout(600);
  56 |     }
  57 | 
  58 |     const isDailyLock = await page
  59 |       .getByText('تسجيل الدخول لليوم')
  60 |       .isVisible({ timeout: 3_000 })
  61 |       .catch(() => false);
  62 | 
  63 |     if (isDailyLock) {
  64 |       await typePin(page, '2222');
  65 |       await page.waitForTimeout(600);
  66 |     }
  67 | 
  68 |     // Navigate to POS
  69 |     await page.goto('/pos');
  70 | 
  71 |     // Product grid loads (seeded products on first run)
  72 |     const addBtn = page.locator('button[aria-label*="إضافة"]').first();
  73 |     await expect(addBtn).toBeVisible({ timeout: 15_000 });
  74 | 
  75 |     // Add first product to cart
> 76 |     await addBtn.click();
     |                  ^ Error: locator.click: Test timeout of 60000ms exceeded.
  77 |     await page.waitForTimeout(400);
  78 | 
  79 |     // Cart should reflect the added item — المجموع appears when cart is non-empty
  80 |     await expect(page.getByText('المجموع').or(page.getByText('الإجمالي')).first()).toBeVisible({
  81 |       timeout: 5_000,
  82 |     });
  83 |   });
  84 | });
  85 | 
```