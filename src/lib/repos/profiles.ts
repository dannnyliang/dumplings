import type { SupabaseClient } from '@supabase/supabase-js'

/** profiles 資料表的唯一存取點。 */

/** user id → display_name 的對照表（payerLabel 等顯示邏輯使用）。 */
export async function getProfileNameMap(
  supabase: SupabaseClient
): Promise<Record<string, string>> {
  const { data } = await supabase.from('profiles').select('id, display_name')
  return Object.fromEntries((data ?? []).map((p) => [p.id, p.display_name]))
}
