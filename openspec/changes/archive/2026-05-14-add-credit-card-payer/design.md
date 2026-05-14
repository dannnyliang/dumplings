## Context

Dumplings 是夫妻共用的記帳 PWA。目前 `transactions.paid_by` 儲存 user UUID 或 `'shared'`。家裡只有一張信用卡，不需要動態管理卡片清單，只要新增一個固定選項即可。

## Goals / Non-Goals

**Goals:**
- `paid_by` 新增固定值 `'credit_card'`，不需資料庫結構異動
- UI 加入「信用卡」代墊選項
- BalanceSummary 顯示信用卡未還款金額
- TransactionList 顯示「信用卡」標籤

**Non-Goals:**
- 不需要信用卡管理頁面
- 不需要支援多張信用卡
- 不需要新增資料表或 RLS 異動

## Decisions

### D1：`paid_by` 使用固定字串 `'credit_card'`

**選擇**：`paid_by = 'credit_card'`（固定常數，不含 UUID）

**理由**：
- 只有一張信用卡，動態 ID 毫無必要
- 不需新增資料表，不增加查詢複雜度
- `paid_by` 已混用 UUID 與 `'shared'`，加一個固定值完全相容
- 未來若真的需要多張卡，可再從 `'credit_card'` 遷移到 `'credit_card:<uuid>'`

### D2：TypeScript 型別更新於 `src/lib/paidBy.ts`

**選擇**：集中在 helper 檔案處理 `paid_by` 的三種格式：`'shared'`、`'credit_card'`、user UUID。

**理由**：避免散落各元件的 inline 判斷，方便未來擴充。

## Risks / Trade-offs

- **未來擴充**：若需多張卡，`'credit_card'` 需遷移為 `'credit_card:<uuid>'` 格式，既有交易需 migration。→ 目前 YAGNI，接受此風險。
- **舊資料**：無影響，現有 `paid_by` 值（UUID / `'shared'`）不變。

## Migration Plan

無資料庫 migration，直接更新 TypeScript 型別與 UI 元件即可上線。
