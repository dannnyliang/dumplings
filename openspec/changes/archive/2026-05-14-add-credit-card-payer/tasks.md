## 1. TypeScript 型別與 Helper Functions

- [x] 1.1 在 `src/types/database.ts` 將 `paid_by` 型別從 `string` 更新為 `string`（加入 JSDoc 說明允許值：user UUID | `'shared'` | `'credit_card'`）
- [x] 1.2 建立 `src/lib/paidBy.ts`，實作 `isPaidByUser`、`isPaidByShared`、`isPaidByCreditCard` helper functions
- [x] 1.3 為 `src/lib/paidBy.ts` 撰寫單元測試

## 2. TransactionFormModal 更新

- [x] 2.1 在代墊方選項中加入固定的「信用卡」選項（僅 expense 類型顯示）
- [x] 2.2 更新送出邏輯：選擇信用卡時 `paid_by = 'credit_card'`
- [x] 2.3 更新 `TransactionFormModal` 相關測試

## 3. TransactionList 更新

- [x] 3.1 在代墊方顯示邏輯中，對 `paid_by = 'credit_card'` 顯示「信用卡」標籤
- [x] 3.2 更新 `TransactionList` 相關測試

## 4. BalanceSummary 更新

- [x] 4.1 計算 `paid_by = 'credit_card'` 且 `is_reimbursed = false` 的交易總額
- [x] 4.2 在 BalanceSummary UI 顯示信用卡未還款金額（金額為 0 時隱藏）
- [x] 4.3 更新 `BalanceSummary` 相關測試
