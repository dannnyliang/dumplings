import type { Transaction } from '@/types/database'

/** 月報表的衍生資料：支出/入帳總額與分類圓餅圖資料。 */

export interface PieDatum {
  name: string
  value: number
}

export interface MonthlySummary {
  totalExpense: number
  totalTopup: number
  /** 依分類彙總的支出，金額由大到小 */
  pieData: PieDatum[]
}

export function computeMonthlySummary(transactions: Transaction[]): MonthlySummary {
  const expenses = transactions.filter((t) => t.type === 'expense')
  const topups = transactions.filter((t) => t.type === 'topup')

  const totalExpense = expenses.reduce((sum, t) => sum + Number(t.amount), 0)
  const totalTopup = topups.reduce((sum, t) => sum + Number(t.amount), 0)

  const categoryMap = expenses.reduce<Record<string, PieDatum>>((acc, t) => {
    const key = t.category_id ?? 'uncategorized'
    const name = t.category?.name ?? '未分類'
    return {
      ...acc,
      [key]: { name, value: (acc[key]?.value ?? 0) + Number(t.amount) },
    }
  }, {})
  const pieData = Object.values(categoryMap).sort((a, b) => b.value - a.value)

  return { totalExpense, totalTopup, pieData }
}

/** 以備註或分類名稱做不分大小寫的搜尋；空白查詢回傳全部。 */
export function filterTransactions(transactions: Transaction[], query: string): Transaction[] {
  if (!query.trim()) return transactions
  const q = query.toLowerCase()
  return transactions.filter(
    (t) => t.note?.toLowerCase().includes(q) || t.category?.name?.toLowerCase().includes(q)
  )
}
