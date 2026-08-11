---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---
# 慣用寫法

這裡記錄本專案實際採用的寫法。分層規範（哪些寫法被 ESLint 擋下）見 `AGENTS.md`。

## 領域模組：純函式 + 具名型別

`src/lib/*.ts` 一個檔案是一個領域概念，只放純函式與型別，不碰 I/O。新增衍生概念時**先寫測試再寫實作**，元件只負責消費結果。

```typescript
// src/lib/balance.ts
export interface Balance {
  topupTotal: number
  sharedExpenseTotal: number
  balance: number
}

export function computeBalance(transactions: Transaction[]): Balance {
  // 純計算，不查資料庫
}
```

判準：這個函式能不能只餵一個陣列就測？不行的話，它混進了不屬於這層的東西。

## 契約集中在單一解讀點

同一個規則只能有一個家。`paid_by` 的三值判讀只在 `src/lib/paidBy.ts`、月份字串只在 `src/lib/month.ts`、金額格式只在 `src/lib/money.ts`。元件不得自行比對字面值或手刻格式（ESLint 會擋）。

這條規則的由來見 `docs/adr/0001`：同一個「代墊」概念曾被兩處用不同邊界實作，數字因此互相矛盾。

## 資料存取：函式，不是 class

`src/lib/repos/*.ts` 每張資料表一個模組。**用函式而非 Repository class**，並把 `SupabaseClient` 當參數傳入，讓 server 與 client 兩種 client 共用同一份查詢形狀。

```typescript
// src/lib/repos/transactions.ts
export const TRANSACTION_WITH_CATEGORY = '*, category:categories(id, name, emoji, color)'

export function listTransactionsInMonth(supabase: SupabaseClient, month: string) {
  const { start, end } = monthRange(month)
  return supabase.from('transactions').select(TRANSACTION_WITH_CATEGORY)
    .gte('date', start).lte('date', end)
}
```

要點：select 形狀只有一份（具名常數），mutation 以意圖命名（`setTransactionReimbursed` 而非 `updateTransaction`）。

**注意讀取範圍與用途要相符。** 拿「最近 N 筆」去算總額會得到隨資料增長而漂移的錯誤數字——這正是首頁餘額目前的缺陷（見 `openspec/changes/2026-08-09-account-based-ledger/`）。用途是彙總就不能截斷。

## 資料流：Server Component 取資料，Client Component 互動

```
page.tsx (Server)  ──props──▶  Board.tsx ('use client')  ──▶  子元件
   取資料                        互動狀態、樂觀更新
```

Server Component 用 `@/lib/supabase/server` 取資料後以 props 傳下。Client Component 目前直接用 `@/lib/supabase/client` 寫入再 `router.refresh()`——**這是預計要改的做法**，見 `docs/adr/0002`（寫入將改走 Server Actions）。新增寫入路徑前先確認該 ADR 的狀態。

## 樂觀更新

以 `useOptimistic` 持有資料，讓餘額、圖表、明細吃同一份即時資料；mutation 的套用邏輯抽成純函式以便測試。

```typescript
// src/lib/transactionsOptimistic.ts —— 純函式，可單獨測
export function applyTransactionMutation(list: Transaction[], mutation: TransactionMutation): Transaction[]

// src/components/TransactionsBoard.tsx
const [transactions, applyOptimistic] = useOptimistic(initialTransactions, applyTransactionMutation)
```

## 不採用的寫法

- **`ApiResponse<T>` 之類的統一 envelope**：本專案沒有自建 API 層，資料經由 Supabase client 或 Server Component 取得，包一層 envelope 只是多餘的轉換。
- **Repository class 與 DTO**：見上方，用函式即可。
