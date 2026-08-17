import { describe, it, expect } from 'vitest'
import { cashMovementDirection, cashMovementLabel } from '@/lib/cashMovement'
import type { CashMovement } from '@/types/database'

const PROFILES = { 'uid-danny': 'Danny', 'uid-peiyu': 'PeiYu' }

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

describe('cashMovementLabel', () => {
  it('入帳與帳單扣款有固定名稱', () => {
    expect(cashMovementLabel(movement({ kind: 'topup' }), PROFILES)).toBe('入帳')
    expect(cashMovementLabel(movement({ kind: 'card_bill' }), PROFILES)).toBe('共同卡帳單扣款')
  })

  it('結算顯示對象名稱', () => {
    expect(
      cashMovementLabel(movement({ kind: 'settlement', counterparty: 'uid-peiyu' }), PROFILES)
    ).toBe('結算給 PeiYu')
  })

  it('結算對象查無時顯示某人', () => {
    expect(cashMovementLabel(movement({ kind: 'settlement', counterparty: null }), PROFILES)).toBe(
      '結算給 某人'
    )
  })
})

describe('cashMovementDirection', () => {
  it('入帳是流入，扣款與結算是流出', () => {
    expect(cashMovementDirection('topup')).toBe('in')
    expect(cashMovementDirection('card_bill')).toBe('out')
    expect(cashMovementDirection('settlement')).toBe('out')
  })
})
