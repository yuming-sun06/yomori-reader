const { expect } = require('@playwright/test');

const title = n => `Chapter ${n}: Test chapter ${n}`;
async function importBook(page, { short = false } = {}) {
  await page.goto('./');
  await expect(page.locator('#importButton')).toBeEnabled();
  const body = Array.from({ length: short ? 1 : 45 }, (_, i) => `Paragraph ${i + 1}. A quiet traveler reads a book beside the river. `.repeat(short ? 1 : 4)).join('\n');
  const text = [1, 2, 3].map(n => `${title(n)}\n${body}`).join('\n');
  await page.locator('#fileInput').setInputFiles({ name: 'E2E novel.txt', mimeType: 'text/plain', buffer: Buffer.from(text) });
  await expect(page.locator('#txtImportDialog')).toBeVisible();
  await page.locator('#confirmTxtImport').click();
  await page.getByRole('button', { name: 'Read E2E novel', exact: true }).click();
  await expectChapter(page, 1);
}
async function expectChapter(page, n) {
  await expect(page.locator('#readerTitle')).toHaveText(title(n));
  await expect(page.locator('#readingContent h1')).toHaveText(title(n));
  await expect(page.locator('#chapterCounter')).toHaveText(`${n} / 3`);
}
async function wheel(page, delta) {
  // Separate intentional gestures from the 220 ms momentum-deduplication window.
  await page.waitForTimeout(300);
  await page.mouse.move(180, 300);
  await page.mouse.wheel(0, delta);
}
async function position(page, edge) {
  // Position the document without invoking app navigation. Real wheel/touch input
  // below must cause the chapter transition, not this setup scroll.
  await page.evaluate(edge => window.scrollTo(0, edge === 'bottom' ? document.documentElement.scrollHeight : 0), edge);
  await expect.poll(() => page.evaluate(edge => edge === 'bottom' ? Math.abs(scrollY + innerHeight - document.documentElement.scrollHeight) <= 2 : scrollY === 0, edge)).toBe(true);
}
module.exports = { title, importBook, expectChapter, wheel, position };
