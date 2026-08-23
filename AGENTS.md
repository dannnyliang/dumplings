<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dumplings — Agent Guide

這份文件是所有 AI coding agent 的主入口，不綁定特定工具。`CLAUDE.md` 是指向本檔的 symlink。

## Commands

```bash
npm run verify       # 改完必跑：lint + typecheck + types:check + unit + e2e
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm run test         # Unit tests (vitest)
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage report
npm run e2e          # Playwright 煙霧測試
npm run e2e:ui       # Playwright UI 模式
```

Run a single test file:
```bash
npx vitest run src/__tests__/components/BalanceSummary.test.tsx
```

### 本地 Supabase

`types:check` 與 `e2e` 都需要本地 stack，但**不必手動啟動**——`dev`、`e2e`、`types:generate`、`db:reset` 都會先呼叫 `db:ensure`，它會確保 Docker 與 Supabase 都在運行（見 `scripts/ensure-supabase.sh`）。

```bash
npm run db:ensure    # 確保本地 stack 運行中（各指令自動呼叫）
npm run db:stop      # 關閉本地 stack
npm run db:reset     # 重置資料庫並重啟 Kong
npm run types:generate # 從本地 schema 重新產生型別
```

`npm run db:reset` 一併重啟 Kong 是必要的：`supabase db reset` 會重啟 auth 容器但不重啟 Kong，導致其 upstream 指向已消失的容器，API 回 502。

`npm test` 通過**不代表** app 能開——只有 `verify` 會因為真實功能壞掉而變紅。

**`e2e/*.spec.ts` 的既有斷言受 PreToolUse hook 保護，無法直接修改。** 新增測試不受限制；需要調整既有斷言時先向使用者說明理由。

## AI 設定檔架構

**所有 agent 設定的唯一來源是 `.agents/`**，工具中立、可整包搬移：

| 路徑 | 內容 |
|------|------|
| `AGENTS.md` | 主入口（本檔），跨工具通用格式 |
| `.agents/rules/` | 分語言規則；每個檔案用 frontmatter `paths:` glob 宣告適用範圍 |
| `.agents/skills/` | Skill（目錄 + `SKILL.md`）；第三方 skill 由 `skills-lock.json` 管理 |
| `.agents/commands/` | Slash command 定義 |

`.claude/` 底下的 `rules`、`skills`、`commands` 都是指向 `.agents/` 的 **symlink**，只為了讓 Claude Code 的自動載入生效；**不要在 `.claude/` 底下新增實體檔案**，一律加在 `.agents/`。

唯一的例外是 `.claude/settings.json` 與 `.claude/settings.local.json`（hooks、permissions、plugins）——這些沒有跨工具標準，只能留在 Claude 專屬位置。

## Git

**Commit 必須 atomic：一個 commit 只做一件事。** 判準是能不能用一句話說完它做了什麼，而且單獨 revert 不會留下半套狀態。搬檔案、修正內容、新增功能是三件事，即使發生在同一次工作裡也要分開 commit——需要時先把混在一起的改動拆回去，再分批 stage。

格式為 conventional commits：

```
<type>: <description>

<body：說明為什麼要改，不是重複改了什麼>
```

type：`feat` / `fix` / `refactor` / `docs` / `test` / `chore` / `perf` / `ci`

其他慣例：

- 不在 `main` 上直接 commit，先開分支
- 開始工作前確認不是 detached HEAD（`git status -sb` 顯示 `## HEAD (no branch)` 就是）
- body 寫清楚成因與影響，特別是修 bug 時要說明它為何沒被更早發現
- PR 說明要涵蓋整個分支的 commit，不是只有最後一個

**每個 PR 都必須含有 `supabase/` 的變動**，否則 Supabase GitHub integration 會跳過建立 preview branch（check 顯示 `skipped — No changes detected in supabase directory`），Vercel preview 就拿不到 `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`，`src/proxy.ts` 建 client 時丟錯，整站 500。關掉這個限制需要 Supabase 付費方案。

所以**開 PR 前一律先跑**：

```bash
npm run pr:trigger    # 分支已動過 supabase/ 就自動跳過
```

它會寫 `supabase/.preview-trigger` 並補一筆 `chore: 觸發 Supabase preview branch`。這個檔案的內容沒有意義，不要手動改。

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase + Tailwind CSS v4 + Recharts + Vitest

This is a couples expense-tracking PWA for Danny + PeiYu. All data is per-household (shared via Supabase RLS, not per-user isolated).

### 架構規範（MUST follow — enforced by ESLint, see docs/adr/0001）

領域詞彙以根目錄 `CONTEXT.md` 為準；架構決策記錄在 `docs/adr/`。

**分層規則：每條領域規則只有一個家。**

| 層 | 位置 | 職責 |
|----|------|------|
| 領域模組 | `src/lib/*.ts` | 純函式 + 具名型別：`paymentMethod`（payment_method 三值契約唯一解讀點）、`cashMovement`（現金移動的名稱與資金方向）、`balance`（餘額四行拆解）、`report`（月報彙總、前期比較）、`month`（YYYY-MM 契約、本地時區日期）、`money`（金額格式）、`tokens`（調色盤） |
| 資料存取 | `src/lib/repos/*.ts` | 每張資料表一個模組；select 形狀只有一份；mutation 以意圖命名；函式接受 `SupabaseClient` 參數（server/client 共用） |
| 元件/頁面 | `src/app/`、`src/components/` | 只做呈現與互動狀態，消費上面兩層 |

**元件與頁面內禁止**（ESLint `no-restricted-syntax` 會擋）：
- 直接 `supabase.from('...')` 查資料表 → 用 `src/lib/repos`
- 比對 `'shared'` / `'joint_card'` 字面值 → 用 `@/lib/paymentMethod` helpers
- `toLocaleString` 手刻金額 → 用 `formatMoney` / `formatSignedMoney`
- 手刻月份/日期字串運算 → 用 `@/lib/month`

**新增衍生概念時**：先在 `src/lib/` 寫測試與純函式（TDD），元件再消費；不要把規則 inline 在元件裡。

### Route Structure

| Route | Type | Purpose |
|-------|------|---------|
| `/` | Server Component | Dashboard — recent transactions + balance |
| `/login` | Client Component | Google OAuth login |
| `/categories` | Server + `CategoryManager` client | Manage expense categories |
| `/reports?month=YYYY-MM` | Server + `ReportView` client | Monthly pie chart + transaction list |
| `/recurring` | Server + `RecurringManager` client | Manage recurring transactions |
| `/auth/callback` | Route Handler | Supabase OAuth callback |
| `/auth/signout` | Route Handler | POST to sign out |

**Pattern:** Server Components fetch data from Supabase (using `@/lib/supabase/server`), then pass it as props to `'use client'` components that handle interaction. Client components call Supabase directly (using `@/lib/supabase/client`) for mutations, then call `router.refresh()` to re-sync server state.

### Key Files

- `src/lib/supabase/server.ts` — SSR Supabase client (uses `next/headers` cookies)
- `src/lib/supabase/client.ts` — Browser Supabase client
- `src/types/database.ts` — Shared TypeScript types for all DB tables
- `src/components/TransactionFormModal.tsx` — Shared create/edit/delete form for transactions（入帳分頁寫入 cash_movements）
- `src/components/CashMovementFormModal.tsx` — 帳單扣款／結算／編輯現金移動的表單

### Database Schema (Supabase)

Tables: `profiles`, `categories`, `transactions`, `cash_movements`, `recurring_transactions`

- `transactions` 只有消費紀錄（沒有 `type` 欄位；入帳在 `cash_movements`）
- `transactions.payment_method`: 三值契約 — `'shared'`（共同帳戶）、`'joint_card'`（共同卡）、或墊付者的 user UUID。唯一解讀點是 `src/lib/paymentMethod.ts`
- `transactions.category_id` → `categories.id` (nullable)
- `cash_movements.kind`: `'topup' | 'card_bill' | 'settlement'`；`settlement` 需有 `counterparty`（user UUID）。唯一解讀點是 `src/lib/cashMovement.ts`
- `recurring_transactions.frequency`: `'monthly' | 'weekly'`；模板仍以舊 `paid_by` 值儲存（見 `paymentMethodFromLegacyPaidBy`）
- All tables use RLS — authenticated users can view all rows (shared household model)
- Migrations live in `supabase/migrations/`

## Next.js Version Warning

This project uses **Next.js 16** with React 19. APIs and conventions may differ from training data. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.
