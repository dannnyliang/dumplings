import { test, expect } from '@playwright/test'

/**
 * 環境把關。這些斷言不測功能，只確保 E2E 跑在隔離的本地環境上。
 * 若有任何一條失敗，其餘測試的結果一律不可信。
 */

test('絕不連向正式 Supabase 專案', async ({ page }) => {
  const remoteRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('supabase.co')) {
      remoteRequests.push(request.url())
    }
  })

  await page.goto('/login')
  await page.waitForLoadState('networkidle')

  expect(remoteRequests, '偵測到連向正式 Supabase 的請求').toEqual([])
})

test('未登入時導向登入頁', async ({ page }) => {
  await page.goto('/')

  await expect(page).toHaveURL(/\/login$/)
})
