'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DumplingMark from '@/components/ui/DumplingMark'

/**
 * Preview 部署改以帳密登入測試帳號（帳號由 supabase/seed.sql 建立）。
 * 原因：preview branch 的 Supabase 專案 ref 每個分支都不同，Google OAuth 的
 * redirect URI 無法事先登記，OAuth 在 preview 上註定失敗且無法自動化。
 */
const PREVIEW_ACCOUNTS = ['preview-danny@dumplings.test', 'preview-peiyu@dumplings.test']

function PreviewPasswordLogin() {
  const router = useRouter()
  const [email, setEmail] = useState(PREVIEW_ACCOUNTS[0])
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const supabase = createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setSubmitting(false)
      return
    }
    router.push('/')
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-2 border-t border-[rgba(60,40,20,0.12)] pt-5">
      <p className="m-0 text-xs font-semibold tracking-[0.5px] text-[#9B8A76] uppercase">
        Preview 測試登入
      </p>
      <select
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="測試帳號"
        className="w-full rounded-[10px] border border-[rgba(60,40,20,0.12)] bg-white px-3 py-2.5 text-sm text-[#2B1D12] outline-none"
      >
        {PREVIEW_ACCOUNTS.map((account) => (
          <option key={account} value={account}>
            {account}
          </option>
        ))}
      </select>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密碼"
        required
        className="w-full rounded-[10px] border border-[rgba(60,40,20,0.12)] bg-white px-3 py-2.5 text-sm text-[#2B1D12] outline-none"
      />
      {error && <p className="m-0 text-xs text-[#B83B3B]">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !password}
        className="w-full cursor-pointer rounded-[10px] border-none bg-[#2B1D12] py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? '登入中…' : '以測試帳號登入'}
      </button>
      <p className="m-0 text-[11px] leading-relaxed text-[#9B8A76]">
        密碼見 supabase/seed.sql（此環境僅有測試資料）
      </p>
    </form>
  )
}

export default function LoginPage() {
  const isPreview = process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview'

  async function handleGoogleLogin() {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) alert(error.message)
  }

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBF7F1' }}>
      <div style={{ width: '100%', maxWidth: 360, borderRadius: 24, background: '#FFFFFF', padding: '40px 32px', boxShadow: '0 8px 28px rgba(60,40,20,0.10)', margin: '0 16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DumplingMark size={36} />
            <span style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Noto Sans TC", system-ui, sans-serif', fontWeight: 700, fontSize: 26, color: '#2B1D12', letterSpacing: -0.3 }}>Dumplings</span>
          </div>
          <p style={{ fontSize: 14, color: '#9B8A76', margin: 0 }}>Danny &amp; PeiYu 的共同記帳本</p>
        </div>
        <button
          onClick={handleGoogleLogin}
          style={{
            display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'center', gap: 10,
            borderRadius: 14, border: '1px solid rgba(60,40,20,0.12)', background: '#FFFFFF',
            padding: '12px 16px', fontSize: 15, fontWeight: 500, color: '#2B1D12',
            boxShadow: '0 1px 2px rgba(60,40,20,0.04)', cursor: 'pointer',
          }}
        >
          <svg style={{ width: 20, height: 20, flexShrink: 0 }} viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          使用 Google 帳號登入
        </button>

        {isPreview && <PreviewPasswordLogin />}
      </div>
    </main>
  )
}
