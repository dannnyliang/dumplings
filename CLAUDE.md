# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

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

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Supabase + Tailwind CSS v4 + Recharts + Vitest

This is a couples expense-tracking PWA for Danny + PeiYu. All data is per-household (shared via Supabase RLS, not per-user isolated).

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
