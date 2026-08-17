import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/supabase/auth'
import { getProfileNameMap } from '@/lib/repos/profiles'
import { fetchAllTransactions } from '@/lib/repos/transactions'
import { fetchAllCashMovements } from '@/lib/repos/cashMovements'
import { listActiveCategories } from '@/lib/repos/categories'
import Link from 'next/link'
import TransactionsBoard from '@/components/TransactionsBoard'
import DumplingMark from '@/components/ui/DumplingMark'
import Icon from '@/components/ui/Icon'

export default async function Home() {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  if (!userId) {
    redirect('/login')
  }

  // 餘額計算需涵蓋全部紀錄，不可用「最近 N 筆」視窗（明細的顯示上限由 board 處理）
  const [{ data: transactions }, { data: cashMovements }, profiles, { data: categories }] =
    await Promise.all([
      fetchAllTransactions(supabase),
      fetchAllCashMovements(supabase),
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
        <Link href="/settings" aria-label="設定" className="text-muted flex">
          <Icon name="settings" size={22} />
        </Link>
      </header>

      <TransactionsBoard
        initialTransactions={transactions ?? []}
        initialCashMovements={cashMovements ?? []}
        userId={userId}
        profiles={profiles}
        categories={categories ?? []}
      />
    </main>
  )
}
