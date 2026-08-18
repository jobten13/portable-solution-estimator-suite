/**
 * Playwright configuration for the Portable Solution Estimator Suite test harness.
 *
 * Notes:
 * - We use a single worker (workers: 1) to make HTML report generation deterministic.
 * - We start a tiny local server so tests run over http:// (not file://).
 */
const path = require('path');

const PORT = parseInt(process.env.PORT || '4173', 10);
const BASE_URL = `http://localhost:${PORT}`;

module.exports = {
  testDir: './',
  fullyParallel: false,
  workers: 1,
  timeout: 240_000,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    bypassCSP: true,
    extraHTTPHeaders: { 'Cache-Control': 'no-cache' }
  },
  webServer: {
    command: `node serve.js`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000
  },
  // Only run one browser for now (Chrome/Chromium).
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium'
      }
    }
  ]
};

