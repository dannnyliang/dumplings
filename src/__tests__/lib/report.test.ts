import { describe, it, expect } from 'vitest'
import {
  FLAT_DELTA_THRESHOLD,
  compareWithPreviousAverage,
  computeMonthTotals,
  computeMonthlySummary,
  filterTransactions,
} from '@/lib/report'
import type { CashMovement, Category, Transaction } from '@/types/database'

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

function expense(overrides: Partial<Transaction>): Transaction {
  return {
    id: `t-${Math.random().toString(36).slice(2)}`,
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
    id: `m-${Math.random().toString(36).slice(2)}`,
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

describe('computeMonthlySummary', () => {
  it('加總全部消費並依分類彙總，金額由大到小', () => {
    const food = category('c-food', '餐飲')
    const fun = category('c-fun', '娛樂')
    const summary = computeMonthlySummary([
      expense({ amount: 300, category_id: food.id, category: food }),
      expense({ amount: 900, category_id: fun.id, category: fun }),
      expense({ amount: 200, category_id: food.id, category: food }),
    ])
    expect(summary.totalExpense).toBe(1400)
    expect(summary.pieData).toEqual([
      { name: '娛樂', value: 900 },
      { name: '餐飲', value: 500 },
    ])
  })

  it('查無分類時歸入未分類', () => {
    const summary = computeMonthlySummary([expense({ amount: 100 })])
    expect(summary.pieData).toEqual([{ name: '未分類', value: 100 }])
  })

  it('不論付款方式與結算狀態，一律依消費日計入（應計基礎）', () => {
    const summary = computeMonthlySummary([
      expense({ amount: 100, payment_method: 'shared' }),
      expense({ amount: 200, payment_method: 'joint_card' }),
      expense({ amount: 300, payment_method: 'uid-peiyu' }),
    ])
    expect(summary.totalExpense).toBe(600)
  })
})

describe('computeMonthTotals（首頁本月數字）', () => {
  it('只計入指定月份的消費與入帳', () => {
    const totals = computeMonthTotals(
      [
        expense({ amount: 300, date: '2026-04-15' }),
        expense({ amount: 999, date: '2026-03-31' }),
      ],
      [
        movement({ kind: 'topup', amount: 5000, date: '2026-04-01' }),
        movement({ kind: 'topup', amount: 7777, date: '2026-05-01' }),
        movement({ kind: 'card_bill', amount: 1234, date: '2026-04-10' }),
      ],
      '2026-04'
    )
    expect(totals).toEqual({ expenseTotal: 300, topupTotal: 5000 })
  })
})

describe('compareWithPreviousAverage（與前期平均比較）', () => {
  const food = category('c-food', '餐飲')
  const fun = category('c-fun', '娛樂')

  it('差異為本月金額減前三月平均', () => {
    const current = [expense({ amount: 12400, category_id: food.id, category: food })]
    const previous = [
      [expense({ amount: 9000, category_id: food.id, category: food })],
      [expense({ amount: 9200, category_id: food.id, category: food })],
      [expense({ amount: 9400, category_id: food.id, category: food })],
    ]
    const [row] = compareWithPreviousAverage(current, previous)
    expect(row.amount).toBe(12400)
    expect(row.baseline).toBe(9200)
    expect(row.delta).toBe(3200)
    expect(row.baselineMonths).toBe(3)
  })

  it('差異在門檻內視為持平', () => {
    const current = [expense({ amount: 2100, category_id: food.id, category: food })]
    const previous = [[expense({ amount: 2100 + FLAT_DELTA_THRESHOLD, category_id: food.id, category: food })]]
    const [row] = compareWithPreviousAverage(current, previous)
    expect(row.isFlat).toBe(true)
  })

  it('歷史不足三個月時，以既有月份平均為基準並回報月份數', () => {
    const current = [expense({ amount: 3000, category_id: food.id, category: food })]
    const previous = [
      [expense({ amount: 1000, category_id: food.id, category: food })],
      [], // 沒有任何紀錄的月份不列入基準
    ]
    const [row] = compareWithPreviousAverage(current, previous)
    expect(row.baseline).toBe(1000)
    expect(row.baselineMonths).toBe(1)
  })

  it('前期有、本月沒有的分類也會出現在比較中', () => {
    const current = [expense({ amount: 500, category_id: food.id, category: food })]
    const previous = [[expense({ amount: 2000, category_id: fun.id, category: fun })]]
    const rows = compareWithPreviousAverage(current, previous)
    const funRow = rows.find((r) => r.name === '娛樂')
    expect(funRow?.amount).toBe(0)
    expect(funRow?.delta).toBe(-2000)
  })

  it('依本月金額由大到小排序', () => {
    const current = [
      expense({ amount: 100, category_id: food.id, category: food }),
      expense({ amount: 900, category_id: fun.id, category: fun }),
    ]
    const rows = compareWithPreviousAverage(current, [])
    expect(rows.map((r) => r.name)).toEqual(['娛樂', '餐飲'])
  })
})

describe('filterTransactions', () => {
  it('以備註或分類名稱不分大小寫搜尋', () => {
    const food = category('c-food', '餐飲')
    const rows = [
      expense({ note: 'Lunch with client', category_id: food.id, category: food }),
      expense({ note: null }),
    ]
    expect(filterTransactions(rows, 'lunch')).toHaveLength(1)
    expect(filterTransactions(rows, '餐')).toHaveLength(1)
    expect(filterTransactions(rows, '')).toHaveLength(2)
  })
})
