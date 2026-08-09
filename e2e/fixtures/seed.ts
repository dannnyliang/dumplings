import { adminClient } from './auth'

/**
 * 以 service_role 直接寫入測試資料，繞過 UI 以縮短煙霧測試的執行時間。
 * 驗證寫入路徑的測試請走 UI，不要用這裡的函式。
 */

export interface SeedTransactionInput {
  amount: number
  type: 'expense' | 'topup'
  /** user UUID | 'shared' | 'credit_card' */
  paidBy: string
  date: string
  note?: string
  isReimbursed?: boolean
  createdBy: string
}

export async function seedTransactions(rows: SeedTransactionInput[]): Promise<void> {
  const admin = adminClient()
  const { error } = await admin.from('transactions').insert(
    rows.map((row) => ({
      amount: row.amount,
      type: row.type,
      paid_by: row.paidBy,
      date: row.date,
      note: row.note ?? null,
      is_reimbursed: row.isReimbursed ?? false,
      created_by: row.createdBy,
      category_id: null,
    }))
  )
  if (error) throw error
}

/** 產生連續日期，最舊的排在最前面。 */
export function sequentialDates(count: number, startIso = '2026-01-01'): string[] {
  const start = new Date(`${startIso}T00:00:00Z`)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + index)
    return date.toISOString().slice(0, 10)
  })
}
