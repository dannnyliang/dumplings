import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserId } from '@/lib/supabase/auth'
import { listAllCategories } from '@/lib/repos/categories'
import CategoryManager from './CategoryManager'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const userId = await getUserId(supabase)

  if (!userId) redirect('/login')

  const { data: categories } = await listAllCategories(supabase)

  return <CategoryManager initialCategories={categories ?? []} />
}
