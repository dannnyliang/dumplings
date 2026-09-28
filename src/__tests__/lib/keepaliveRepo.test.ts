import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { pingDatabase, KEEPALIVE_PINGS } from '@/lib/repos/keepalive'

describe('keepalive repo', () => {
  it('pingDatabase calls the keepalive rpc', async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: '2026-09-28T00:00:00+00:00', error: null }))
    const supabase = { rpc } as unknown as SupabaseClient

    const { data } = await pingDatabase(supabase)

    expect(rpc).toHaveBeenCalledWith('keepalive')
    expect(data).toBe('2026-09-28T00:00:00+00:00')
  })

  it('pings more than once per run so a daily cron clears the "a few per day" bar', () => {
    expect(KEEPALIVE_PINGS).toBeGreaterThan(1)
  })
})
