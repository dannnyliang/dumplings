import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/supabase/auth'
import { listActiveCategories } from '@/lib/repos/categories'
import { listActiveRecurring } from '@/lib/repos/recurring'
import RecurringManager from './RecurringManager'

export default async function RecurringPage() {
  const supabase = await createClient()
  const userId = await getUserId(supabase)
  if (!userId) redirect('/login')

  const [{ data: recurring }, { data: categories }] = await Promise.all([
    listActiveRecurring(supabase),
    listActiveCategories(supabase),
  ])

  return (
    <RecurringManager
      initialRecurring={recurring ?? []}
      categories={categories ?? []}
      userId={userId}
    />
  )
}
