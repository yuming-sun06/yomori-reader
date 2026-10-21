const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173/reader/',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium', viewport: { width: 1280, height: 720 } }, testIgnore: '**/touch.spec.cjs' },
    { name: 'webkit-narrow', use: { browserName: 'webkit', viewport: { width: 390, height: 844 } }, testIgnore: '**/touch.spec.cjs' },
    { name: 'chromium-touch', use: { browserName: 'chromium', hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } }, testMatch: '**/touch.spec.cjs' },
  ],
  webServer: {
    command: 'node scripts/serve-e2e.cjs',
    url: 'http://127.0.0.1:4173/reader/',
    reuseExistingServer: false,
  },
});
