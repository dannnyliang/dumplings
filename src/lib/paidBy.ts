import type { TransactionType } from '@/types/database'

/**
 * `paid_by` 三值契約（user UUID | 'shared' | 'credit_card'）的唯一解讀點。
 * 元件不得直接比對 'shared' / 'credit_card' 字面值，一律經過這裡。
 */

export const PAID_BY_SHARED = 'shared' as const
export const PAID_BY_CREDIT_CARD = 'credit_card' as const

/** 表單層的付款方式選項（'self' 會在儲存時展開成使用者 UUID）。 */
export type PayerFormKind = 'shared' | 'self' | 'credit_card'

export const PAYER_FORM_LABELS: Record<PayerFormKind, string> = {
  shared: '共同帳戶',
  self: '我先墊付',
  credit_card: '信用卡',
}

export function isPaidByShared(paidBy: string): boolean {
  return paidBy === PAID_BY_SHARED
}

export function isPaidByCreditCard(paidBy: string): boolean {
  return paidBy === PAID_BY_CREDIT_CARD
}

export function isPaidByUser(paidBy: string): boolean {
  return paidBy !== PAID_BY_SHARED && paidBy !== PAID_BY_CREDIT_CARD
}

/** 表單選項 → 儲存值。 */
export function paidByFromForm(kind: PayerFormKind, userId: string): string {
  if (kind === 'self') return userId
  if (kind === 'credit_card') return PAID_BY_CREDIT_CARD
  return PAID_BY_SHARED
}

/** 表單選項 → 儲存值，並套用「topup 一律記在共同帳戶」的規則。 */
export function paidByForTransaction(
  type: TransactionType,
  kind: PayerFormKind,
  userId: string
): string {
  return type === 'expense' ? paidByFromForm(kind, userId) : PAID_BY_SHARED
}

/** 儲存值 → 表單選項（paidByFromForm 的反向）。 */
export function formKindFromPaidBy(paidBy: string): PayerFormKind {
  if (isPaidByShared(paidBy)) return 'shared'
  if (isPaidByCreditCard(paidBy)) return 'credit_card'
  return 'self'
}

/** 付款人顯示名稱：信用卡 / 共同帳戶 / 使用者名稱（查無則「某人」）。 */
export function payerLabel(paidBy: string, profiles: Record<string, string>): string {
  if (isPaidByCreditCard(paidBy)) return '信用卡'
  if (isPaidByShared(paidBy)) return '共同帳戶'
  return profiles[paidBy] ?? '某人'
}
