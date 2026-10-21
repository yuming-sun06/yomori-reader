const { test, expect } = require('@playwright/test');
const { importBook, expectChapter, wheel, position } = require('./helpers.cjs');

test('wheel changes chapters in both directions and restores the previous chapter end', async ({ page }) => {
  await importBook(page);
  await position(page, 'bottom');
  await expectChapter(page, 1); // Programmatic positioning is not a user gesture.
  await wheel(page, 100);
  await expectChapter(page, 2);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await wheel(page, -100);
  await expectChapter(page, 1);
  await expect.poll(() => page.evaluate(() => scrollY + innerHeight > document.documentElement.scrollHeight - 150)).toBe(true);
  await expect(page.locator('#prevChapter')).toBeDisabled();
  await position(page, 'top');
  await wheel(page, -100);
  await expectChapter(page, 1);
});

test('wheel momentum cannot skip short chapters and the last chapter stays put', async ({ page }) => {
  await importBook(page, { short: true });
  await position(page, 'bottom');
  await wheel(page, 100);
  await expectChapter(page, 2);
  await page.mouse.wheel(0, 100);
  // Allow the extra wheel event to settle inside the momentum window.
  await page.waitForTimeout(100);
  await expectChapter(page, 2);
  await position(page, 'bottom');
  await wheel(page, 100);
  await expectChapter(page, 3);
  await position(page, 'bottom');
  await wheel(page, 100);
  await expectChapter(page, 3);
  await expect(page.locator('#nextChapter')).toBeDisabled();
});

test('contents and navigation buttons update the header', async ({ page }) => {
  await importBook(page);
  await page.locator('#tocButton').click();
  await page.locator('#tocList [data-chapter="2"]').click();
  await expectChapter(page, 3);
  await page.locator('#prevChapter').click();
  await expectChapter(page, 2);
  await page.locator('#nextChapter').click();
  await expectChapter(page, 3);
});

test('library settings persist after reload and apply in the reader', async ({ page }) => {
  await page.goto('./');
  await page.locator('#librarySettingsButton').click();
  await expect(page.locator('#settingsDialog')).toBeVisible();
  await page.locator('#fontSize').fill('24');
  await page.locator('#uiLanguage').selectOption('zh-CN');
  await page.locator('#settingsDialog .close').click();
  await page.reload();
  await page.locator('#librarySettingsButton').click();
  await expect(page.locator('#fontSize')).toHaveValue('24');
  await expect(page.locator('#uiLanguage')).toHaveValue('zh-CN');
  await page.locator('#uiLanguage').selectOption('en');
  await page.locator('#settingsDialog .close').click();
  await page.locator('[data-open="__welcome__"]').click();
  await expect(page.locator('#readingContent')).toHaveCSS('font-size', '24px');
  await page.locator('#settingsButton').click();
  await expect(page.locator('#fontSize')).toHaveValue('24');
});

test('chapter and reading position survive closing and reopening the book', async ({ page }) => {
  await importBook(page);
  await page.locator('#nextChapter').click();
  await expectChapter(page, 2);
  await wheel(page, 700);
  await expect(page.locator('#savedText')).toHaveText('Progress saved');
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(100);
  await page.locator('#backButton').click();
  await page.reload();
  await page.getByRole('button', { name: 'Read E2E novel', exact: true }).click();
  await expectChapter(page, 2);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before - 30);
  expect(await page.evaluate(() => scrollY)).toBeLessThan(before + 30);
});

test.describe('offline app shell', () => {
  test.use({ serviceWorkers: 'allow' });
  test('reloads offline with imported books and saved settings', async ({ page, context, browserName }) => {
    test.skip(browserName !== 'chromium', 'Service worker automation is validated in Chromium.');
    await importBook(page);
    await page.locator('#backButton').click();
    await expect(page.locator('#offlineStatus')).toHaveText('Offline ready');
    await page.locator('#librarySettingsButton').click();
    await page.locator('#fontSize').fill('25');
    await page.locator('#settingsDialog .close').click();
    await context.setOffline(true);
    await page.reload();
    await page.getByRole('button', { name: 'Read E2E novel', exact: true }).click();
    await expectChapter(page, 1);
    await expect(page.locator('#readingContent')).toHaveCSS('font-size', '25px');
  });
});
