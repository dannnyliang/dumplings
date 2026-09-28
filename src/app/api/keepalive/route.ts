import { NextResponse } from 'next/server'
import { createAnonClient } from '@/lib/supabase/anon'
import { KEEPALIVE_PINGS, pingDatabase } from '@/lib/repos/keepalive'

/**
 * 給 Vercel Cron 打的 keepalive 端點（排程見 vercel.json）。
 *
 * Vercel 只有在專案設了 CRON_SECRET 環境變數時才會帶
 * `Authorization: Bearer <CRON_SECRET>`，這裡照樣比對。沒設定時一律拒絕：
 * 若寫成比對 `Bearer ${undefined}`，帶字串 "Bearer undefined" 就能通過。
 *
 * 任何一次 ping 失敗就回 502，讓 Vercel 的 cron 記錄看得出來這次沒保到活。
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const authorization = request.headers.get('authorization')
  if (!secret || authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  const supabase = createAnonClient()
  let lastPingAt: string | null = null

  for (let i = 0; i < KEEPALIVE_PINGS; i++) {
    const { data, error } = await pingDatabase(supabase)
    if (error) {
      console.error('[api/keepalive] ping failed:', error.code, error.message)
      return NextResponse.json(
        { ok: false, error: error.message, completed: i, planned: KEEPALIVE_PINGS },
        { status: 502 }
      )
    }
    lastPingAt = data
  }

  return NextResponse.json({ ok: true, pings: KEEPALIVE_PINGS, lastPingAt })
}
