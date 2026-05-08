import Link from 'next/link'
import Icon from '@/components/ui/Icon'

const PULSE = 'animate-pulse rounded-2xl bg-[var(--dmp-surface-alt)]'

export default function ReportsLoading() {
  return (
    <main style={{ minHeight: '100dvh', backgroundColor: 'var(--dmp-bg)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'var(--dmp-bg)',
        borderBottom: '1px solid var(--dmp-border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Link href="/" style={{ color: 'var(--dmp-text-muted)', display: 'flex' }}>
          <Icon name="back" size={22} />
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--dmp-text)', margin: 0, flex: 1 }}>報表</h1>
      </header>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className={PULSE} style={{ height: 48 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className={PULSE} style={{ height: 72 }} />
          <div className={PULSE} style={{ height: 72 }} />
        </div>
        <div className={PULSE} style={{ height: 280 }} />
        <div className={PULSE} style={{ height: 44 }} />
        <div className={PULSE} style={{ height: 220 }} />
      </div>
    </main>
  )
}
