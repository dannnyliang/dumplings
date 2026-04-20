-- Allow viewing ALL categories (including inactive) for management page
drop policy if exists "Authenticated users can view active categories" on public.categories;

create policy "Authenticated users can view all categories"
  on public.categories for select
  to authenticated
  using (true);

-- Allow any authenticated user to update any category (needed to deactivate system categories)
drop policy if exists "Creator can update own categories" on public.categories;

create policy "Authenticated users can update categories"
  on public.categories for update
  to authenticated
  using (true)
  with check (true);

-- Allow any authenticated user to delete their own user-created categories
create policy "Creator can delete own categories"
  on public.categories for delete
  to authenticated
  using (auth.uid() = created_by);

-- Allow any authenticated user to update any transaction (needed for reimbursement by either party)
drop policy if exists "Creator can update own transactions" on public.transactions;

create policy "Authenticated users can update transactions"
  on public.transactions for update
  to authenticated
  using (true)
  with check (true);
