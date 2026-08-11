# 測試分層策略與單一驗證指令

現有測試抓不到專案裡真實存在的缺陷。`src/lib/balance.ts` 的 `computeBalance` 有單元測試且計算完全正確，`BalanceSummary` 的元件測試也正確，但首頁把 `listRecentTransactions` 的 100 筆滑動視窗餵給標示「本月」的元件——**缺陷存在於兩個各自正確的模組之間的接縫上**，而所有測試都在模組內部。`src/__tests__/lib/repos.test.ts` 更是以 `vi.fn()` 斷言自己呼叫了自己，不驗證任何真實行為。

因此決定按成本效益分四層，而非只加 E2E：

| 層 | 手段 | 抓什麼 | 成本 |
|---|---|---|---|
| 型別對齊 | `supabase gen types` 後比對 git diff | schema 與 TypeScript 型別漂移 | 接近零 |
| 資料層整合 | Vitest 打本地 Supabase | RLS、真實查詢、領域計算在真資料上的行為 | 低 |
| 關鍵流程 | Playwright，3–5 條煙霧測試 | UI 接縫、實際渲染結果 | 高 |
| 純函式 | 現有 Vitest 單元測試 | 計算邏輯 | 已具備 |

`src/types/database.ts` 目前是手寫的，與 migration 之間沒有任何一致性機制。改為從 schema 產生並在驗證時比對差異，是所有措施中最便宜且立刻生效的一項。

Playwright 刻意只放少量煙霧測試：它需要繞過 Google OAuth（以本地 Supabase 的 admin API 產生 session 再注入 cookie），啟動慢且容易 flaky，不適合當主力。

## 單一驗證指令

`npm run verify` = lint + 型別檢查 + 型別產生比對 + 單元測試 + 煙霧測試。

auto mode 下的 agent 只會執行它看得到的指令，而 `npm test` 通過不代表 app 能開。**是否存在一個「會因為真實功能壞掉而變紅」的指令，是 auto mode 能否被信任的分界線。**

## 實作順序

1. 型別自動產生與比對（零成本，先做）
2. Playwright 煙霧測試（唯一不需要先重構就能建立的安全網）
3. 架構重構（ADR 0002 的 Server Actions、資料載入邏輯抽成可測函式）
4. 整合測試補上，成為主力

第 2 步的 OAuth 繞過程式碼在第 3 步之後可能需要調整，等於先付一次工。接受這個代價，因為緊接著要進行的是整個記帳模型的置換（見 `openspec/changes/2026-08-09-account-based-ledger/`），沒有安全網不應動手。

## Consequences

- E2E 斷言需受保護。auto mode 下 agent 為了讓測試通過而修改斷言，比測試不足更危險，因此以 hook 在工具層攔截對 `e2e/` 的修改，而非僅寫在規則文件裡靠自覺遵守。
- 本地 Supabase 需要 Docker，開發環境多一項依賴。
- `.agents/rules/common/testing.md` 要求 80% 覆蓋率與「E2E 為必要測試類型」，`.agents/rules/typescript/testing.md` 指定 Playwright 為 E2E 框架——這兩份規則在本 ADR 實作前都與現況不符（專案零 E2E），實作後才會一致。
