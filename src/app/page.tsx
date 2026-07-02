import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getProfileNameMap } from '@/lib/repos/profiles'
import { listRecentTransactions } from '@/lib/repos/transactions'
import TransactionList from '@/components/TransactionList'
import BalanceSummary from '@/components/BalanceSummary'
import AddTransactionButton from '@/components/AddTransactionButton'
import SparkBarChart from '@/components/SparkBarChart'
import DumplingMark from '@/components/ui/DumplingMark'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: transactions }, profiles] = await Promise.all([
    listRecentTransactions(supabase),
    getProfileNameMap(supabase),
  ])

  return (
    <main style={{ minHeight: '100dvh', backgroundColor: 'var(--dmp-bg)', paddingBottom: 100 }}>
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'var(--dmp-bg)',
        borderBottom: '1px solid var(--dmp-border)',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 20, fontWeight: 700, color: 'var(--dmp-text)', margin: 0 }}>
          <DumplingMark size={28} />
          Dumplings
        </h1>
        <form action="/auth/signout" method="post">
          <button type="submit" style={{ fontSize: 13, color: 'var(--dmp-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
            登出
          </button>
        </form>
      </header>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <BalanceSummary transactions={transactions ?? []} profiles={profiles} />

        <div style={{ backgroundColor: 'var(--dmp-surface)', borderRadius: 24, padding: '16px 20px', boxShadow: 'var(--dmp-shadow-soft)' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--dmp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
            近 14 天支出
          </p>
          <SparkBarChart transactions={transactions ?? []} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--dmp-text)' }}>最近交易</span>
          </div>
          <TransactionList transactions={transactions ?? []} userId={user.id} profiles={profiles} />
        </div>
      </div>

      <AddTransactionButton userId={user.id} />
    </main>
  )
}
