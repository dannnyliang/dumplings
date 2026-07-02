import { describe, it, expect } from 'vitest'
import { computeMonthlySummary, filterTransactions } from '@/lib/report'
import type { Category, Transaction } from '@/types/database'

function makeCategory(overrides: Partial<Category>): Category {
  return {
    id: 'cat-1',
    name: '餐飲',
    emoji: '🍜',
    color: null,
    created_by: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: 't1',
    amount: 100,
    type: 'expense',
    category_id: 'cat-1',
    date: '2026-04-01',
    note: null,
    paid_by: 'shared',
    is_reimbursed: false,
    reimbursed_at: null,
    created_by: 'uid-danny',
    created_at: '2026-04-01T00:00:00Z',
    category: makeCategory({}),
    ...overrides,
  }
}

describe('computeMonthlySummary', () => {
  it('sums expenses and topups separately', () => {
    const summary = computeMonthlySummary([
      makeTransaction({ amount: 300 }),
      makeTransaction({ id: 't2', amount: 200 }),
      makeTransaction({ id: 't3', type: 'topup', amount: 10000, category: undefined, category_id: null }),
    ])
    expect(summary.totalExpense).toBe(500)
    expect(summary.totalTopup).toBe(10000)
  })

  it('aggregates expenses per category into pieData sorted descending', () => {
    const summary = computeMonthlySummary([
      makeTransaction({ amount: 100 }),
      makeTransaction({ id: 't2', amount: 50 }),
      makeTransaction({
        id: 't3',
        amount: 900,
        category_id: 'cat-2',
        category: makeCategory({ id: 'cat-2', name: '交通' }),
      }),
    ])
    expect(summary.pieData).toEqual([
      { name: '交通', value: 900 },
      { name: '餐飲', value: 150 },
    ])
  })

  it('labels uncategorized expenses 未分類', () => {
    const summary = computeMonthlySummary([
      makeTransaction({ category_id: null, category: undefined }),
    ])
    expect(summary.pieData).toEqual([{ name: '未分類', value: 100 }])
  })

  it('excludes topups from pieData', () => {
    const summary = computeMonthlySummary([
      makeTransaction({ type: 'topup', amount: 10000 }),
    ])
    expect(summary.pieData).toEqual([])
  })
})

describe('filterTransactions', () => {
  const transactions = [
    makeTransaction({ id: 't1', note: '午餐便當' }),
    makeTransaction({
      id: 't2',
      note: null,
      category: makeCategory({ name: 'Transport' }),
    }),
  ]

  it('returns everything for a blank query', () => {
    expect(filterTransactions(transactions, '  ')).toHaveLength(2)
  })

  it('matches against the note', () => {
    const result = filterTransactions(transactions, '便當')
    expect(result.map((t) => t.id)).toEqual(['t1'])
  })

  it('matches against the category name case-insensitively', () => {
    const result = filterTransactions(transactions, 'transport')
    expect(result.map((t) => t.id)).toEqual(['t2'])
  })

  it('returns an empty list when nothing matches', () => {
    expect(filterTransactions(transactions, '不存在')).toEqual([])
  })
})
