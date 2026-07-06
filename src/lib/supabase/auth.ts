import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * 認證身分的唯一存取點。
 *
 * 用 getClaims()（本地驗 JWT 簽章）取代 getUser()（每次打 Auth 伺服器），
 * 消除每次換頁在 proxy 與各 page 各一次的 auth 網路往返。
 *
 * 前提：Supabase 專案需啟用非對稱 JWT 簽章金鑰（RS256/ES256）才會純本地驗簽；
 * 若仍是對稱 secret，getClaims() 會自動退回網路呼叫（功能正確，只是沒有提速效果）。
 *
 * claims.sub 即 user id，等同於 getUser() 回傳的 user.id。
 */
export async function getUserId(supabase: SupabaseClient): Promise<string | null> {
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data) return null
  return data.claims.sub ?? null
}
