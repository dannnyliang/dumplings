create table public.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10, 2) not null check (amount > 0),
  type text not null check (type in ('expense', 'topup')),
  category_id uuid references public.categories(id) on delete set null,
  note text,
  paid_by text not null default 'shared',
  frequency text not null check (frequency in ('monthly', 'weekly')),
  day_of_month smallint check (day_of_month between 1 and 31),
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.recurring_transactions enable row level security;

create policy "Authenticated users can view all recurring_transactions"
  on public.recurring_transactions for select
  to authenticated
  using (true);

create policy "Authenticated users can insert recurring_transactions"
  on public.recurring_transactions for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Authenticated users can update recurring_transactions"
  on public.recurring_transactions for update
  to authenticated
  using (true)
  with check (true);

create policy "Creator can delete own recurring_transactions"
  on public.recurring_transactions for delete
  to authenticated
  using (auth.uid() = created_by);
