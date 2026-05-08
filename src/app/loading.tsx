import DumplingMark from '@/components/ui/DumplingMark'

const PULSE = 'animate-pulse rounded-2xl bg-[var(--dmp-surface-alt)]'

export default function HomeLoading() {
  return (
    <main style={{ minHeight: '100dvh', backgroundColor: 'var(--dmp-bg)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky', top: 0, zIndex: 10,
        backgroundColor: 'var(--dmp-bg)',
        borderBottom: '1px solid var(--dmp-border)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, color: 'var(--dmp-text)', margin: 0 }}>
          <DumplingMark size={28} />
          Dumplings
        </h1>
      </header>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className={PULSE} style={{ height: 96 }} />
        <div className={PULSE} style={{ height: 120 }} />
        <div className={PULSE} style={{ height: 64 }} />
        <div className={PULSE} style={{ height: 64 }} />
        <div className={PULSE} style={{ height: 64 }} />
      </div>
    </main>
  )
}
