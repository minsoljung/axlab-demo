import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  workers: 1,
  fullyParallel: false,
  retries: 0,
  // slowMo 600ms 가 동작마다 붙으므로 테스트당 시간 한도를 30s → 90s 로 올렸다.
  timeout: 90_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:3100',
    trace: 'retain-on-failure',
    // 사용자 지시: e2e 는 headed + slowMo 600
    headless: false,
    launchOptions: { slowMo: 600 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run start:test',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      APP_TEST_MODE: '1',
      ADMIN_ACCESS_CODE: 'test-admin-code',
      PORT: '3100',
    },
  },
});
