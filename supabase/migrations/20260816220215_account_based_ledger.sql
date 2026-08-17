-- 記帳模型改版：付款方式 + 現金移動（openspec/changes/2026-08-09-account-based-ledger）
--
-- 1. transactions 新增 payment_method（'shared' | 'joint_card' | user UUID），取代 paid_by 三值契約
-- 2. 新增 cash_movements：入帳（topup）、共同卡帳單扣款（card_bill）、結算給某人（settlement）
-- 3. 既有資料轉換後，移除 paid_by / is_reimbursed / reimbursed_at / type

-- ============================================================
-- cash_movements
-- ============================================================

create table if not exists public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  amount numeric(10, 2) not null check (amount > 0),
  date date not null default current_date,
  kind text not null check (kind in ('topup', 'card_bill', 'settlement')),
  -- 結算對象；僅 kind = 'settlement' 使用，必填由領域層把關
  -- （不設 check：counterparty 需要 on delete set null，check 會讓 profile 刪除失敗）
  counterparty uuid references public.profiles(id) on delete set null,
  note text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists cash_movements_date_idx on public.cash_movements (date);
create index if not exists cash_movements_counterparty_idx on public.cash_movements (counterparty);
create index if not exists cash_movements_created_by_idx on public.cash_movements (created_by);

alter table public.cash_movements enable row level security;

-- household 共享模型：兩人共用一份帳，彼此的現金移動皆可讀寫。
-- （insert 仍要求 created_by 是本人，維持建立者紀錄的真實性）
drop policy if exists "Authenticated users can view all cash movements" on public.cash_movements;
create policy "Authenticated users can view all cash movements"
  on public.cash_movements for select
  to authenticated
  using (true);

drop policy if exists "Authenticated users can insert own cash movements" on public.cash_movements;
create policy "Authenticated users can insert own cash movements"
  on public.cash_movements for insert
  to authenticated
  with check ((select auth.uid()) = created_by);

drop policy if exists "Authenticated users can update cash movements" on public.cash_movements;
create policy "Authenticated users can update cash movements"
  on public.cash_movements for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Authenticated users can delete cash movements" on public.cash_movements;
create policy "Authenticated users can delete cash movements"
  on public.cash_movements for delete
  to authenticated
  using (true);

-- ============================================================
-- transactions.payment_method + 資料轉換
-- ============================================================

alter table public.transactions add column if not exists payment_method text;

-- paid_by → payment_method 對照（design.md Migration Plan）：
--   'shared'      → 'shared'
--   'credit_card' → 'joint_card'
--   user UUID     → 原值
update public.transactions
set payment_method = case
  when paid_by = 'credit_card' then 'joint_card'
  else paid_by
end
where payment_method is null;

-- type = 'topup' 的交易 → 入帳現金移動
insert into public.cash_movements (amount, date, kind, note, created_by, created_at)
select amount, date, 'topup', note, created_by, created_at
from public.transactions
where type = 'topup';

-- 已還清的個人代墊 → 結算現金移動
-- reimbursed_at 為 null 者以消費日代替，並於 note 註記日期為推估值
insert into public.cash_movements (amount, date, kind, counterparty, note, created_by, created_at)
select
  amount,
  coalesce((reimbursed_at at time zone 'Asia/Taipei')::date, date),
  'settlement',
  paid_by::uuid,
  case when reimbursed_at is null then '結算日期為推估（取消費日）' end,
  created_by,
  created_at
from public.transactions
where type = 'expense'
  and is_reimbursed = true
  and paid_by not in ('shared', 'credit_card');

-- 已還清的信用卡代墊：舊模型的「還清」在新模型即共同卡帳單扣款
insert into public.cash_movements (amount, date, kind, note, created_by, created_at)
select
  amount,
  coalesce((reimbursed_at at time zone 'Asia/Taipei')::date, date),
  'card_bill',
  case when reimbursed_at is null then '扣款日期為推估（取消費日）' end,
  created_by,
  created_at
from public.transactions
where type = 'expense'
  and is_reimbursed = true
  and paid_by = 'credit_card';

-- topup 已轉為現金移動，自 transactions 移除；此後 transactions 僅剩消費紀錄
delete from public.transactions where type = 'topup';

alter table public.transactions alter column payment_method set not null;
alter table public.transactions alter column payment_method set default 'shared';

-- ============================================================
-- 移除舊欄位
-- ============================================================

alter table public.transactions drop column if exists paid_by;
alter table public.transactions drop column if exists is_reimbursed;
alter table public.transactions drop column if exists reimbursed_at;
alter table public.transactions drop column if exists type;
