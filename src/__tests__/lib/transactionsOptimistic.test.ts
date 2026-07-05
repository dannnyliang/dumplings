import { describe, it, expect } from 'vitest'
import {
  applyTransactionMutation,
  sortTransactions,
} from '@/lib/transactionsOptimistic'
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

describe('sortTransactions', () => {
  it('orders by date descending', () => {
    const a = makeTransaction({ id: 'a', date: '2026-04-01' })
    const b = makeTransaction({ id: 'b', date: '2026-04-03' })
    const c = makeTransaction({ id: 'c', date: '2026-04-02' })

    const sorted = sortTransactions([a, b, c])

    expect(sorted.map((t) => t.id)).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties on the same date by created_at descending', () => {
    const early = makeTransaction({ id: 'early', date: '2026-04-01', created_at: '2026-04-01T08:00:00Z' })
    const late = makeTransaction({ id: 'late', date: '2026-04-01', created_at: '2026-04-01T20:00:00Z' })

    const sorted = sortTransactions([early, late])

    expect(sorted.map((t) => t.id)).toEqual(['late', 'early'])
  })

  it('does not mutate the input array', () => {
    const input = [
      makeTransaction({ id: 'a', date: '2026-04-01' }),
      makeTransaction({ id: 'b', date: '2026-04-03' }),
    ]
    const snapshot = input.map((t) => t.id)

    sortTransactions(input)

    expect(input.map((t) => t.id)).toEqual(snapshot)
  })
})

describe('applyTransactionMutation - create', () => {
  it('inserts the new transaction in the correct sorted position', () => {
    const existing = [
      makeTransaction({ id: 'old', date: '2026-04-01' }),
      makeTransaction({ id: 'newer', date: '2026-04-05' }),
    ]
    const created = makeTransaction({ id: 'mid', date: '2026-04-03' })

    const result = applyTransactionMutation(existing, { kind: 'create', transaction: created })

    expect(result.map((t) => t.id)).toEqual(['newer', 'mid', 'old'])
  })

  it('does not mutate the input array', () => {
    const existing = [makeTransaction({ id: 'old', date: '2026-04-01' })]
    applyTransactionMutation(existing, {
      kind: 'create',
      transaction: makeTransaction({ id: 'new', date: '2026-04-02' }),
    })
    expect(existing).toHaveLength(1)
  })
})

describe('applyTransactionMutation - update', () => {
  it('replaces the transaction with the same id', () => {
    const existing = [
      makeTransaction({ id: 't1', amount: 100 }),
      makeTransaction({ id: 't2', amount: 200 }),
    ]
    const patched = makeTransaction({ id: 't1', amount: 999 })

    const result = applyTransactionMutation(existing, { kind: 'update', transaction: patched })

    expect(result.find((t) => t.id === 't1')?.amount).toBe(999)
    expect(result.find((t) => t.id === 't2')?.amount).toBe(200)
  })

  it('re-sorts when the edited date changes', () => {
    const existing = [
      makeTransaction({ id: 'a', date: '2026-04-05' }),
      makeTransaction({ id: 'b', date: '2026-04-04' }),
    ]
    const moved = makeTransaction({ id: 'b', date: '2026-04-09' })

    const result = applyTransactionMutation(existing, { kind: 'update', transaction: moved })

    expect(result.map((t) => t.id)).toEqual(['b', 'a'])
  })
})

describe('applyTransactionMutation - delete', () => {
  it('removes the transaction with the given id', () => {
    const existing = [
      makeTransaction({ id: 't1' }),
      makeTransaction({ id: 't2' }),
    ]

    const result = applyTransactionMutation(existing, { kind: 'delete', id: 't1' })

    expect(result.map((t) => t.id)).toEqual(['t2'])
  })
})

describe('applyTransactionMutation - reimburse', () => {
  it('marks the advance as reimbursed and stamps reimbursed_at', () => {
    const existing = [makeTransaction({ id: 't1', paid_by: 'uid-danny', is_reimbursed: false, reimbursed_at: null })]

    const result = applyTransactionMutation(existing, { kind: 'reimburse', id: 't1', isReimbursed: true })

    const updated = result.find((t) => t.id === 't1')
    expect(updated?.is_reimbursed).toBe(true)
    expect(updated?.reimbursed_at).not.toBeNull()
  })

  it('reverts the reimbursed state and clears reimbursed_at', () => {
    const existing = [
      makeTransaction({ id: 't1', paid_by: 'uid-danny', is_reimbursed: true, reimbursed_at: '2026-04-02T00:00:00Z' }),
    ]

    const result = applyTransactionMutation(existing, { kind: 'reimburse', id: 't1', isReimbursed: false })

    const updated = result.find((t) => t.id === 't1')
    expect(updated?.is_reimbursed).toBe(false)
    expect(updated?.reimbursed_at).toBeNull()
  })

  it('leaves other transactions untouched', () => {
    const existing = [
      makeTransaction({ id: 't1', paid_by: 'uid-danny' }),
      makeTransaction({ id: 't2', paid_by: 'uid-danny' }),
    ]

    const result = applyTransactionMutation(existing, { kind: 'reimburse', id: 't1', isReimbursed: true })

    expect(result.find((t) => t.id === 't2')?.is_reimbursed).toBe(false)
  })
})
