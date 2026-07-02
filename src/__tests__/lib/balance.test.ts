import { describe, it, expect } from 'vitest'
import { computeBalance, isAdvance, isOutstandingAdvance } from '@/lib/balance'
import type { Transaction } from '@/types/database'

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 100,
    type: 'expense',
    category_id: null,
    date: '2026-04-01',
    note: null,
    paid_by: 'shared',
    is_reimbursed: false,
    reimbursed_at: null,
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

describe('isAdvance', () => {
  it('is true for a non-shared expense', () => {
    expect(isAdvance(makeTransaction({ paid_by: 'uid-danny' }))).toBe(true)
  })

  it('is true for a credit-card expense', () => {
    expect(isAdvance(makeTransaction({ paid_by: 'credit_card' }))).toBe(true)
  })

  it('is false for a shared expense', () => {
    expect(isAdvance(makeTransaction({ paid_by: 'shared' }))).toBe(false)
  })

  it('is false for a topup regardless of payer', () => {
    expect(isAdvance(makeTransaction({ type: 'topup', paid_by: 'uid-danny' }))).toBe(false)
  })

  it('stays true after the advance is reimbursed', () => {
    expect(isAdvance(makeTransaction({ paid_by: 'uid-danny', is_reimbursed: true }))).toBe(true)
  })
})

describe('isOutstandingAdvance', () => {
  it('is true for an unreimbursed non-shared expense', () => {
    expect(isOutstandingAdvance(makeTransaction({ paid_by: 'uid-danny' }))).toBe(true)
  })

  it('is false once the advance is reimbursed', () => {
    expect(isOutstandingAdvance(makeTransaction({ paid_by: 'uid-danny', is_reimbursed: true }))).toBe(false)
  })

  it('is false for shared expenses', () => {
    expect(isOutstandingAdvance(makeTransaction({ paid_by: 'shared' }))).toBe(false)
  })
})

describe('computeBalance', () => {
  it('sums topups into topupTotal', () => {
    const result = computeBalance([
      makeTransaction({ type: 'topup', amount: 10000 }),
      makeTransaction({ type: 'topup', amount: 5000 }),
    ])
    expect(result.topupTotal).toBe(15000)
  })

  it('counts shared expenses and reimbursed advances as shared spending', () => {
    const result = computeBalance([
      makeTransaction({ amount: 300, paid_by: 'shared' }),
      makeTransaction({ amount: 200, paid_by: 'uid-danny', is_reimbursed: true }),
    ])
    expect(result.sharedExpenseTotal).toBe(500)
  })

  it('excludes outstanding advances from shared spending', () => {
    const result = computeBalance([
      makeTransaction({ amount: 300, paid_by: 'shared' }),
      makeTransaction({ amount: 999, paid_by: 'uid-danny', is_reimbursed: false }),
    ])
    expect(result.sharedExpenseTotal).toBe(300)
  })

  it('computes balance as topups minus shared spending', () => {
    const result = computeBalance([
      makeTransaction({ type: 'topup', amount: 1000 }),
      makeTransaction({ amount: 300, paid_by: 'shared' }),
    ])
    expect(result.balance).toBe(700)
  })

  it('groups outstanding advances by payer', () => {
    const result = computeBalance([
      makeTransaction({ amount: 100, paid_by: 'uid-danny' }),
      makeTransaction({ amount: 50, paid_by: 'uid-danny' }),
      makeTransaction({ amount: 200, paid_by: 'credit_card' }),
    ])
    expect(result.advancesByPayer).toEqual({ 'uid-danny': 150, credit_card: 200 })
  })

  it('omits reimbursed advances from advancesByPayer', () => {
    const result = computeBalance([
      makeTransaction({ amount: 100, paid_by: 'uid-danny', is_reimbursed: true }),
    ])
    expect(result.advancesByPayer).toEqual({})
  })

  it('coerces string amounts from the database', () => {
    const result = computeBalance([
      makeTransaction({ type: 'topup', amount: '1000' as unknown as number }),
    ])
    expect(result.topupTotal).toBe(1000)
  })

  it('returns zeros for an empty list', () => {
    expect(computeBalance([])).toEqual({
      topupTotal: 0,
      sharedExpenseTotal: 0,
      balance: 0,
      advancesByPayer: {},
    })
  })
})
