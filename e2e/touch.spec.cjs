const { test, expect } = require('@playwright/test');
const { importBook, expectChapter, position } = require('./helpers.cjs');

async function swipe(session, from, to) {
  await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 180, y: from }] });
  for (let i = 1; i <= 8; i++) {
    await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: from + (to - from) * i / 8 }] });
  }
  await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}

test('native touch gestures change chapters both ways without skipping', async ({ page, context }) => {
  await importBook(page, { short: true });
  const session = await context.newCDPSession(page);
  await position(page, 'bottom');
  await swipe(session, 600, 250);
  await expectChapter(page, 2);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await swipe(session, 250, 600);
  await expectChapter(page, 1);
  await position(page, 'top');
  await swipe(session, 250, 600);
  await expectChapter(page, 1);
  await expect(page.locator('#prevChapter')).toBeDisabled();
});
