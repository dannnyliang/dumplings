## Why

現有模型用 `type` + `paid_by` + `is_reimbursed` + `reimbursed_at` 四個欄位描述同一件事，撐不住實際的付款情境，且首頁三個數字都不可信：

**建模問題**

- `paid_by` 把「信用卡」和「人」塞進同一個欄位（`src/lib/paidBy.ts:9`），導致 `computeBalance` 產生 key 為 `credit_card` 的代墊項（`src/lib/balance.ts:44-49`），語意是「信用卡墊付了 X 尚未還清」。但信用卡不會欠錢也不會被還錢，欠錢的是持卡人或共同帳戶。
- `is_reimbursed` 是 boolean，無法部分結算；也沒有「結算」這個事件實體，誰在何時還了多少完全沒有紀錄。
- `reimbursed_at` 有寫入（`src/lib/repos/transactions.ts:59`）但**沒有任何計算讀取它**，現金流動的時間點被記錄了卻從未使用。

**首頁數字錯誤**

- `src/app/page.tsx:19` 使用 `listRecentTransactions`（`.limit(100)`，`src/lib/repos/transactions.ts:14-21`），這份「最近 100 筆」直接餵給 `BalanceSummary`（`src/components/TransactionsBoard.tsx:71`）。
- 因此 40px 大字「共同帳戶餘額」實際是「最近 100 筆的 topup 減共同支出」；交易累積超過 100 筆後，最舊的紀錄會滑出視窗，餘額隨新增交易而漂移。
- 兩個 StatPill 標示「本月支出」「本月入帳」（`src/components/BalanceSummary.tsx:73,80`），但資料來源不是本月。專案已有 `listTransactionsInMonth`（`src/lib/repos/transactions.ts:23`），首頁沒用它。
- `computeBalance` 的 `balance = topupTotal - sharedExpenseTotal`（`src/lib/balance.ts:54`）不扣未清償代墊（`src/lib/balance.ts:31-33`），因此餘額同時偏高兩次：漏掉舊帳，也漏掉待還的墊付。

**應計與現金基礎混雜且不完整**

- `src/lib/report.ts:18-22` 依 `date` 加總全部 expense，不論付款方式與還清狀態 → 應計基礎。
- `src/lib/balance.ts:31-33` 排除未還清代墊 → 想做現金基礎，但 `computeBalance` 沒有時間維度，且月份查詢只用 `date`（`src/lib/repos/transactions.ts:28-29`）。三月刷卡、五月還清的交易，在「五月現金流出」中完全看不到。

## What Changes

- `transactions.paid_by` 三值契約與 `is_reimbursed` / `reimbursed_at` 全部移除，改為三種**付款方式**：共同帳戶、共同卡、某人（Danny / PeiYu，個人帳戶與個人信用卡視為同一件事）。
- 新增**現金移動**紀錄，涵蓋入帳、共同卡帳單扣款、結算給某人三種。結算成為有日期有金額的獨立事件，取代逐筆勾選 `is_reimbursed`。
- 首頁餘額從單一數字改為四行拆解：共同帳戶餘額、共同卡未出帳、待還墊付、可動用。
- 首頁資料來源從「最近 100 筆」改為完整計算，並修正「本月」標籤名實不符。
- 報表從分類圓餅圖改為與前期平均的比較。
- 底部導覽從 5 格縮為 3 格，分類與定期收進設定。
- 定期支出區分「金額固定」（自動產生）與「金額浮動」（到期提醒補記）。

## Capabilities

### New Capabilities

- `payment-method`: 消費紀錄的付款方式三選一，各自對應不同的現金流出時點
- `cash-movement`: 現金移動紀錄（入帳／共同卡帳單扣款／結算給某人）
- `balance-breakdown`: 首頁四行餘額拆解，同時呈現應計與現金兩種基礎
- `monthly-comparison`: 月報表以「與前期平均的差異」取代分類佔比

### Modified Capabilities

- `credit-card-payer`: 原本沒有主人的 `'credit_card'` 值，語意收斂為「帳單從共同帳戶扣款的共同卡」；個人信用卡改歸入「某人墊付」

## Impact

- **資料庫**：`transactions` 結構異動（移除 `is_reimbursed`、`reimbursed_at`，`paid_by` 改為付款方式）；新增現金移動資料表；既有資料需 migration
- **領域模組**：`src/lib/balance.ts`、`src/lib/paidBy.ts`、`src/lib/report.ts` 大幅改寫
- **資料存取**：`src/lib/repos/transactions.ts` 查詢範圍修正；新增現金移動 repo
- **UI**：`BalanceSummary`、`TransactionFormModal`、`TransactionList`、`BottomNav`、`ReportView`；新增結算流程
- **文件**：`CONTEXT.md` 的領域詞彙需整份更新（Advance、Outstanding Advance、Reimburse 等詞彙將消失）
