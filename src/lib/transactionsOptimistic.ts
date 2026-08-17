/**
 * 明細清單的樂觀更新規則，全專案唯一實作。
 *
 * 把「新增／編輯／刪除」三種意圖套用到記憶體中的陣列上，讓 UI 在 server 回應前
 * 先反映結果；router.refresh() 完成後再以真實資料對齊。消費紀錄與現金移動共用
 * 同一套規則（兩者都有 id / date / created_at）。
 * 排序刻意對齊 repo 查詢（date desc, created_at desc），
 * 避免樂觀插入的位置與 server 回來後的位置不一致而閃動。
 */

export interface LedgerRecord {
  id: string
  date: string
  created_at: string
}

export type LedgerMutation<T extends LedgerRecord> =
  | { kind: 'create'; record: T }
  | { kind: 'update'; record: T }
  | { kind: 'delete'; id: string }

/** date desc、created_at desc 的比較器（明細顯示順序的唯一定義）。 */
export function compareLedgerDesc(a: LedgerRecord, b: LedgerRecord): number {
  if (a.date !== b.date) return b.date.localeCompare(a.date)
  return b.created_at.localeCompare(a.created_at)
}

/** 依 date desc、created_at desc 排序（回傳新陣列，不動到輸入）。 */
export function sortLedger<T extends LedgerRecord>(records: readonly T[]): T[] {
  return [...records].sort(compareLedgerDesc)
}

/** 產生套用意圖後的新陣列（immutable）。 */
export function applyLedgerMutation<T extends LedgerRecord>(
  records: readonly T[],
  mutation: LedgerMutation<T>
): T[] {
  switch (mutation.kind) {
    case 'create':
      return sortLedger([...records, mutation.record])

    case 'update':
      return sortLedger(
        records.map((r) => (r.id === mutation.record.id ? mutation.record : r))
      )

    case 'delete':
      return records.filter((r) => r.id !== mutation.id)
  }
}
