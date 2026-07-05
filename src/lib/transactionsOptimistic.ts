import type { Transaction } from '@/types/database'

/**
 * 明細清單的樂觀更新規則，全專案唯一實作。
 *
 * 這裡把「新增／編輯／刪除／還清」四種意圖，套用到記憶體中的 transactions 陣列上，
 * 讓 UI 在 server 回應前就先反映結果；router.refresh() 完成後再以真實資料對齊。
 * 排序刻意對齊 listRecentTransactions 的查詢（date desc, created_at desc），
 * 避免樂觀插入的位置與 server 回來後的位置不一致而閃動。
 */

export type TransactionMutation =
  | { kind: 'create'; transaction: Transaction }
  | { kind: 'update'; transaction: Transaction }
  | { kind: 'delete'; id: string }
  | { kind: 'reimburse'; id: string; isReimbursed: boolean }

/** 依 date desc、created_at desc 排序（回傳新陣列，不動到輸入）。 */
export function sortTransactions(transactions: readonly Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date)
    return b.created_at.localeCompare(a.created_at)
  })
}

/** 產生套用意圖後的新 transactions 陣列（immutable）。 */
export function applyTransactionMutation(
  transactions: readonly Transaction[],
  mutation: TransactionMutation
): Transaction[] {
  switch (mutation.kind) {
    case 'create':
      return sortTransactions([...transactions, mutation.transaction])

    case 'update':
      return sortTransactions(
        transactions.map((t) => (t.id === mutation.transaction.id ? mutation.transaction : t))
      )

    case 'delete':
      return transactions.filter((t) => t.id !== mutation.id)

    case 'reimburse':
      return transactions.map((t) =>
        t.id === mutation.id
          ? {
              ...t,
              is_reimbursed: mutation.isReimbursed,
              reimbursed_at: mutation.isReimbursed ? new Date().toISOString() : null,
            }
          : t
      )
  }
}
