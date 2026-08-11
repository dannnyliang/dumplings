-- Shared household model: any authenticated user can update/delete transactions
-- Why: SELECT was already open to all authenticated users, and UPDATE was opened in
-- 20260420000001, but DELETE remained restricted to created_by, causing silent no-op
-- deletes for partner's rows.
--
-- The update policy below duplicates 20260420000001; it is kept so this migration
-- fully declares the intended end state, and all policies are dropped first so the
-- migration stays idempotent when replayed from scratch.
drop policy if exists "Creator can update own transactions" on public.transactions;
drop policy if exists "Creator can delete own transactions" on public.transactions;
drop policy if exists "Authenticated users can update transactions" on public.transactions;
drop policy if exists "Authenticated users can delete transactions" on public.transactions;

create policy "Authenticated users can update transactions"
  on public.transactions for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete transactions"
  on public.transactions for delete
  to authenticated
  using (true);
