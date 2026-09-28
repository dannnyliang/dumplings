import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { pingDatabase, createAnonClient } = vi.hoisted(() => ({
  pingDatabase: vi.fn(),
  createAnonClient: vi.fn(() => ({ tag: 'anon-client' })),
}))

vi.mock('@/lib/repos/keepalive', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/repos/keepalive')>()
  return { ...actual, pingDatabase }
})
vi.mock('@/lib/supabase/anon', () => ({ createAnonClient }))

import { GET } from '@/app/api/keepalive/route'
import { KEEPALIVE_PINGS } from '@/lib/repos/keepalive'

const SECRET = 'test-cron-secret'

function get(authorization?: string) {
  return GET(
    new Request('http://localhost/api/keepalive', {
      headers: authorization ? { authorization } : {},
    })
  )
}

describe('GET /api/keepalive', () => {
  beforeEach(() => {
    vi.stubEnv('CRON_SECRET', SECRET)
    pingDatabase.mockReset()
    pingDatabase.mockResolvedValue({ data: '2026-09-28T00:00:00+00:00', error: null })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('rejects requests without the cron secret', async () => {
    const response = await get()
    expect(response.status).toBe(401)
    expect(pingDatabase).not.toHaveBeenCalled()
  })

  it('rejects a wrong secret', async () => {
    const response = await get('Bearer nope')
    expect(response.status).toBe(401)
    expect(pingDatabase).not.toHaveBeenCalled()
  })

  it('fails closed when CRON_SECRET is not configured', async () => {
    vi.stubEnv('CRON_SECRET', '')
    const response = await get('Bearer undefined')
    expect(response.status).toBe(401)
    expect(pingDatabase).not.toHaveBeenCalled()
  })

  it('pings the database KEEPALIVE_PINGS times with the anon client', async () => {
    const response = await get(`Bearer ${SECRET}`)

    expect(response.status).toBe(200)
    expect(pingDatabase).toHaveBeenCalledTimes(KEEPALIVE_PINGS)
    expect(pingDatabase).toHaveBeenCalledWith({ tag: 'anon-client' })
    await expect(response.json()).resolves.toEqual({
      ok: true,
      pings: KEEPALIVE_PINGS,
      lastPingAt: '2026-09-28T00:00:00+00:00',
    })
  })

  it('returns 502 when a ping fails so the cron log shows it', async () => {
    pingDatabase
      .mockResolvedValueOnce({ data: '2026-09-28T00:00:00+00:00', error: null })
      .mockResolvedValueOnce({ data: null, error: { code: '42501', message: 'permission denied' } })

    const response = await get(`Bearer ${SECRET}`)

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toMatchObject({ ok: false, completed: 1 })
  })
})
