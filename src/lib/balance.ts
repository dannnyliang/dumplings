import { isPaidByShared } from '@/lib/paidBy'
import type { Transaction } from '@/types/database'

/**
 * 共同帳戶的結餘與代墊規則，全專案唯一實作。
 *
 * - 代墊（advance）：非共同帳戶支付的支出，不論是否已還清。
 * - 未清償代墊（outstanding advance）：尚未還清的代墊，不計入共同支出。
 * - 共同支出：共同帳戶直接支付，或已還清的代墊（還清後視同共同帳戶買單）。
 */

export interface Balance {
  topupTotal: number
  sharedExpenseTotal: number
  balance: number
  /** payer（user UUID 或 'credit_card'）→ 未清償代墊總額 */
  advancesByPayer: Record<string, number>
}

/** 這筆是否為代墊（含已還清的）。 */
export function isAdvance(t: Transaction): boolean {
  return t.type === 'expense' && !isPaidByShared(t.paid_by)
}

/** 這筆是否為未清償代墊。 */
export function isOutstandingAdvance(t: Transaction): boolean {
  return isAdvance(t) && !t.is_reimbursed
}

/** 這筆是否計入共同支出（共同帳戶支付，或已還清的代墊）。 */
export function isSharedSpending(t: Transaction): boolean {
  return t.type === 'expense' && (isPaidByShared(t.paid_by) || t.is_reimbursed)
}

export function computeBalance(transactions: Transaction[]): Balance {
  const topupTotal = transactions
    .filter((t) => t.type === 'topup')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const sharedExpenseTotal = transactions
    .filter(isSharedSpending)
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const advancesByPayer = transactions
    .filter(isOutstandingAdvance)
    .reduce<Record<string, number>>(
      (acc, t) => ({ ...acc, [t.paid_by]: (acc[t.paid_by] ?? 0) + Number(t.amount) }),
      {}
    )

  return {
    topupTotal,
    sharedExpenseTotal,
    balance: topupTotal - sharedExpenseTotal,
    advancesByPayer,
  }
}
