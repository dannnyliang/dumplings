import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { readSupabaseEnv } from './env'

/**
 * 沒有使用者身分的 Supabase client，給排程等非互動情境使用。
 *
 * server.ts 的 client 綁著 next/headers 的 cookie，排程請求沒有 cookie 也
 * 不該有 session；這裡直接用 anon key 建 client，並關掉 session 持久化與
 * token 自動更新，避免在 serverless 環境留下背景計時器。
 */
export function createAnonClient() {
  const { url, anonKey } = readSupabaseEnv()
  return createSupabaseClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
