'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import Icon from '@/components/ui/Icon'
import DumplingMark from '@/components/ui/DumplingMark'
import { tryHaptic } from '@/lib/haptics'
import { directionBetween, setNavDirection } from '@/lib/navDirection'

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: 'home' as const },
  { href: '/reports', label: '報表', icon: 'chart' as const },
  { href: '/categories', label: '分類', icon: 'tag' as const },
  { href: '/recurring', label: '定期', icon: 'repeat' as const },
]

const PREFETCH_PATHS = NAV_ITEMS.map((i) => i.href)
const NAV_ORDER = PREFETCH_PATHS

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  // transition 進行中才顯示的目標路徑；結束後 visiblePath 會自動 fallback 回 pathname，
  // 因此不需要用 effect 手動清除（避免 set-state-in-effect 的 cascading render）。
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    if (!router?.prefetch) return
    PREFETCH_PATHS.forEach((p) => {
      try { router.prefetch(p) } catch { /* prefetch is best-effort */ }
    })
  }, [router])

  if (pathname === '/login') return null

  const visiblePath = isPending && pendingHref ? pendingHref : pathname
  const isHome = visiblePath === '/'

  function handleNav(e: React.MouseEvent, href: string): void {
    e.preventDefault()
    if (href === pathname) return
    tryHaptic()
    setNavDirection(directionBetween(NAV_ORDER, pathname, href))
    setPendingHref(href)
    startTransition(() => router.push(href))
  }

  function handleTouchPrefetch(href: string): void {
    if (router?.prefetch) {
      try { router.prefetch(href) } catch { /* best-effort */ }
    }
  }

  function handleFab(): void {
    if (isHome) {
      window.dispatchEvent(new CustomEvent('dmp:open-add'))
      return
    }
    tryHaptic()
    setNavDirection(directionBetween(NAV_ORDER, pathname, '/'))
    setPendingHref('/')
    startTransition(() => router.push('/'))
  }

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        background: 'rgba(255,253,249,0.82)',
        backdropFilter: 'saturate(180%) blur(22px)',
        WebkitBackdropFilter: 'saturate(180%) blur(22px)',
        borderTop: '0.5px solid var(--dmp-border)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 18px)',
      }}
    >
      <div
        style={{
          maxWidth: 480,
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 72px 1fr 1fr',
          alignItems: 'end',
          height: 54,
        }}
      >
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const isActive = visiblePath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="dmp-nav-link"
              onClick={(e) => handleNav(e, item.href)}
              onTouchStart={() => handleTouchPrefetch(item.href)}
              onMouseEnter={() => handleTouchPrefetch(item.href)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                height: '100%',
                color: isActive ? 'var(--dmp-accent)' : 'var(--dmp-text-muted)',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon name={item.icon} size={22} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: 10.5, letterSpacing: 0.1 }}>{item.label}</span>
            </Link>
          )
        })}

        {/* FAB centre slot */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 6 }}>
          <button
            onClick={handleFab}
            aria-label={isHome ? '新增記帳' : '回到首頁'}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: isHome ? 'var(--dmp-accent)' : 'var(--dmp-surface)',
              color: isHome ? '#FFFFFF' : 'var(--dmp-accent)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -14,
              boxShadow: isHome
                ? '0 2px 8px rgba(184,86,43,0.35), 0 0 0 4px rgba(255,253,249,0.95)'
                : '0 2px 8px rgba(60,40,20,0.12), 0 0 0 4px rgba(255,253,249,0.95)',
              flexShrink: 0,
              transition: 'transform 0.1s ease, background-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease',
              perspective: 600,
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)' }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)' }}
            onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.45s cubic-bezier(0.4, 0.0, 0.2, 1)',
                transform: isHome ? 'rotateY(0deg)' : 'rotateY(180deg)',
              }}
            >
              <span style={{ position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', display: 'flex' }}>
                <Icon name="plus" size={22} strokeWidth={2.2} />
              </span>
              <span style={{ position: 'absolute', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', display: 'flex' }}>
                <DumplingMark size={26} />
              </span>
            </span>
          </button>
        </div>

        {NAV_ITEMS.slice(2).map((item) => {
          const isActive = visiblePath === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="dmp-nav-link"
              onClick={(e) => handleNav(e, item.href)}
              onTouchStart={() => handleTouchPrefetch(item.href)}
              onMouseEnter={() => handleTouchPrefetch(item.href)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                height: '100%',
                color: isActive ? 'var(--dmp-accent)' : 'var(--dmp-text-muted)',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
              }}
            >
              <Icon name={item.icon} size={22} strokeWidth={isActive ? 2 : 1.5} />
              <span style={{ fontSize: 10.5, letterSpacing: 0.1 }}>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
