export const PAID_BY_SHARED = 'shared' as const
export const PAID_BY_CREDIT_CARD = 'credit_card' as const

export function isPaidByShared(paidBy: string): boolean {
  return paidBy === PAID_BY_SHARED
}

export function isPaidByCreditCard(paidBy: string): boolean {
  return paidBy === PAID_BY_CREDIT_CARD
}

export function isPaidByUser(paidBy: string): boolean {
  return paidBy !== PAID_BY_SHARED && paidBy !== PAID_BY_CREDIT_CARD
}
