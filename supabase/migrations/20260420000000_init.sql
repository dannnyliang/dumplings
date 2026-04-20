-- profiles
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view all profiles"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Authenticated users can view active categories"
  on public.categories for select
  to authenticated
  using (is_active = true);

create policy "Authenticated users can insert categories"
  on public.categories for insert
  to authenticated
  with check (auth.uid() = created_by);

create policy "Creator can update own categories"
  on public.categories for update
  to authenticated
  using (auth.uid() = created_by);

-- seed default categories
insert into public.categories (name, created_by) values
  ('餐飲', null),
  ('交通', null),
  ('購物', null),
  ('娛樂', null),
  ('醫療', null),
  ('日用品', null),
  ('其他', null);

-- transactions
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10, 2) not null check (amount > 0),
  type text not null check (type in ('expense', 'topup')),
  category_id uuid references public.categories(id) on delete set null,
  date date not null default current_date,
  note text,
  paid_by text not null default 'shared',
  is_reimbursed boolean not null default false,
  reimbursed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Authenticated users can view all transactions"
  on public.transactions for select
  to authenticated
  using (true);

create policy "Authenticated users can insert transactions"
  on public.transactions for insert
  to authenticated
  with check (auth.uid() = created_by::uuid);

create policy "Creator can update own transactions"
  on public.transactions for update
  to authenticated
  using (auth.uid() = created_by::uuid);

create policy "Creator can delete own transactions"
  on public.transactions for delete
  to authenticated
  using (auth.uid() = created_by::uuid);
