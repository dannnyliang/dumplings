---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
---
# TypeScript/JavaScript Testing

> This file extends [common/testing.md](../common/testing.md) with TypeScript/JavaScript specific content.

分層策略與理由見 `docs/adr/0003-test-strategy-and-verify-command.md`。

## 改完必跑 `npm run verify`

`verify` = lint + typecheck + types:check + 單元測試 + E2E。

`npm test` 通過**不代表** app 能開。只有 `verify` 會因為真實功能壞掉而變紅，它是判斷改動是否可信的唯一依據。需要本地 Supabase 運行中（`supabase start`）。

## E2E

Playwright，測試放 `e2e/`，需要本地 Supabase。

- **`e2e/*.spec.ts` 的既有斷言不得修改。** PreToolUse hook 會在工具層直接攔截，不是靠自覺。新增測試檔不受限制；確實需要調整既有斷言時，先向使用者說明理由並取得同意。
- 這條限制的理由：auto mode 下最常見的失敗模式，是 agent 為了讓測試通過而修改斷言。斷言是契約，改它等於降低驗證強度。
- `e2e/fixtures/` 不在保護範圍，它需要能維護；但改動 fixture 若會削弱既有斷言的效力，等同修改斷言，應比照處理。
- 認證：app 只有 Google OAuth，E2E 改以 service_role 建立使用者後帳密登入。session cookie 交由 `@supabase/ssr` 產生，**不要手刻 cookie 格式**。
- `test.fixme` 用來記錄已知但尚未修復的缺陷，讓它成為可執行的文件。修復後移除標記即為驗收條件。

## 單元測試

不要寫「斷言自己呼叫了自己」的測試。以 `vi.fn()` 模擬 Supabase 再斷言 `from('transactions')` 有被呼叫，不驗證任何真實行為——欄位名打錯、型別不符、RLS 擋下都抓不到。這類驗證屬於整合測試層。

純函式（`src/lib/*.ts`）是單元測試的主場，維持現有做法。
