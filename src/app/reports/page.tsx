import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReportView from './ReportView'

interface ReportsPageProps {
  searchParams: Promise<{ month?: string }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { month } = await searchParams
  const now = new Date()
  const selectedMonth = month ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const [year, mon] = selectedMonth.split('-')
  const startDate = `${year}-${mon}-01`
  const lastDay = new Date(Number(year), Number(mon), 0).getDate()
  const endDate = `${year}-${mon}-${String(lastDay).padStart(2, '0')}`

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, category:categories(id, name)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false })

  return (
    <ReportView
      transactions={transactions ?? []}
      selectedMonth={selectedMonth}
    />
  )
}
