> 前置條件：本 change 動到整個記帳模型，開始前必須先完成測試安全網
> （型別自動產生、煙霧測試、`npm run verify`），否則無法驗證改動是否破壞既有行為。

## 1. 資料庫 migration

- [x] 1.1 新增 `payment_method` 欄位到 `transactions`（`shared` | `joint_card` | user UUID）
- [x] 1.2 新增 `cash_movements` 資料表（金額、日期、種類、對象、建立者）
- [x] 1.3 資料轉換：`paid_by` 依 design.md 的對照表寫入 `payment_method`
- [x] 1.4 資料轉換：`type = 'topup'` 的交易轉為 `cash_movements` 的入帳紀錄
- [x] 1.5 資料轉換：`is_reimbursed = true` 的代墊產生對應的結算紀錄（日期取 `reimbursed_at`，null 者取 `date` 並註記為推估）
- [x] 1.6 移除 `paid_by`、`is_reimbursed`、`reimbursed_at`、`type` 欄位
- [x] 1.7 為 `cash_movements` 設定 RLS（與 `transactions` 相同的 household 共享規則）
- [x] 1.8 撰寫 RLS 測試：兩個不同使用者皆可讀寫彼此的紀錄

## 2. 領域模組（先寫測試再實作）

- [x] 2.1 `src/lib/paymentMethod.ts` 取代 `paidBy.ts`：三種付款方式的唯一解讀點
- [x] 2.2 `src/lib/balance.ts` 改寫：輸出共同帳戶餘額、共同卡未出帳、待還墊付（依對象拆分）、可動用
- [x] 2.3 待還墊付改為推導值（某人的消費總額 − 已結算給他的總額），不再依賴逐筆狀態
- [x] 2.4 `src/lib/report.ts` 新增與前期平均的比較計算
- [x] 2.5 移除 `isAdvance`、`isOutstandingAdvance`、`isSharedSpending` 等舊概念

## 3. 資料存取層

- [x] 3.1 `src/lib/repos/cashMovements.ts` 新增
- [x] 3.2 `src/lib/repos/transactions.ts` 移除 `setTransactionReimbursed`
- [x] 3.3 修正首頁資料來源：餘額計算需涵蓋全部紀錄，不可用 `listRecentTransactions` 的 100 筆視窗
- [x] 3.4 明細列表與餘額計算的資料來源分離（列表可分頁，餘額不可截斷）

## 4. 首頁餘額

- [x] 4.1 `BalanceSummary` 改為四行拆解（共同帳戶餘額／共同卡未出帳／待還墊付／可動用）
- [x] 4.2 修正「本月支出」「本月入帳」標籤與資料範圍不一致的問題
- [x] 4.3 待還墊付依對象分列（Danny／PeiYu 各一行）
- [x] 4.4 負數兩行加上點擊入口

## 5. 結算流程

- [x] 5.1 共同卡帳單扣款：輸入實際帳單金額與扣款日
- [x] 5.2 結算給某人：預設帶入該對象目前的待還金額，可修改為部分金額
- [x] 5.3 帳單金額與 app 累計未出帳不符時，顯示差額提示（可能有漏記）

## 6. 記帳表單

- [x] 6.1 付款方式改為三個按鈕：共同帳戶／共同卡／我墊的
- [x] 6.2 「PeiYu 墊的」僅在編輯他人紀錄時出現
- [x] 6.3 預設帶入上次使用的付款方式

## 7. 報表

- [ ] 7.1 分類支出改為與前三月平均的差異呈現
- [ ] 7.2 評估移除 Recharts（確認無其他使用後從 dependencies 移除）

## 8. 導覽

- [ ] 8.1 `BottomNav` 從 5 格縮為 3 格（首頁／報表／FAB）
- [ ] 8.2 新增設定頁，收納分類、定期、共同卡設定
- [ ] 8.3 更新 `navDirection` 的頁面順序契約

## 9. 定期支出

- [ ] 9.1 定期模板區分「金額固定」與「金額浮動」
- [ ] 9.2 金額固定者於指定日自動產生交易
- [ ] 9.3 金額浮動者於指定日提醒補記，不自動產生

## 10. 文件

- [x] 10.1 `CONTEXT.md` 領域詞彙全面更新（移除 Advance、Outstanding Advance、Reimburse；新增付款方式、現金移動、可動用）
- [x] 10.2 `AGENTS.md` 的 Database Schema 與 Route Structure 同步更新
- [x] 10.3 新增 ADR 記錄「不建立信用卡結帳日模型」的決定與代價
