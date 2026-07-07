import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/supabase/auth'
import { getProfileNameMap } from '@/lib/repos/profiles'
import { listRecentTransactions } from '@/lib/repos/transactions'
import { listActiveCategories } from '@/lib/repos/categories'
import TransactionsBoard from '@/components/TransactionsBoard'
import DumplingMark from '@/components/ui/DumplingMark'

export default async function Home() {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  if (!userId) {
    redirect('/login')
  }

  const [{ data: transactions }, profiles, { data: categories }] = await Promise.all([
    listRecentTransactions(supabase),
    getProfileNameMap(supabase),
    listActiveCategories(supabase),
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

      <TransactionsBoard
        initialTransactions={transactions ?? []}
        userId={userId}
        profiles={profiles}
        categories={categories ?? []}
      />
    </main>
  )
}
