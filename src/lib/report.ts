import { monthOf } from '@/lib/month'
import type { CashMovement, Transaction } from '@/types/database'

/**
 * 月報表與月彙總的衍生資料。
 *
 * 報表一律以消費日歸屬月份（應計基礎）；付款方式與結算時點不影響歸屬。
 * 現金流出時點屬於餘額拆解的範疇（src/lib/balance.ts）。
 */

const UNCATEGORIZED_KEY = 'uncategorized'
const UNCATEGORIZED_NAME = '未分類'

export interface PieDatum {
  name: string
  value: number
}

export interface MonthlySummary {
  totalExpense: number
  /** 依分類彙總的支出，金額由大到小 */
  pieData: PieDatum[]
}

interface CategoryTotals {
  names: Map<string, string>
  totals: Map<string, number>
}

function sumByCategory(transactions: readonly Transaction[]): CategoryTotals {
  const names = new Map<string, string>()
  const totals = new Map<string, number>()
  for (const t of transactions) {
    const key = t.category_id ?? UNCATEGORIZED_KEY
    names.set(key, t.category?.name ?? UNCATEGORIZED_NAME)
    totals.set(key, (totals.get(key) ?? 0) + Number(t.amount))
  }
  return { names, totals }
}

export function computeMonthlySummary(transactions: readonly Transaction[]): MonthlySummary {
  const totalExpense = transactions.reduce((sum, t) => sum + Number(t.amount), 0)

  const { names, totals } = sumByCategory(transactions)
  const pieData = [...totals.entries()]
    .map(([key, value]) => ({ name: names.get(key) ?? UNCATEGORIZED_NAME, value }))
    .sort((a, b) => b.value - a.value)

  return { totalExpense, pieData }
}

export interface MonthTotals {
  /** 該月消費總額（應計） */
  expenseTotal: number
  /** 該月入帳總額 */
  topupTotal: number
}

/** 首頁「本月支出」「本月入帳」的資料來源，範圍與標籤一致。 */
export function computeMonthTotals(
  transactions: readonly Transaction[],
  cashMovements: readonly CashMovement[],
  month: string
): MonthTotals {
  const expenseTotal = transactions
    .filter((t) => monthOf(t.date) === month)
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const topupTotal = cashMovements
    .filter((m) => m.kind === 'topup' && monthOf(m.date) === month)
    .reduce((sum, m) => sum + Number(m.amount), 0)
  return { expenseTotal, topupTotal }
}

/** 差異小於此金額視為持平。 */
export const FLAT_DELTA_THRESHOLD = 500

export interface CategoryComparison {
  name: string
  /** 本月金額 */
  amount: number
  /** 前期平均 */
  baseline: number
  /** amount − baseline */
  delta: number
  isFlat: boolean
  /** 比較基準涵蓋的月份數（不足三個月時 UI 需標示） */
  baselineMonths: number
}

/**
 * 分類支出與前期平均的比較（取代佔比）。
 * previousByMonth 為前幾個月的消費紀錄（每月一組）；沒有任何紀錄的月份不列入基準。
 */
export function compareWithPreviousAverage(
  current: readonly Transaction[],
  previousByMonth: readonly (readonly Transaction[])[]
): CategoryComparison[] {
  const currentTotals = sumByCategory(current)
  const baselineMonthsData = previousByMonth.filter((m) => m.length > 0)
  const baselineMonths = baselineMonthsData.length

  const names = new Map(currentTotals.names)
  const baselineSums = new Map<string, number>()
  for (const monthTransactions of baselineMonthsData) {
    const monthTotals = sumByCategory(monthTransactions)
    for (const [key, value] of monthTotals.totals) {
      baselineSums.set(key, (baselineSums.get(key) ?? 0) + value)
      if (!names.has(key)) names.set(key, monthTotals.names.get(key) ?? UNCATEGORIZED_NAME)
    }
  }

  return [...names.keys()]
    .map((key) => {
      const amount = currentTotals.totals.get(key) ?? 0
      const baseline = baselineMonths > 0 ? (baselineSums.get(key) ?? 0) / baselineMonths : 0
      const delta = amount - baseline
      return {
        name: names.get(key) ?? UNCATEGORIZED_NAME,
        amount,
        baseline,
        delta,
        isFlat: Math.abs(delta) <= FLAT_DELTA_THRESHOLD,
        baselineMonths,
      }
    })
    .sort((a, b) => b.amount - a.amount)
}

/** 以備註或分類名稱做不分大小寫的搜尋；空白查詢回傳全部。 */
export function filterTransactions(
  transactions: readonly Transaction[],
  query: string
): Transaction[] {
  if (!query.trim()) return [...transactions]
  const q = query.toLowerCase()
  return transactions.filter(
    (t) => t.note?.toLowerCase().includes(q) || t.category?.name?.toLowerCase().includes(q)
  )
}
