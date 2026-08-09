import { defineConfig, devices } from '@playwright/test'

/**
 * E2E 設定。
 *
 * 一律指向本地 Supabase（127.0.0.1:54321），絕不連正式專案：
 * webServer.env 傳入的值會勝過 .env.local，因為 Next.js 的 loadEnvConfig
 * 不覆寫已存在的 process.env。e2e/fixtures/env.ts 另有執行期斷言把關。
 *
 * 需要本地 stack 運行中（`supabase start`）。
 */

export const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'

/** 本地 stack 的固定 demo key，所有 Supabase 本地環境皆相同，非機密。 */
export const LOCAL_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

export const LOCAL_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const BASE_URL = 'http://localhost:3000'

export default defineConfig({
  testDir: './e2e',
  // 所有測試共用同一個本地資料庫，平行執行會互相污染
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    // 這是手機優先的 PWA，用 iPhone 尺寸而非桌機寬度
    viewport: { width: 390, height: 844 },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: `${BASE_URL}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: LOCAL_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: LOCAL_ANON_KEY,
    },
  },
})
