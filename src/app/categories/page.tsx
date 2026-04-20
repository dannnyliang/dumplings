import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CategoryManager from './CategoryManager'

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name')

  return <CategoryManager initialCategories={categories ?? []} />
}
