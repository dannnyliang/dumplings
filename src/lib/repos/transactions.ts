import type { SupabaseClient } from '@supabase/supabase-js'
import { monthRange } from '@/lib/month'
import type { NewTransaction, Transaction } from '@/types/database'

/**
 * transactions 資料表的唯一存取點。
 * select 形狀以 TRANSACTION_WITH_CATEGORY 為準，避免各頁面自行拼字串而分歧。
 */

export const TRANSACTION_WITH_CATEGORY = '*, category:categories(id, name, emoji, color)'

/** PostgREST 單次查詢的列數上限；彙總用途必須分頁抓齊。 */
const FETCH_PAGE_SIZE = 1000

export interface FetchAllResult<T> {
  data: T[] | null
  error: unknown
}

/**
 * 全部消費紀錄（依 date desc、created_at desc）。
 * 餘額等彙總計算的資料來源不可截斷——單次查詢有列數上限，因此分頁抓齊。
 */
export async function fetchAllTransactions(
  supabase: SupabaseClient
): Promise<FetchAllResult<Transaction>> {
  const all: Transaction[] = []
  for (let offset = 0; ; offset += FETCH_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('transactions')
      .select(TRANSACTION_WITH_CATEGORY)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset + FETCH_PAGE_SIZE - 1)
    if (error) return { data: null, error }
    all.push(...((data ?? []) as unknown as Transaction[]))
    if ((data ?? []).length < FETCH_PAGE_SIZE) return { data: all, error: null }
  }
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
