import type { SupabaseClient } from '@supabase/supabase-js'
import { monthRange } from '@/lib/month'
import type { CashMovement, NewCashMovement } from '@/types/database'

/** cash_movements 資料表的唯一存取點。 */

/** PostgREST 單次查詢的列數上限；彙總用途必須分頁抓齊。 */
const FETCH_PAGE_SIZE = 1000

export interface FetchAllResult<T> {
  data: T[] | null
  error: unknown
}

/**
 * 全部現金移動（依 date desc、created_at desc）。
 * 現金餘額必須涵蓋全部紀錄，因此分頁抓齊、不可截斷。
 */
export async function fetchAllCashMovements(
  supabase: SupabaseClient
): Promise<FetchAllResult<CashMovement>> {
  const all: CashMovement[] = []
  for (let offset = 0; ; offset += FETCH_PAGE_SIZE) {
    const { data, error } = await supabase
      .from('cash_movements')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('id', { ascending: true })
      .range(offset, offset + FETCH_PAGE_SIZE - 1)
    if (error) return { data: null, error }
    all.push(...((data ?? []) as CashMovement[]))
    if ((data ?? []).length < FETCH_PAGE_SIZE) return { data: all, error: null }
  }
}

export function listCashMovementsInMonth(supabase: SupabaseClient, month: string) {
  return supabase
    .from('cash_movements')
    .select('*')
    .gte('date', monthRange(month).start)
    .lte('date', monthRange(month).end)
    .order('date', { ascending: false })
}

export function createCashMovement(
  supabase: SupabaseClient,
  input: NewCashMovement & { created_by: string }
) {
  return supabase.from('cash_movements').insert(input)
}

export function updateCashMovement(
  supabase: SupabaseClient,
  id: string,
  patch: Partial<NewCashMovement>
) {
  return supabase.from('cash_movements').update(patch).eq('id', id)
}

export function deleteCashMovement(supabase: SupabaseClient, id: string) {
  return supabase.from('cash_movements').delete().eq('id', id)
}
