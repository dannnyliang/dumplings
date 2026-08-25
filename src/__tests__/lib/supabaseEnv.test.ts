import { describe, it, expect, afterEach, vi } from 'vitest'
import { readSupabaseEnv } from '@/lib/supabase/env'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('readSupabaseEnv', () => {
  it('兩個值都在時回傳連線設定', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')

    expect(readSupabaseEnv()).toEqual({
      url: 'http://127.0.0.1:54321',
      anonKey: 'anon-key',
    })
  })

  it('缺 URL 時錯誤訊息指名是哪一個變數', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key')

    expect(() => readSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/)
    expect(() => readSupabaseEnv()).not.toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  })

  it('缺 anon key 時錯誤訊息指名是哪一個變數', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    expect(() => readSupabaseEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/)
  })

  it('兩個都缺時一次列出兩個', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    expect(() => readSupabaseEnv()).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL、NEXT_PUBLIC_SUPABASE_ANON_KEY/
    )
  })

  it('錯誤訊息點出 preview branch 這個常見成因', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '')
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '')

    expect(() => readSupabaseEnv()).toThrow(/preview branch/)
  })
})
