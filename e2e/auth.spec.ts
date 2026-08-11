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

test('登入後顯示登出入口', async ({ page, context }) => {
  await signInAs(context, 'danny')

  await page.goto('/')

  await expect(page.getByRole('button', { name: '登出' })).toBeVisible()
})

test('兩位使用者皆可登入（household 共享模型的前提）', async ({ page, context }) => {
  await signInAs(context, 'peiyu')

  await page.goto('/')

  await expect(page).not.toHaveURL(/\/login/)
  expect(TEST_USERS.peiyu.displayName).toBe('PeiYu')
})
