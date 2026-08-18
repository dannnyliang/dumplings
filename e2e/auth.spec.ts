import { test, expect } from '@playwright/test'
import { ensureTestUsers, signInAs, TEST_USERS } from './fixtures/auth'

test.beforeAll(async () => {
  await ensureTestUsers()
})

test('登入後可進入首頁，不再被導向登入頁', async ({ page, context }) => {
  await signInAs(context, 'danny')

  await page.goto('/')

  await expect(page).not.toHaveURL(/\/login/)
})

// 2026-08-18 經使用者同意調整：登出入口依 design D7 移入設定頁，
// 測試改為驗證完整路徑（首頁 → 設定 → 登出按鈕），斷言本身不變。
test('登入後顯示登出入口', async ({ page, context }) => {
  await signInAs(context, 'danny')

  await page.goto('/')
  await page.getByRole('link', { name: '設定' }).click()

  await expect(page.getByRole('button', { name: '登出' })).toBeVisible()
})

test('兩位使用者皆可登入（household 共享模型的前提）', async ({ page, context }) => {
  await signInAs(context, 'peiyu')

  await page.goto('/')

  await expect(page).not.toHaveURL(/\/login/)
  expect(TEST_USERS.peiyu.displayName).toBe('PeiYu')
})
