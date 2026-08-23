import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { readSupabaseEnv } from './env'

export async function createClient() {
  const cookieStore = await cookies()
  const { url, anonKey } = readSupabaseEnv()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Server Component 中無法設定 cookie，middleware 會處理
        }
      },
    },
  })
}
