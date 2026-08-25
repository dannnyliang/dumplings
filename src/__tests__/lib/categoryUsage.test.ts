import { describe, it, expect } from 'vitest'
import { sortCategoriesByUsage } from '@/lib/categoryUsage'
import type { Category, Transaction } from '@/types/database'

function category(id: string, name: string): Category {
  return {
    id,
    name,
    emoji: null,
    color: null,
    created_by: null,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
  }
}

function expense(categoryId: string | null): Transaction {
  return {
    id: `t-${Math.random().toString(36).slice(2)}`,
    amount: 100,
    category_id: categoryId,
    date: '2026-08-01',
    note: null,
    payment_method: 'shared',
    created_by: 'uid-danny',
    created_at: '2026-08-01T00:00:00Z',
  }
}

const FOOD = category('c-food', '餐飲')
const TRANSPORT = category('c-transport', '交通')
const FUN = category('c-fun', '娛樂')

describe('sortCategoriesByUsage', () => {
  it('筆數多的分類排在前面', () => {
    const categories = [FOOD, TRANSPORT, FUN]
    const transactions = [
      expense('c-transport'),
      expense('c-transport'),
      expense('c-transport'),
      expense('c-fun'),
      expense('c-fun'),
      expense('c-food'),
    ]

    const sorted = sortCategoriesByUsage(categories, transactions)

    expect(sorted.map((c) => c.id)).toEqual(['c-transport', 'c-fun', 'c-food'])
  })

  it('筆數相同時維持傳入順序', () => {
    const categories = [FOOD, TRANSPORT, FUN]
    const transactions = [expense('c-fun'), expense('c-food'), expense('c-transport')]

    const sorted = sortCategoriesByUsage(categories, transactions)

    expect(sorted.map((c) => c.id)).toEqual(['c-food', 'c-transport', 'c-fun'])
  })

  it('沒有任何紀錄的分類排在最後', () => {
    const categories = [FOOD, TRANSPORT, FUN]
    const transactions = [expense('c-fun')]

    const sorted = sortCategoriesByUsage(categories, transactions)

    expect(sorted.map((c) => c.id)).toEqual(['c-fun', 'c-food', 'c-transport'])
  })

  it('未分類的紀錄不影響排序', () => {
    const categories = [FOOD, TRANSPORT]
    const transactions = [expense(null), expense(null), expense('c-transport')]

    const sorted = sortCategoriesByUsage(categories, transactions)

    expect(sorted.map((c) => c.id)).toEqual(['c-transport', 'c-food'])
  })

  it('指向已不存在分類的紀錄不會憑空生出選項', () => {
    const categories = [FOOD]
    const transactions = [expense('c-deleted'), expense('c-deleted'), expense('c-food')]

    const sorted = sortCategoriesByUsage(categories, transactions)

    expect(sorted.map((c) => c.id)).toEqual(['c-food'])
  })

  it('不修改傳入的陣列', () => {
    const categories = [FOOD, TRANSPORT]
    const transactions = [expense('c-transport')]

    sortCategoriesByUsage(categories, transactions)

    expect(categories.map((c) => c.id)).toEqual(['c-food', 'c-transport'])
  })

  it('沒有任何紀錄時維持原順序', () => {
    const categories = [FOOD, TRANSPORT, FUN]

    const sorted = sortCategoriesByUsage(categories, [])

    expect(sorted.map((c) => c.id)).toEqual(['c-food', 'c-transport', 'c-fun'])
  })
})
