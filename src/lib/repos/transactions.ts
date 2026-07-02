import type { SupabaseClient } from '@supabase/supabase-js'
import { monthRange } from '@/lib/month'
import type { NewTransaction } from '@/types/database'

/**
 * transactions 資料表的唯一存取點。
 * select 形狀以 TRANSACTION_WITH_CATEGORY 為準，避免各頁面自行拼字串而分歧。
 */

export const TRANSACTION_WITH_CATEGORY = '*, category:categories(id, name, emoji, color)'

const DEFAULT_RECENT_LIMIT = 100

export function listRecentTransactions(supabase: SupabaseClient, limit = DEFAULT_RECENT_LIMIT) {
  return supabase
    .from('transactions')
    .select(TRANSACTION_WITH_CATEGORY)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
}

export function listTransactionsInMonth(supabase: SupabaseClient, month: string) {
  const { start, end } = monthRange(month)
  return supabase
    .from('transactions')
    .select(TRANSACTION_WITH_CATEGORY)
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: false })
}

export function createTransaction(
  supabase: SupabaseClient,
  input: NewTransaction & { created_by: string }
) {
  return supabase.from('transactions').insert(input)
}

export function updateTransaction(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<NewTransaction>
) {
  return supabase.from('transactions').update(patch).eq('id', id)
}

export function deleteTransaction(supabase: SupabaseClient, id: string) {
  return supabase.from('transactions').delete().eq('id', id)
}

/** 標記／還原代墊的還清狀態，reimbursed_at 一併蓋章或清空。 */
export function setTransactionReimbursed(
  supabase: SupabaseClient,
  id: string,
  isReimbursed: boolean
) {
  const patch = isReimbursed
    ? { is_reimbursed: true, reimbursed_at: new Date().toISOString() }
    : { is_reimbursed: false, reimbursed_at: null }
  return supabase.from('transactions').update(patch).eq('id', id)
}
