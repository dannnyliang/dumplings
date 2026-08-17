import { describe, it, expect } from 'vitest'
import { applyLedgerMutation, sortLedger, type LedgerRecord } from '@/lib/transactionsOptimistic'

interface Row extends LedgerRecord {
  amount: number
}

function makeRow(overrides: Partial<Row>): Row {
  return {
    id: 't1',
    amount: 100,
    date: '2026-04-01',
    created_at: '2026-04-01T00:00:00Z',
    ...overrides,
  }
}

describe('sortLedger', () => {
  it('orders by date descending', () => {
    const a = makeRow({ id: 'a', date: '2026-04-01' })
    const b = makeRow({ id: 'b', date: '2026-04-03' })
    const c = makeRow({ id: 'c', date: '2026-04-02' })

    const sorted = sortLedger([a, b, c])

    expect(sorted.map((t) => t.id)).toEqual(['b', 'c', 'a'])
  })

  it('breaks ties on the same date by created_at descending', () => {
    const early = makeRow({ id: 'early', date: '2026-04-01', created_at: '2026-04-01T08:00:00Z' })
    const late = makeRow({ id: 'late', date: '2026-04-01', created_at: '2026-04-01T20:00:00Z' })

    const sorted = sortLedger([early, late])

    expect(sorted.map((t) => t.id)).toEqual(['late', 'early'])
  })

  it('does not mutate the input array', () => {
    const input = [
      makeRow({ id: 'a', date: '2026-04-01' }),
      makeRow({ id: 'b', date: '2026-04-03' }),
    ]
    const snapshot = input.map((t) => t.id)

    sortLedger(input)

    expect(input.map((t) => t.id)).toEqual(snapshot)
  })
})

describe('applyLedgerMutation - create', () => {
  it('inserts the new record in the correct sorted position', () => {
    const existing = [
      makeRow({ id: 'old', date: '2026-04-01' }),
      makeRow({ id: 'newer', date: '2026-04-05' }),
    ]
    const created = makeRow({ id: 'mid', date: '2026-04-03' })

    const result = applyLedgerMutation(existing, { kind: 'create', record: created })

    expect(result.map((t) => t.id)).toEqual(['newer', 'mid', 'old'])
  })

  it('does not mutate the input array', () => {
    const existing = [makeRow({ id: 'old', date: '2026-04-01' })]
    applyLedgerMutation(existing, {
      kind: 'create',
      record: makeRow({ id: 'new', date: '2026-04-02' }),
    })
    expect(existing).toHaveLength(1)
  })
})

describe('applyLedgerMutation - update', () => {
  it('replaces the record with the same id', () => {
    const existing = [
      makeRow({ id: 't1', amount: 100 }),
      makeRow({ id: 't2', amount: 200 }),
    ]
    const patched = makeRow({ id: 't1', amount: 999 })

    const result = applyLedgerMutation(existing, { kind: 'update', record: patched })

    expect(result.find((t) => t.id === 't1')?.amount).toBe(999)
    expect(result.find((t) => t.id === 't2')?.amount).toBe(200)
  })

  it('re-sorts when the edited date changes', () => {
    const existing = [
      makeRow({ id: 'a', date: '2026-04-05' }),
      makeRow({ id: 'b', date: '2026-04-04' }),
    ]
    const moved = makeRow({ id: 'b', date: '2026-04-09' })

    const result = applyLedgerMutation(existing, { kind: 'update', record: moved })

    expect(result.map((t) => t.id)).toEqual(['b', 'a'])
  })
})

describe('applyLedgerMutation - delete', () => {
  it('removes the record with the given id', () => {
    const existing = [makeRow({ id: 't1' }), makeRow({ id: 't2' })]

    const result = applyLedgerMutation(existing, { kind: 'delete', id: 't1' })

    expect(result.map((t) => t.id)).toEqual(['t2'])
  })
})
