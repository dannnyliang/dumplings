---
name: db-migrate
description: Supabase DB migration workflow for the Dumplings project
version: 1.0.0
---

# DB Migration — Dumplings

Supabase project ID: `axxxmtevkdqiocizedaq`  
Migration files: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`

## 1. 建立新 migration

```bash
# 產生 timestamp（格式 YYYYMMDDHHmmss）
TS=$(date +%Y%m%d%H%M%S)
# 建立檔案
touch "supabase/migrations/${TS}_description.sql"
```

在檔案內寫入 SQL，例如：
```sql
alter table categories add column if not exists emoji text;
```

## 2. 套用 migration（優先用 Supabase MCP）

### 方法 A：Supabase MCP apply_migration（推薦）

使用 `mcp__plugin_supabase_supabase__apply_migration` tool：
- `project_id`: `axxxmtevkdqiocizedaq`
- `name`: migration 檔案名稱（不含 .sql，例如 `20260504000000_categories_emoji`）
- `query`: SQL 內容

### 方法 B：CLI push（備用）

```bash
npx supabase db push
```

若失敗顯示 "migration history out of sync"，先執行 repair（見第 4 步）再重試。

## 3. 列出 migration 狀態

使用 `mcp__plugin_supabase_supabase__list_migrations` tool：
- `project_id`: `axxxmtevkdqiocizedaq`

或用 CLI：
```bash
npx supabase migration list
```

## 4. 修復 migration 歷史（repair）

當 DB 已有某 migration 的 schema 但 CLI 歷史未記錄時使用。

```bash
# 注意：只用數字 timestamp，不含底線後的描述
npx supabase migration repair --status applied 20260420000000
```

若有多筆未追蹤的 migration，逐一執行：
```bash
npx supabase migration repair --status applied 20260420000001
npx supabase migration repair --status applied 20260501000000
# ...以此類推
```

Repair 完成後再執行 `db push` 或確認 `list_migrations` 狀態為 applied。

## 常見錯誤

| 錯誤 | 原因 | 解法 |
|------|------|------|
| `relation already exists` | Migration 已在 DB 存在但未被追蹤 | 執行 `migration repair --status applied <NUMERIC_VERSION>` |
| `invalid version number` | repair 時帶了描述文字 | 只用數字部分，如 `20260420000000` |
| `Cannot find project ref` | 未 link project | `npx supabase link --project-ref axxxmtevkdqiocizedaq` |
