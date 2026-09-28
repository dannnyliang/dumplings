import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * keepalive 的唯一存取點。
 *
 * 免費方案的 Supabase 專案 7 天內「使用者資料庫活動」不足就會被暫停，
 * 官方文件說每天幾次資料庫請求就足夠。anon 對所有資料表都沒有權限，
 * 所以改呼叫 migration 20260928230837 提供的 keepalive() 函式，
 * 它能確實在資料庫執行一條查詢。
 */

/**
 * 每次排程要打幾次。Vercel Hobby 的 cron 一天只能跑一次，而文件的門檻
 * 是「每天幾次」，一次排程多打幾下把餘裕拉開；成本只是幾毫秒。
 */
export const KEEPALIVE_PINGS = 3

/** 在資料庫執行一條查詢，回傳資料庫當下的時間。 */
export function pingDatabase(supabase: SupabaseClient) {
  return supabase.rpc('keepalive')
}
