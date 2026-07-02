import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { listAllCategories } from '@/lib/repos/categories'
import CategoryManager from './CategoryManager'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: categories } = await listAllCategories(supabase)

  return <CategoryManager initialCategories={categories ?? []} />
}
