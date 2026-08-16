import { adminClient } from './auth'

/**
 * 以 service_role 直接寫入測試資料，繞過 UI 以縮短煙霧測試的執行時間。
 * 驗證寫入路徑的測試請走 UI，不要用這裡的函式。
 *
 * `seedTransactions` 保留改版前的參數形狀（type / paidBy / isReimbursed），
 * 由本層轉譯成 account-based-ledger 的新 schema，讓 ledger.spec.ts 的既有
 * 斷言不需改動即可持續驗證等值行為：
 * - type 'topup'            → cash_movements 的入帳
 * - type 'expense'          → transactions（paidBy 對照為 payment_method）
 * - isReimbursed 的代墊     → additionally 產生對應的結算／帳單扣款現金移動
 * 新測試請直接用 `seedLedger` 描述新模型的資料。
 */

export interface SeedTransactionInput {
  amount: number
  type: 'expense' | 'topup'
  /** user UUID | 'shared' | 'credit_card'（舊 paid_by 形狀，由本層轉譯） */
  paidBy: string
  date: string
  note?: string
  isReimbursed?: boolean
  createdBy: string
}

function toPaymentMethod(paidBy: string): string {
  return paidBy === 'credit_card' ? 'joint_card' : paidBy
}

export async function seedTransactions(rows: SeedTransactionInput[]): Promise<void> {
  const admin = adminClient()

  const expenses = rows.filter((row) => row.type === 'expense')
  if (expenses.length > 0) {
    const { error } = await admin.from('transactions').insert(
      expenses.map((row) => ({
        amount: row.amount,
        date: row.date,
        note: row.note ?? null,
        payment_method: toPaymentMethod(row.paidBy),
        created_by: row.createdBy,
        category_id: null,
      }))
    )
    if (error) throw error
  }

  const movements = [
    // 舊 topup ＝ 新模型的入帳現金移動
    ...rows
      .filter((row) => row.type === 'topup')
      .map((row) => ({
        amount: row.amount,
        date: row.date,
        kind: 'topup',
        counterparty: null,
        note: row.note ?? null,
        created_by: row.createdBy,
      })),
    // 舊「已還清代墊」＝ 消費之外另有一筆現金流出（結算或帳單扣款）
    ...rows
      .filter((row) => row.type === 'expense' && row.isReimbursed)
      .map((row) => ({
        amount: row.amount,
        date: row.date,
        kind: row.paidBy === 'credit_card' ? 'card_bill' : 'settlement',
        counterparty: row.paidBy === 'credit_card' ? null : row.paidBy,
        note: null,
        created_by: row.createdBy,
      })),
  ]
  if (movements.length > 0) {
    const { error } = await admin.from('cash_movements').insert(movements)
    if (error) throw error
  }
}

export interface SeedExpenseInput {
  amount: number
  /** 'shared' | 'joint_card' | user UUID */
  paymentMethod: string
  date: string
  note?: string
  createdBy: string
}

export interface SeedCashMovementInput {
  amount: number
  kind: 'topup' | 'card_bill' | 'settlement'
  date: string
  counterparty?: string
  note?: string
  createdBy: string
}

/** 直接以新模型的形狀寫入消費紀錄與現金移動。 */
export async function seedLedger(input: {
  expenses?: SeedExpenseInput[]
  movements?: SeedCashMovementInput[]
}): Promise<void> {
  const admin = adminClient()

  if (input.expenses?.length) {
    const { error } = await admin.from('transactions').insert(
      input.expenses.map((row) => ({
        amount: row.amount,
        date: row.date,
        note: row.note ?? null,
        payment_method: row.paymentMethod,
        created_by: row.createdBy,
        category_id: null,
      }))
    )
    if (error) throw error
  }

  if (input.movements?.length) {
    const { error } = await admin.from('cash_movements').insert(
      input.movements.map((row) => ({
        amount: row.amount,
        date: row.date,
        kind: row.kind,
        counterparty: row.counterparty ?? null,
        note: row.note ?? null,
        created_by: row.createdBy,
      }))
    )
    if (error) throw error
  }
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
