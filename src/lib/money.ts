/**
 * 金額顯示的唯一出口：NT$ 前綴 + zh-TW 千分位。
 * Supabase numeric 欄位可能以字串回傳，因此接受 number | string。
 */

/** 對共同帳戶而言的資金方向。 */
export type MoneyFlow = 'in' | 'out'

export function formatMoney(amount: number | string): string {
  return `NT$ ${Number(amount).toLocaleString('zh-TW')}`
}

/** 列表用的帶正負號金額：流入為 +、流出為 -。 */
export function formatSignedMoney(amount: number | string, flow: MoneyFlow): string {
  const sign = flow === 'in' ? '+' : '-'
  return `${sign}${formatMoney(amount)}`
}
