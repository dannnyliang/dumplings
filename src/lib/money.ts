import type { TransactionType } from '@/types/database'

/**
 * 金額顯示的唯一出口：NT$ 前綴 + zh-TW 千分位。
 * Supabase numeric 欄位可能以字串回傳，因此接受 number | string。
 */
export function formatMoney(amount: number | string): string {
  return `NT$ ${Number(amount).toLocaleString('zh-TW')}`
}

/** 交易列表用的帶正負號金額：topup 為 +、expense 為 -。 */
export function formatSignedMoney(amount: number | string, type: TransactionType): string {
  const sign = type === 'topup' ? '+' : '-'
  return `${sign}${formatMoney(amount)}`
}
