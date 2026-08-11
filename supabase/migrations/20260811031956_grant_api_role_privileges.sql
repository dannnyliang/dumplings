-- 明確授予 API 角色的資料表權限。
--
-- Why: 舊版 Supabase 的 default privileges 會自動把 ALL 授予 anon/authenticated/
-- service_role，因此本專案的 migration 從未寫過 grant。新版不再如此，導致從零
-- 重建的資料庫上，authenticated 只有 REFERENCES/TRIGGER/TRUNCATE，app 無法讀寫
-- 任何資料表（SQLSTATE 42501）。正式環境因建立於舊版而未受影響，但災難復原或
-- 開設新環境時會完全失效。
--
-- 不授予 anon：所有 RLS policy 皆為 `to authenticated`，本 app 沒有匿名存取情境。
-- grant 為冪等操作，對既有環境無副作用。

grant select, insert, update, delete on all tables in schema public
  to authenticated, service_role;

grant usage, select on all sequences in schema public
  to authenticated, service_role;

-- 讓後續新增的資料表自動具備相同權限，避免同樣的缺口再次發生。
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated, service_role;

alter default privileges in schema public
  grant usage, select on sequences to authenticated, service_role;
