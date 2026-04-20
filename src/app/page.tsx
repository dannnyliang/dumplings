import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TransactionList from '@/components/TransactionList'
import BalanceSummary from '@/components/BalanceSummary'
import AddTransactionButton from '@/components/AddTransactionButton'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const [{ data: transactions }, { data: profilesData }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, category:categories(id, name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('profiles').select('id, display_name'),
  ])

  const profiles: Record<string, string> = Object.fromEntries(
    (profilesData ?? []).map((p) => [p.id, p.display_name])
  )

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">🥟 Dumplings</h1>
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            登出
          </button>
        </form>
      </header>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        <BalanceSummary transactions={transactions ?? []} profiles={profiles} />
        <TransactionList transactions={transactions ?? []} userId={user.id} profiles={profiles} />
      </div>

      <AddTransactionButton userId={user.id} />
    </main>
  )
}
