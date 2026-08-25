/**
 * Supabase 連線設定的唯一解讀點。
 *
 * Why: 這兩個值在 Vercel preview 是由 Supabase preview branch 建立時注入的，
 * 沒有 branch 的 deployment 會完全缺值。原本三處都以 `!` 斷言非空，缺值時
 * `createServerClient` 丟出的是「Your project's URL and Key are required」，
 * 看不出成因是「這個 PR 沒有建 preview branch」——2026-08-23 曾因此讓一個
 * preview 整站 500，查了很久才定位。這裡把訊息換成講得出成因與對策的版本。
 *
 * 注意：`process.env.NEXT_PUBLIC_*` 必須寫成完整的靜態存取，Next.js 才會在
 * build 時替換成字面值，不可改寫成 `process.env[name]` 之類的動態存取。
 */

export interface SupabaseEnv {
  url: string
  anonKey: string
}

function missingEnvMessage(missing: string[]): string {
  return [
    `缺少環境變數 ${missing.join('、')}。`,
    'Vercel preview 的這兩個值由 Supabase preview branch 建立時注入；',
    'PR 若沒有 supabase/ 的變動就不會建 branch（見 AGENTS.md 的 npm run pr:trigger）。',
    '本地開發請確認 .env.local。',
  ].join('')
}

/** 讀取並驗證 Supabase 連線設定；缺值時丟出說得出成因的錯誤。 */
export function readSupabaseEnv(): SupabaseEnv {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const missing: string[] = []
  if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL')
  if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  if (!url || !anonKey) throw new Error(missingEnvMessage(missing))

  return { url, anonKey }
}
