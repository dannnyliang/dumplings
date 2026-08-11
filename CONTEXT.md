# Dumplings — 共同記帳

Danny 與 PeiYu 的夫妻共同記帳 PWA。所有資料屬於同一個 household（Supabase RLS 共享），核心問題是「共同帳戶還剩多少、誰墊了多少還沒還」。

> **本文件描述的是現行模型，它即將被整批取代。**
>
> 新模型的設計已完成於 `openspec/changes/2026-08-09-account-based-ledger/`（尚未實作）：付款方式改為三選一決定現金流出時點、現金移動紀錄取代 `is_reimbursed`、首頁餘額拆成四行同時呈現應計與現金。屆時下方的 **Advance**、**Outstanding Advance**、**Reimburse** 等詞彙都會消失。
>
> 動手改記帳邏輯之前，先讀那份 change 的 `design.md`——它記錄了每個決策的理由與代價。

## Language

**Transaction（交易）**:
一筆記帳，type 為 **Expense** 或 **Topup**。
_Avoid_: record、紀錄（單獨使用時）

**Expense（支出）**:
花掉錢的交易，一定有 **Payer**，可歸屬一個 **Category**。

**Topup（入帳）**:
存進 **Shared Account** 的錢；Payer 一律記為 shared。
_Avoid_: income、收入、deposit

**Shared Account（共同帳戶）**:
兩人共同出資的資金池；**Balance** 即它的餘額。
_Avoid_: 公費、公款

**Payer（付款人）**:
`paid_by` 欄位的三值契約——`'shared'`（共同帳戶）、`'credit_card'`（信用卡）、user UUID（某人先墊）。唯一解讀點是 `src/lib/paidBy.ts`。
_Avoid_: 直接比對 `'shared'` / `'credit_card'` 字面值

**Advance（代墊）**:
由非共同帳戶的 Payer 支付的 Expense，不論是否已還清。
_Avoid_: 借支、墊款（口語可，程式碼一律 advance）

**Outstanding Advance（未清償代墊）**:
尚未 **Reimburse** 的 Advance；不計入共同支出，會顯示「某人墊付了 X，尚未還清」。

**Reimburse（還清）**:
從共同帳戶結清一筆 Advance；還清後該筆視同共同帳戶買單，計入共同支出。
_Avoid_: settle、償還

**Balance（結餘）**:
Topup 總額減去共同支出（shared 支付的 Expense + 已還清的 Advance）。實作在 `src/lib/balance.ts` 的 `computeBalance`。

**Category（分類）**:
Expense 的歸類（emoji + 顏色）；未指定顏色時依名稱自動配色（`paletteForCategoryName`）。

**Recurring Template（定期模板）**:
每月/每週固定產生 Transaction 的模板；「今天記一筆」= 立即以模板內容建立一筆 Transaction。
_Avoid_: 訂閱、固定支出（那是它的金額彙總，不是模板本身）

**Month（月份）**:
本地時區的 `'YYYY-MM'` 字串，是報表查詢與導航的共同契約。唯一實作在 `src/lib/month.ts`。

## Relationships

- 一筆 **Transaction** 有一個 **Payer**；type 為 Topup 時 Payer 恆為 shared
- **Advance** ⊂ **Expense**（Payer ≠ shared）；**Outstanding Advance** ⊂ **Advance**（未 Reimburse）
- **Balance** = Σ**Topup** − Σ(shared **Expense** + 已 Reimburse 的 **Advance**)
- 一個 **Recurring Template** 產生多筆 **Transaction**
- 一筆 **Expense** 屬於至多一個 **Category**；**Topup** 不分類

## Example dialogue

> **Dev:**「這筆晚餐 PeiYu 用信用卡付的，會扣到共同帳戶嗎？」
> **Domain expert:**「不會——那是一筆 **Advance**，**Payer** 是信用卡。在按下**還清**之前它是 **Outstanding Advance**，不影響 **Balance**；還清那一刻才計入共同支出。」

## Flagged ambiguities

- 「代墊」曾被兩處程式碼用不同邊界實作（一處含已還清、一處不含）——已解決：**Advance**（含已還清）與 **Outstanding Advance**（僅未還清）是兩個概念，都以 `src/lib/balance.ts` 為準。
- 「本月」在報表頁曾同時存在兩份月份計算——已解決：**Month** 契約只有 `src/lib/month.ts` 一個家。
