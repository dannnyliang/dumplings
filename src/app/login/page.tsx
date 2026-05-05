'use client'

import { createClient } from '@/lib/supabase/client'
import DumplingMark from '@/components/ui/DumplingMark'

export default function LoginPage() {
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
      </div>
    </main>
  )
}
