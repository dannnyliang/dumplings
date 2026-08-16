import { createServerClient } from '@supabase/ssr'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { BrowserContext } from '@playwright/test'
import {
  LOCAL_SUPABASE_URL,
  LOCAL_ANON_KEY,
  LOCAL_SERVICE_ROLE_KEY,
} from '../../playwright.config'

/**
 * 測試用登入。
 *
 * app 只提供 Google OAuth，E2E 無法走真實流程，因此改以帳密登入取得 session。
 * cookie 不手刻：交由 @supabase/ssr（與 app 相同套件、相同版本）產生，
 * 避免其內部格式變動時測試無聲失效。
 */

const TEST_PASSWORD = 'e2e-test-password-1234'

export const TEST_USERS = {
  danny: { email: 'danny@e2e.local', displayName: 'Danny' },
  peiyu: { email: 'peiyu@e2e.local', displayName: 'PeiYu' },
} as const

export type TestUserKey = keyof typeof TEST_USERS

export function adminClient(): SupabaseClient {
  return createClient(LOCAL_SUPABASE_URL, LOCAL_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** 建立兩位測試使用者（已存在則沿用）。profiles 由 handle_new_user trigger 自動建立。 */
export async function ensureTestUsers(): Promise<Record<TestUserKey, string>> {
  const admin = adminClient()
  const { data: existing, error: listError } = await admin.auth.admin.listUsers()
  if (listError) throw listError

  const ids = {} as Record<TestUserKey, string>

  for (const [key, user] of Object.entries(TEST_USERS) as [TestUserKey, (typeof TEST_USERS)[TestUserKey]][]) {
    const found = existing.users.find((u) => u.email === user.email)
    if (found) {
      ids[key] = found.id
      continue
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: user.email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: user.displayName },
    })
    if (error) throw error
    ids[key] = data.user.id
  }

  return ids
}

/** 以指定測試使用者的身分登入，session cookie 注入瀏覽器 context。 */
export async function signInAs(context: BrowserContext, key: TestUserKey): Promise<void> {
  const jar: { name: string; value: string }[] = []

  const supabase = createServerClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        jar.push(...cookies.map(({ name, value }) => ({ name, value })))
      },
    },
  })

  const { error } = await supabase.auth.signInWithPassword({
    email: TEST_USERS[key].email,
    password: TEST_PASSWORD,
  })
  if (error) throw new Error(`測試使用者 ${key} 登入失敗：${error.message}`)
  if (jar.length === 0) throw new Error('登入成功但未產生任何 cookie，@supabase/ssr 行為可能已改變')

  await context.addCookies(
    jar.map((cookie) => ({
      ...cookie,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax' as const,
    }))
  )
}

/** 清空所有交易與現金移動，讓每個測試從已知狀態開始。分類為 seed 資料，保留。 */
export async function resetTransactions(): Promise<void> {
  const admin = adminClient()
  for (const table of ['transactions', 'cash_movements']) {
    const { error } = await admin.from(table).delete().not('id', 'is', null)
    if (error) throw error
  }
}

/**
 * 以指定測試使用者的身分建立 API client（anon key + 帳密登入），
 * 供 RLS 驗證直接打資料庫、不經瀏覽器。
 */
export async function userClient(key: TestUserKey): Promise<SupabaseClient> {
  const client = createClient(LOCAL_SUPABASE_URL, LOCAL_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await client.auth.signInWithPassword({
    email: TEST_USERS[key].email,
    password: TEST_PASSWORD,
  })
  if (error) throw new Error(`測試使用者 ${key} 登入失敗：${error.message}`)
  return client
}
