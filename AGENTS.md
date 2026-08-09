<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Dumplings — Agent Guide

這份文件是所有 AI coding agent 的主入口，不綁定特定工具。`CLAUDE.md` 是指向本檔的 symlink。

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all tests (vitest)
npm run test:watch   # Tests in watch mode
npm run test:coverage # Tests with coverage report
```

Run a single test file:
```bash
npx vitest run src/components/__tests__/BalanceSummary.test.tsx
```

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

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase + Tailwind CSS v4 + Recharts + Vitest

This is a couples expense-tracking PWA for Danny + PeiYu. All data is per-household (shared via Supabase RLS, not per-user isolated).

### 架構規範（MUST follow — enforced by ESLint, see docs/adr/0001）

領域詞彙以根目錄 `CONTEXT.md` 為準；架構決策記錄在 `docs/adr/`。

**分層規則：每條領域規則只有一個家。**

| 層 | 位置 | 職責 |
|----|------|------|
| 領域模組 | `src/lib/*.ts` | 純函式 + 具名型別：`paidBy`（paid_by 三值契約唯一解讀點）、`balance`（結餘/代墊規則）、`report`（月報彙總）、`month`（YYYY-MM 契約、本地時區日期）、`money`（金額格式）、`tokens`（調色盤） |
| 資料存取 | `src/lib/repos/*.ts` | 每張資料表一個模組；select 形狀只有一份；mutation 以意圖命名；函式接受 `SupabaseClient` 參數（server/client 共用） |
| 元件/頁面 | `src/app/`、`src/components/` | 只做呈現與互動狀態，消費上面兩層 |

**元件與頁面內禁止**（ESLint `no-restricted-syntax` 會擋）：
- 直接 `supabase.from('...')` 查資料表 → 用 `src/lib/repos`
- 比對 `'shared'` / `'credit_card'` 字面值 → 用 `@/lib/paidBy` helpers
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
- `src/components/TransactionFormModal.tsx` — Shared create/edit/delete form for transactions

### Database Schema (Supabase)

Tables: `profiles`, `categories`, `transactions`, `recurring_transactions`

- `transactions.type`: `'expense' | 'topup'`
- `transactions.paid_by`: UUID of the payer, or `'shared'` for joint expenses
- `transactions.category_id` → `categories.id` (nullable for topups)
- `recurring_transactions.frequency`: `'monthly' | 'weekly'`
- All tables use RLS — authenticated users can view all rows (shared household model)
- Migrations live in `supabase/migrations/`

## Next.js Version Warning

This project uses **Next.js 16** with React 19. APIs and conventions may differ from training data. Read `node_modules/next/dist/docs/` before writing Next.js-specific code.
