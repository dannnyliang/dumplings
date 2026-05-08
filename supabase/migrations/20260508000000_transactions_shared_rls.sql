-- Shared household model: any authenticated user can update/delete transactions
-- Why: SELECT was already open to all authenticated users, but UPDATE/DELETE
-- restricted to created_by, causing silent no-op deletes for partner's rows.
drop policy if exists "Creator can update own transactions" on public.transactions;
drop policy if exists "Creator can delete own transactions" on public.transactions;

create policy "Authenticated users can update transactions"
  on public.transactions for update
  to authenticated
  using (true)
  with check (true);

create policy "Authenticated users can delete transactions"
  on public.transactions for delete
  to authenticated
  using (true);
