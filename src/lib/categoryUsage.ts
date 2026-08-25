import type { Category, Transaction } from '@/types/database'

/**
 * 分類的使用頻率：以消費紀錄筆數衡量，供記帳表單決定分類選項的先後。
 *
 * 記帳表單的分類是一排橫向捲動的 chip，常用的排前面可以少捲一段。
 * 這裡只看筆數不看金額——「常用」指的是點選的頻率，跟花了多少錢無關。
 */

/** 各分類的消費紀錄筆數；未分類與已不存在的分類不列入。 */
export function countTransactionsByCategory(transactions: Transaction[]): Map<string, number> {
  const counts = new Map<string, number>()
  for (const transaction of transactions) {
    const id = transaction.category_id
    if (!id) continue
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return counts
}

/**
 * 依消費紀錄筆數由多到少排序，筆數相同時維持傳入順序（repo 已按名稱排序）。
 * 回傳新陣列，不修改傳入的 `categories`。
 */
export function sortCategoriesByUsage(
  categories: Category[],
  transactions: Transaction[]
): Category[] {
  const counts = countTransactionsByCategory(transactions)
  return categories
    .map((category, index) => ({ category, index, count: counts.get(category.id) ?? 0 }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(({ category }) => category)
}
