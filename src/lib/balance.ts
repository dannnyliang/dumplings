import { isPaidByJointCard, isPaidFromSharedAccount, isUserAdvance } from '@/lib/paymentMethod'
import type { CashMovement, Transaction } from '@/types/database'

/**
 * 共同帳戶的餘額拆解規則，全專案唯一實作。
 *
 * - 現金餘額：只有現金移動與共同帳戶支付的消費會動到它。
 * - 共同卡未出帳：累計共同卡消費 − 累計帳單扣款（不建模結帳日，見 ADR 0005）。
 * - 待還墊付：推導值＝某人墊付的消費總額 − 已結算給他的總額，不依賴逐筆狀態。
 * - 可動用：現金餘額 − 未出帳 − 待還墊付總額。
 */

export interface BalanceBreakdown {
  /** 共同帳戶餘額（帳上真的有這麼多） */
  cashBalance: number
  /** 共同卡未出帳（已刷、帳單未到） */
  cardUnbilled: number
  /** user UUID → 待還墊付金額（已結清者不出現） */
  advancesByUser: Record<string, number>
  advanceTotal: number
  /** 可動用（現金餘額扣掉兩項應計負債） */
  available: number
}

export function computeBalance(
  transactions: readonly Transaction[],
  cashMovements: readonly CashMovement[]
): BalanceBreakdown {
  let cashBalance = 0
  let cardUnbilled = 0
  const advancesByUser: Record<string, number> = {}

  for (const t of transactions) {
    const amount = Number(t.amount)
    if (isPaidFromSharedAccount(t.payment_method)) {
      cashBalance -= amount
    } else if (isPaidByJointCard(t.payment_method)) {
      cardUnbilled += amount
    } else if (isUserAdvance(t.payment_method)) {
      advancesByUser[t.payment_method] = (advancesByUser[t.payment_method] ?? 0) + amount
    }
  }

  for (const m of cashMovements) {
    const amount = Number(m.amount)
    switch (m.kind) {
      case 'topup':
        cashBalance += amount
        break
      case 'card_bill':
        cashBalance -= amount
        cardUnbilled -= amount
        break
      case 'settlement':
        cashBalance -= amount
        if (m.counterparty) {
          advancesByUser[m.counterparty] = (advancesByUser[m.counterparty] ?? 0) - amount
        }
        break
    }
  }

  for (const [userId, amount] of Object.entries(advancesByUser)) {
    if (amount === 0) delete advancesByUser[userId]
  }

  const advanceTotal = Object.values(advancesByUser).reduce((sum, v) => sum + v, 0)

  return {
    cashBalance,
    cardUnbilled,
    advancesByUser,
    advanceTotal,
    available: cashBalance - cardUnbilled - advanceTotal,
  }
}
