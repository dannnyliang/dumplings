import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RecurringManager from './RecurringManager'

export default async function RecurringPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: recurring }, { data: categories }] = await Promise.all([
    supabase
      .from('recurring_transactions')
      .select('*, category:categories(id, name)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('name'),
  ])

  return (
    <RecurringManager
      initialRecurring={recurring ?? []}
      categories={categories ?? []}
      userId={user.id}
    />
  )
}
