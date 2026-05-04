'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Icon from '@/components/ui/Icon'

const NAV_ITEMS = [
  { href: '/', label: '首頁', icon: 'home' as const },
  { href: '/reports', label: '報表', icon: 'chart' as const },
  { href: '/categories', label: '分類', icon: 'tag' as const },
  { href: '/recurring', label: '定期', icon: 'repeat' as const },
]

export default function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  function handleFab() {
    window.dispatchEvent(new CustomEvent('dmp:open-add'))
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
        paddingBottom: 'env(safe-area-inset-bottom, 16px)',
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
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
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
            aria-label="新增記帳"
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: 'var(--dmp-accent)',
              color: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: -14,
              boxShadow: '0 2px 8px rgba(184,86,43,0.35), 0 0 0 4px rgba(255,253,249,0.95)',
              flexShrink: 0,
              transition: 'transform 0.1s ease',
            }}
            onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)' }}
            onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
            onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.93)' }}
            onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          >
            <Icon name="plus" size={22} strokeWidth={2.2} />
          </button>
        </div>

        {NAV_ITEMS.slice(2).map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
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
