import type { SupabaseClient } from '@supabase/supabase-js'
import type { Category } from '@/types/database'

/** categories 資料表的唯一存取點。 */

export type CategoryPatch = Partial<Pick<Category, 'name' | 'emoji' | 'color' | 'is_active'>>

export function listActiveCategories(supabase: SupabaseClient) {
  return supabase.from('categories').select('*').eq('is_active', true).order('name')
}

export function listAllCategories(supabase: SupabaseClient) {
  return supabase
    .from('categories')
    .select('*')
    .order('is_active', { ascending: false })
    .order('name')
}

export function createCategory(
  supabase: SupabaseClient,
  input: Pick<Category, 'name' | 'emoji' | 'color'> & { created_by: string }
) {
  return supabase.from('categories').insert(input).select().single()
}

export function updateCategory(supabase: SupabaseClient, id: string, patch: CategoryPatch) {
  return supabase.from('categories').update(patch).eq('id', id)
}

export function deleteCategory(supabase: SupabaseClient, id: string) {
  return supabase.from('categories').delete().eq('id', id)
}
