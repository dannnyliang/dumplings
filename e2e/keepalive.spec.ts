import { test, expect } from '@playwright/test'
import { E2E_CRON_SECRET } from '../playwright.config'

/**
 * 保活端點的整合驗證：這是唯一能證明「從零重放的資料庫上，anon 真的能
 * 執行 keepalive()」的地方。單元測試把 rpc mock 掉了，看不到權限問題。
 */
test.describe('/api/keepalive', () => {
  test('沒帶密鑰時回 401，而不是被 proxy 導去 /login', async ({ request }) => {
    const response = await request.get('/api/keepalive', { maxRedirects: 0 })
    expect(response.status()).toBe(401)
  })

  test('帶密鑰時以 anon 身分在資料庫跑完全部 ping', async ({ request }) => {
    const response = await request.get('/api/keepalive', {
      headers: { authorization: `Bearer ${E2E_CRON_SECRET}` },
    })
    expect(response.status()).toBe(200)

    const body = (await response.json()) as { ok: boolean; pings: number; lastPingAt: string }
    expect(body.ok).toBe(true)
    expect(body.pings).toBeGreaterThan(1)
    expect(Number.isNaN(Date.parse(body.lastPingAt))).toBe(false)
  })
})
