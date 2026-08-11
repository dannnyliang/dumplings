import type { Database } from './supabase'

/**
 * 領域型別，一律自 `src/types/supabase.ts` 衍生。
 *
 * `supabase.ts` 由 `npm run types:generate` 從實際 schema 產生，不得手改；
 * schema 與型別漂移會在 `npm run verify` 的 types:check 階段被擋下。
 *
 * 這裡只做兩件 generated 型別做不到的事：
 * 1. 收窄無 DB enum 約束的欄位（`type`、`frequency`）
 * 2. 補上 join 後才存在的關聯欄位（`category`、`creator`）
 */

type Tables = Database['public']['Tables']

/** 資料庫存為 text，合法值以此為準。 */
export type TransactionType = 'expense' | 'topup'

/** 資料庫存為 text，合法值以此為準。 */
export type RecurringFrequency = 'monthly' | 'weekly'

export type Profile = Tables['profiles']['Row']

export type Category = Tables['categories']['Row']

export interface Transaction extends Omit<Tables['transactions']['Row'], 'type'> {
  type: TransactionType
  /** join categories 後才有值 */
  category?: Category
  /** join profiles 後才有值 */
  creator?: Profile
}

/**
 * 建立交易的輸入。
 *
 * Insert 型別把有 default 的欄位標為 optional，但本專案要求呼叫端一律明確
 * 給值，因此用 Required 收回必填；`created_by` 由 repo 層補上，不在此列。
 */
export type NewTransaction = Required<
  Pick<Tables['transactions']['Insert'], 'amount' | 'category_id' | 'date' | 'note' | 'paid_by'>
> & {
  type: TransactionType
}

export interface RecurringTransaction
  extends Omit<Tables['recurring_transactions']['Row'], 'type' | 'frequency'> {
  type: TransactionType
  frequency: RecurringFrequency
  /** join categories 後才有值 */
  category?: Category
}
