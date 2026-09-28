-- 供排程 ping 用的 keepalive 函式。
--
-- Why: 免費方案的 Supabase 專案若 7 天內「使用者資料庫活動」不足就會被暫停
-- （https://supabase.com/docs/guides/platform/free-project-pausing）。
-- 本專案所有資料表都只授權給 authenticated，anon 沒有任何 DML 權限，
-- 排程用 anon key 查資料表只會拿到 42501，不確定這種失敗的查詢算不算活動。
-- 因此提供一個 anon 可以執行、內容無害的函式，讓 /api/keepalive 透過
-- PostgREST 的 rpc 確實在資料庫跑一條查詢。
--
-- security invoker、空 search_path、只回傳 now()：沒有任何可被濫用的面。
-- create or replace 讓 migration 可從零重放。

create or replace function public.keepalive()
returns timestamptz
language sql
stable
security invoker
set search_path = ''
as $$
  select now();
$$;

revoke execute on function public.keepalive() from public;
grant execute on function public.keepalive() to anon, authenticated, service_role;
