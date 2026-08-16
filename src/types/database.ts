import type { Database } from './supabase'

/**
 * 領域型別，一律自 `src/types/supabase.ts` 衍生。
 *
 * `supabase.ts` 由 `npm run types:generate` 從實際 schema 產生，不得手改；
 * schema 與型別漂移會在 `npm run verify` 的 types:check 階段被擋下。
 *
 * 這裡只做兩件 generated 型別做不到的事：
 * 1. 收窄無 DB enum 約束的欄位（`kind`、`frequency` 等）
 * 2. 補上 join 後才存在的關聯欄位（`category`、`creator`）
 */

type Tables = Database['public']['Tables']

/** 資料庫存為 text，合法值以此為準。 */
export type CashMovementKind = 'topup' | 'card_bill' | 'settlement'

/** 資料庫存為 text，合法值以此為準。 */
export type RecurringFrequency = 'monthly' | 'weekly'

/**
 * 定期模板仍保有 type 欄位：expense 產生消費紀錄、topup 產生入帳現金移動。
 * （transactions 本身已無 type——所有消費紀錄都是支出。）
 */
export type RecurringType = 'expense' | 'topup'

export type Profile = Tables['profiles']['Row']

export type Category = Tables['categories']['Row']

type TransactionRow = Tables['transactions']['Row']

export interface Transaction extends TransactionRow {
  /** join categories 後才有值 */
  category?: Category
  /** join profiles 後才有值 */
  creator?: Profile
}

/**
 * 建立消費紀錄的輸入。
 *
 * Insert 型別把有 default 的欄位標為 optional，但本專案要求呼叫端一律明確
 * 給值，因此用 Required 收回必填；`created_by` 由 repo 層補上，不在此列。
 */
export type NewTransaction = Required<
  Pick<
    Tables['transactions']['Insert'],
    'amount' | 'category_id' | 'date' | 'note' | 'payment_method'
  >
>

export interface CashMovement extends Omit<Tables['cash_movements']['Row'], 'kind'> {
  kind: CashMovementKind
}

/** 建立現金移動的輸入；`created_by` 由 repo 層補上。 */
export type NewCashMovement = Required<
  Pick<Tables['cash_movements']['Insert'], 'amount' | 'date' | 'counterparty' | 'note'>
> & {
  kind: CashMovementKind
}

export interface RecurringTransaction
  extends Omit<Tables['recurring_transactions']['Row'], 'type' | 'frequency'> {
  type: RecurringType
  frequency: RecurringFrequency
  /** join categories 後才有值 */
  category?: Category
}
