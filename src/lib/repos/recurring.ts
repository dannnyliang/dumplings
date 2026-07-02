import type { SupabaseClient } from '@supabase/supabase-js'
import type { RecurringFrequency, TransactionType } from '@/types/database'

/** recurring_transactions 資料表的唯一存取點。 */

export const RECURRING_WITH_CATEGORY = '*, category:categories(id, name)'

export interface NewRecurring {
  amount: number
  type: TransactionType
  category_id: string | null
  note: string | null
  paid_by: string
  frequency: RecurringFrequency
  day_of_month: number | null
  created_by: string
}

export function listActiveRecurring(supabase: SupabaseClient) {
  return supabase
    .from('recurring_transactions')
    .select(RECURRING_WITH_CATEGORY)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
}

/** 新增定期模板並回傳含分類 join 的完整列（供 optimistic 更新）。 */
export function createRecurring(supabase: SupabaseClient, input: NewRecurring) {
  return supabase
    .from('recurring_transactions')
    .insert(input)
    .select(RECURRING_WITH_CATEGORY)
    .single()
}

export function deactivateRecurring(supabase: SupabaseClient, id: string) {
  return supabase.from('recurring_transactions').update({ is_active: false }).eq('id', id)
}
