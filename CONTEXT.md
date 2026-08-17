# Dumplings — 共同記帳

Danny 與 PeiYu 的夫妻共同記帳 PWA。所有資料屬於同一個 household（Supabase RLS 共享），核心問題是「共同帳戶還剩多少、誰墊了多少還沒還」。

模型設計的決策與代價記錄在 `openspec/changes/2026-08-09-account-based-ledger/design.md` 與 `docs/adr/0005`。

## Language

**Transaction（消費紀錄）**:
一筆共同開銷，必有 **Payment Method**，可歸屬一個 **Category**。入帳不是 Transaction（見 **Cash Movement**）。
_Avoid_: expense/topup 二分（`type` 欄位已移除）、record、紀錄（單獨使用時）

**Payment Method（付款方式）**:
`payment_method` 欄位的三值契約——`'shared'`（共同帳戶）、`'joint_card'`（共同卡）、user UUID（某人墊付）。三者的差別只在**共同帳戶的現金流出時點**：消費日／帳單扣款日／結算日。費用發生時點一律是消費日。唯一解讀點是 `src/lib/paymentMethod.ts`。
_Avoid_: 直接比對 `'shared'` / `'joint_card'` 字面值、paid_by（舊欄位）

**Shared Account（共同帳戶）**:
兩人共同出資的資金池。
_Avoid_: 公費、公款

**Joint Card（共同卡）**:
為共同帳戶申辦、帳單由共同帳戶扣款的信用卡。個人信用卡**不是**共同卡——對本 app 而言，個人帳戶與個人信用卡都是「某人墊付」。
_Avoid_: credit_card（舊值，語意含混）、信用卡（單獨使用時，須區分共同卡與個人卡）

**Cash Movement（現金移動）**:
共同帳戶的現金進出紀錄，`kind` 三選一：**Topup（入帳）**、**Card Bill（帳單扣款）**、**Settlement（結算）**。現金移動的日期是共同帳戶餘額變動的**唯一**時間依據。唯一解讀點是 `src/lib/cashMovement.ts`。

**Topup（入帳）**:
存進共同帳戶的錢，是一種 Cash Movement。
_Avoid_: income、收入、deposit

**Card Bill（帳單扣款）**:
共同卡帳單自共同帳戶扣款的紀錄，金額由使用者輸入實際帳單金額。與 app 累計未出帳不符時顯示差額提示——這是「共同卡只用於共同開銷」假設下唯一的自動偵錯機制。

**Settlement（結算）**:
從共同帳戶付錢給某位使用者、沖銷其墊付的紀錄，有日期、金額、對象，支援部分結算。
_Avoid_: reimburse、還清（程式碼識別字；口語可）、settle（單獨使用時）

**Balance Breakdown（餘額拆解）**:
首頁的四行數字，實作在 `src/lib/balance.ts` 的 `computeBalance`：
- **共同帳戶餘額**（`cashBalance`）＝ Σ入帳 − Σ共同帳戶支付的消費 − Σ帳單扣款 − Σ結算（現金基礎）
- **共同卡未出帳**（`cardUnbilled`）＝ Σ共同卡消費 − Σ帳單扣款（應計）
- **待還墊付**（`advancesByUser`）＝ 某人墊付的消費總額 − 已結算給他的總額（推導值，不在消費紀錄上保存狀態）
- **可動用**（`available`）＝ 共同帳戶餘額 − 未出帳 − 待還墊付總額

_Avoid_: Balance 單獨使用（要指明是哪一行）、advance/outstanding advance（舊概念，已由待還墊付的推導取代）

**Category（分類）**:
消費紀錄的歸類（emoji + 顏色）；未指定顏色時依名稱自動配色（`paletteForCategoryName`）。

**Recurring Template（定期模板）**:
每月/每週固定產生紀錄的模板；type 為 expense 產生消費紀錄、topup 產生入帳現金移動。「今天記一筆」= 立即以模板內容建立。模板仍以舊 `paid_by` 值儲存，轉換函式為 `paymentMethodFromLegacyPaidBy`（模板改版時一併汰換）。
_Avoid_: 訂閱、固定支出（那是它的金額彙總，不是模板本身）

**Month（月份）**:
本地時區的 `'YYYY-MM'` 字串，是報表查詢與導航的共同契約。唯一實作在 `src/lib/month.ts`。

## Relationships

- 一筆 **Transaction** 有一個 **Payment Method**；一筆 **Cash Movement** 有一個 kind，**Settlement** 必有對象
- 共同帳戶餘額只被 **Cash Movement** 與共同帳戶支付的 **Transaction** 改變
- **待還墊付** ＝ Σ某人墊付的 Transaction − Σ給他的 Settlement（推導值）
- **共同卡未出帳** ＝ Σ共同卡 Transaction − Σ **Card Bill**
- 報表以消費日歸屬月份（應計基礎），不受付款方式與結算時點影響
- 一個 **Recurring Template** 產生多筆 Transaction 或 Topup
- 一筆 **Transaction** 屬於至多一個 **Category**；**Cash Movement** 不分類

## Example dialogue

> **Dev:**「這筆晚餐 PeiYu 用她自己的信用卡付的，要選共同卡嗎？」
> **Domain expert:**「不行——共同卡專指帳單從共同帳戶扣款的那張卡。她用個人卡付就是『PeiYu 墊的』，金額進她的**待還墊付**；哪天從共同帳戶**結算**給她（可以只還一部分），餘額才真的減少。」

## Flagged ambiguities

- 「代墊」曾被兩處程式碼用不同邊界實作——已隨模型改版消解：待還墊付是推導值，只有一個計算點（`src/lib/balance.ts`）。
- 「本月」在報表頁曾同時存在兩份月份計算——已解決：**Month** 契約只有 `src/lib/month.ts` 一個家。
- **歷史資料的結算日期部分為推估值**：2026-08 模型改版時，舊資料中 `reimbursed_at` 為 null 的已還清代墊，其結算現金移動以消費日代替（note 有註記）。這不影響未來使用，但「過去某月實際現金流出」的回溯查詢在該批資料上不精確。
