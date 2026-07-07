import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/supabase/auth'
import { currentMonth } from '@/lib/month'
import { listTransactionsInMonth } from '@/lib/repos/transactions'
import ReportView from './ReportView'

interface ReportsPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)
  if (!userId) redirect('/login')

  const { month } = await searchParams
  const selectedMonth = month ?? currentMonth()

  const { data: transactions } = await listTransactionsInMonth(supabase, selectedMonth)

  return (
    <ReportView
      transactions={transactions ?? []}
      selectedMonth={selectedMonth}
    />
  )
}
