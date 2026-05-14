## Why

目前代墊款項（`paid_by`）只支援「使用者先墊付」與「共同帳戶」兩種情境，但實際上有些支出是由信用卡支付、月底才還款，這類支出的「代墊方」並非某個人而是一張信用卡。因為家裡只有一張信用卡，不需要管理多張卡片，只要新增一個固定的「信用卡」選項即可。

## What Changes

- `transactions.paid_by` 新增支援固定字串 `'credit_card'`（不需動態卡片管理）
- `TransactionFormModal` 在代墊方選擇中加入固定的「信用卡」選項
- `BalanceSummary` 顯示信用卡未還款總額
- `TransactionList` 對信用卡代墊交易顯示「信用卡」標籤

## Capabilities

### New Capabilities

- `credit-card-payer`: 交易建立/編輯時可選擇「信用卡」為代墊方，`paid_by` 儲存固定字串 `'credit_card'`

### Modified Capabilities

（無現有 spec，不需 delta）

## Impact

- **資料庫**：無需新增資料表；`transactions.paid_by` 新增允許值 `'credit_card'`，更新 TypeScript 型別
- **UI**：`TransactionFormModal`、`BalanceSummary`、`TransactionList`
- **無需新頁面、無需 RLS 變更**
