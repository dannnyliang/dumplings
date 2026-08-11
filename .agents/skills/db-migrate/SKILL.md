---
name: db-migrate
description: Supabase DB migration workflow for the Dumplings project. Use when adding, altering, or removing database tables, columns, RLS policies, or when a migration fails to apply.
version: 2.0.0
---

# DB Migration — Dumplings

正式專案 ID：`axxxmtevkdqiocizedaq`
Migration 檔案：`supabase/migrations/YYYYMMDDHHMMSS_description.sql`

## 鐵則：先在本地驗證，才推正式

**絕對不要在本地重放通過之前對正式專案套用 migration。**

2026-08-09 首次以本地 stack 重放整串 migration 時，一次抓到兩個潛伏三個月的缺陷：`20260508000000` 重複建立同名 policy 導致無法從零重放；全部 migration 沒有任何 `grant`，使得重建出來的資料庫上 `authenticated` 對所有資料表沒有 DML 權限。兩者在逐步演進的正式環境都不會現形——**只有從零重放會現形**。

## 標準流程

```bash
# 0. 確認本地 stack 運行中（需要 Docker）
supabase start

# 1. 建立 migration
TS=$(date +%Y%m%d%H%M%S)
touch "supabase/migrations/${TS}_description.sql"

# 2. 寫 SQL（見下方撰寫規則）

# 3. 從零重放全部 migration —— 這一步是重點
npm run db:reset

# 4. schema 有變就必須重新產生型別，否則 verify 會失敗
npm run types:generate

# 5. 全套驗證：lint + typecheck + types:check + unit + e2e
npm run verify

# 6. 以上全綠，才推正式
supabase db push
```

`npm run db:reset` 會一併重啟 Kong。`supabase db reset` 本身只重啟 auth 等容器而不重啟 Kong，導致 Kong 的 upstream 指向已消失的容器，API 一律回 502，症狀看起來像 auth 壞掉。

## 撰寫規則

**冪等，且能從零重放。** 任何 `create policy` 前先 `drop policy if exists`，欄位用 `add column if not exists`。判準是：整串 migration 從空資料庫跑一次必須成功。

```sql
-- CORRECT
drop policy if exists "Authenticated users can update transactions" on public.transactions;
create policy "Authenticated users can update transactions"
  on public.transactions for update to authenticated
  using (true) with check (true);
```

**新資料表必須設定 RLS 與 policy。** 本專案是 household 共享模型，policy 一律 `to authenticated`，不開放 `anon`。

```sql
alter table public.新表 enable row level security;
create policy "..." on public.新表 for select to authenticated using (true);
```

**權限不必手動 grant。** `20260809000000_grant_api_role_privileges.sql` 已設定 default privileges，之後新增的資料表會自動取得 `authenticated` 與 `service_role` 的 DML 權限。若 E2E 出現 `permission denied for table`（SQLSTATE 42501），代表那份 default privileges 沒生效，回頭檢查而不是散落地補 grant。

**RLS policy 內呼叫函式要包在 select 裡。** `using (auth.uid() = created_by)` 會對每一列呼叫一次；`using ((select auth.uid()) = created_by)` 只呼叫一次。本專案資料量小、目前無感，新寫的仍照正確寫法。

## 型別

`src/types/database.ts` 從 `src/types/supabase.ts` 衍生，而後者由 schema 產生、**不得手改**。schema 改動後沒跑 `npm run types:generate`，`npm run verify` 的 `types:check` 階段會直接失敗。

## 修復 migration 歷史（僅正式環境）

當正式 DB 已有某 migration 的 schema 但 CLI 歷史未記錄時使用。

```bash
# 只用數字 timestamp，不含底線後的描述
supabase migration repair --status applied 20260420000000
```

多筆未追蹤時逐一執行，完成後再 `supabase db push`。

## 常見錯誤

| 錯誤 | 原因 | 解法 |
|------|------|------|
| `policy ... already exists`（42710） | migration 不冪等，先前的 migration 已建立同名 policy | 在 `create policy` 前補 `drop policy if exists` |
| `permission denied for table`（42501） | 角色缺 DML 權限 | 檢查 `20260809000000` 的 default privileges 是否生效 |
| `relation already exists` | Migration 已在 DB 存在但未被追蹤 | `supabase migration repair --status applied <NUMERIC_VERSION>` |
| `invalid version number` | repair 時帶了描述文字 | 只用數字部分，如 `20260420000000` |
| `Cannot find project ref` | 未 link project | `supabase link --project-ref axxxmtevkdqiocizedaq` |
| API 全部回 502 | `supabase db reset` 後 Kong 未重啟 | 用 `npm run db:reset`，或 `docker restart $(docker ps -q -f name=supabase_kong)` |
| `verify` 的 types:check 失敗 | schema 改了但型別沒重新產生 | `npm run types:generate` |

## 推正式的另一條路：Supabase MCP

`.claude/settings.json` 啟用了 supabase plugin，因此有 `mcp__plugin_supabase_supabase__*` 系列工具可用。`apply_migration` 走 OAuth，**不需要 db password 也不需要 `supabase login`**，在 CLI 認證卡住時是可行的替代路徑。

**但它會用自己產生的 timestamp 記錄版本號，不會沿用你的檔名。** 2026-08-11 實測：本地檔案是 `20260809000000_grant_api_role_privileges.sql`，正式歷史記成 `20260811031956`。版本號不一致的話，下次 `supabase db push` 會認為該份尚未套用而再推一次。

用 MCP 套用後，**務必把本地檔案改名為正式歷史顯示的版本號**：

```bash
# 先確認正式的版本號
#   mcp__plugin_supabase_supabase__list_migrations
git mv supabase/migrations/<本地版本>_<name>.sql \
       supabase/migrations/<正式版本>_<name>.sql
npm run db:reset   # 確認改名後仍能從零重放
```

## 正式專案會被暫停

免費 tier 閒置一段時間後專案會進入 INACTIVE。此時 CLI 會回報連線逾時，並誤導性地建議「設定 `SUPABASE_DB_PASSWORD`」——那不是真正的原因。

連不上時先查狀態（`mcp__plugin_supabase_supabase__list_projects`），`COMING_UP` 代表正在恢復，等它變成 `ACTIVE_HEALTHY` 再操作。
