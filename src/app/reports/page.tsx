import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/supabase/auth'
import { currentMonth, shiftMonth } from '@/lib/month'
import { listTransactionsInMonth } from '@/lib/repos/transactions'
import { listCashMovementsInMonth } from '@/lib/repos/cashMovements'
import ReportView from './ReportView'

interface ReportsPageProps {
  searchParams: Promise<{ month?: string }>
}

/** 分類比較的基準期：往前取三個月。 */
const BASELINE_MONTH_COUNT = 3

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient()
  const userId = await getUserId(supabase)
  if (!userId) redirect('/login')

  const { month } = await searchParams
  const selectedMonth = month ?? currentMonth()
  const baselineMonths = Array.from({ length: BASELINE_MONTH_COUNT }, (_, i) =>
    shiftMonth(selectedMonth, -(i + 1))
  )

  const [{ data: transactions }, { data: cashMovements }, previousResults] = await Promise.all([
    listTransactionsInMonth(supabase, selectedMonth),
    listCashMovementsInMonth(supabase, selectedMonth),
    Promise.all(baselineMonths.map((m) => listTransactionsInMonth(supabase, m))),
  ])

  return (
    <ReportView
      transactions={transactions ?? []}
      cashMovements={cashMovements ?? []}
      previousByMonth={previousResults.map((r) => r.data ?? [])}
      selectedMonth={selectedMonth}
    />
  )
}
