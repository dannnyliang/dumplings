import { describe, it, expect } from 'vitest'
import { computeBalance } from '@/lib/balance'
import type { CashMovement, Transaction } from '@/types/database'

function expense(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 100,
    category_id: null,
    date: '2026-04-01',
    note: null,
    payment_method: 'shared',
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

function movement(overrides: Partial<CashMovement>): CashMovement {
  return {
    id: 'm1',
    amount: 100,
    date: '2026-04-01',
    kind: 'topup',
    counterparty: null,
    note: null,
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeBalance：共同帳戶餘額（現金）', () => {
  it('入帳增加餘額，共同帳戶支出立即扣款', () => {
    const { cashBalance } = computeBalance(
      [expense({ amount: 3000, payment_method: 'shared' })],
      [movement({ kind: 'topup', amount: 10000 })]
    )
    expect(cashBalance).toBe(7000)
  })

  it('共同卡與墊付的消費不影響現金餘額', () => {
    const { cashBalance } = computeBalance(
      [
        expense({ amount: 2500, payment_method: 'uid-peiyu' }),
        expense({ amount: 1200, payment_method: 'joint_card' }),
      ],
      [movement({ kind: 'topup', amount: 10000 })]
    )
    expect(cashBalance).toBe(10000)
  })

  it('帳單扣款與結算於其日期自現金餘額扣除', () => {
    const { cashBalance } = computeBalance(
      [],
      [
        movement({ kind: 'topup', amount: 10000 }),
        movement({ kind: 'card_bill', amount: 3000 }),
        movement({ kind: 'settlement', amount: 2000, counterparty: 'uid-peiyu' }),
      ]
    )
    expect(cashBalance).toBe(5000)
  })
})

describe('computeBalance：共同卡未出帳', () => {
  it('等於累計共同卡消費減累計帳單扣款', () => {
    const { cardUnbilled } = computeBalance(
      [
        expense({ amount: 1200, payment_method: 'joint_card' }),
        expense({ amount: 800, payment_method: 'joint_card' }),
        expense({ amount: 999, payment_method: 'shared' }),
      ],
      [movement({ kind: 'card_bill', amount: 500 })]
    )
    expect(cardUnbilled).toBe(1500)
  })

  it('帳單全數扣款後為 0', () => {
    const { cardUnbilled } = computeBalance(
      [expense({ amount: 1000, payment_method: 'joint_card' })],
      [movement({ kind: 'card_bill', amount: 1000 })]
    )
    expect(cardUnbilled).toBe(0)
  })
})

describe('computeBalance：待還墊付（推導值）', () => {
  it('等於某人墊付總額減去已結算給他的總額', () => {
    const { advancesByUser } = computeBalance(
      [
        expense({ amount: 20000, payment_method: 'uid-danny' }),
        expense({ amount: 5000, payment_method: 'uid-peiyu' }),
      ],
      [movement({ kind: 'settlement', amount: 15000, counterparty: 'uid-danny' })]
    )
    expect(advancesByUser).toEqual({ 'uid-danny': 5000, 'uid-peiyu': 5000 })
  })

  it('部分結算後差額保留於待還墊付', () => {
    const { advancesByUser } = computeBalance(
      [expense({ amount: 20000, payment_method: 'uid-danny' })],
      [movement({ kind: 'settlement', amount: 15000, counterparty: 'uid-danny' })]
    )
    expect(advancesByUser['uid-danny']).toBe(5000)
  })

  it('結清後該使用者自待還墊付中消失', () => {
    const { advancesByUser } = computeBalance(
      [expense({ amount: 3000, payment_method: 'uid-peiyu' })],
      [movement({ kind: 'settlement', amount: 3000, counterparty: 'uid-peiyu' })]
    )
    expect(advancesByUser).toEqual({})
  })
})

describe('computeBalance：可動用', () => {
  it('等於現金餘額減未出帳與待還墊付總額', () => {
    const result = computeBalance(
      [
        expense({ amount: 12000, payment_method: 'joint_card' }),
        expense({ amount: 15000, payment_method: 'uid-danny' }),
        expense({ amount: 5000, payment_method: 'uid-peiyu' }),
      ],
      [movement({ kind: 'topup', amount: 50000 })]
    )
    expect(result.cashBalance).toBe(50000)
    expect(result.advanceTotal).toBe(20000)
    expect(result.available).toBe(18000)
  })

  it('無未出帳亦無待還墊付時，可動用等於現金餘額', () => {
    const result = computeBalance(
      [expense({ amount: 3000, payment_method: 'shared' })],
      [movement({ kind: 'topup', amount: 10000 })]
    )
    expect(result.cardUnbilled).toBe(0)
    expect(result.advanceTotal).toBe(0)
    expect(result.available).toBe(result.cashBalance)
  })
})

describe('computeBalance：邊界', () => {
  it('容忍資料庫以字串回傳的金額', () => {
    const { cashBalance } = computeBalance(
      [],
      [movement({ kind: 'topup', amount: '1000' as unknown as number })]
    )
    expect(cashBalance).toBe(1000)
  })

  it('空資料回傳全零', () => {
    expect(computeBalance([], [])).toEqual({
      cashBalance: 0,
      cardUnbilled: 0,
      advancesByUser: {},
      advanceTotal: 0,
      available: 0,
    })
  })

  it('結算對象已不存在（counterparty 為 null）時仍扣現金，不影響任何人的待還', () => {
    const result = computeBalance(
      [],
      [
        movement({ kind: 'topup', amount: 10000 }),
        movement({ kind: 'settlement', amount: 2000, counterparty: null }),
      ]
    )
    expect(result.cashBalance).toBe(8000)
    expect(result.advancesByUser).toEqual({})
  })
})
